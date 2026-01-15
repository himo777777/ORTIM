import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, CacheKeys, CacheTTL } from '../redis/cache.service';

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  attemptWindowMinutes: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

@Injectable()
export class SecurityService {
  private readonly lockoutConfig: LockoutConfig = {
    maxAttempts: 5,
    lockoutDurationMinutes: 15,
    attemptWindowMinutes: 15,
  };

  private readonly rateLimitConfig: RateLimitConfig = {
    maxRequests: 100,
    windowSeconds: 60,
  };

  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  // ============================================
  // ACCOUNT LOCKOUT
  // ============================================

  /**
   * Check if an account is locked
   */
  async isAccountLocked(identifier: string): Promise<boolean> {
    const lockKey = `lockout:${identifier}`;
    const isLocked = await this.cache.exists(lockKey);

    if (isLocked) {
      const ttl = await this.cache.ttl(lockKey);
      throw new ForbiddenException(
        `Kontot är låst. Försök igen om ${Math.ceil(ttl / 60)} minuter.`
      );
    }

    return false;
  }

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(
    identifier: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Save to database for audit trail
    await this.prisma.loginAttempt.create({
      data: {
        identifier,
        success,
        ipAddress,
        userAgent,
      },
    });

    if (success) {
      // Clear failed attempts on successful login
      await this.cache.del(`attempts:${identifier}`);
      return;
    }

    // Increment failed attempts in cache
    const attemptsKey = `attempts:${identifier}`;
    const attempts = await this.cache.incr(attemptsKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await this.cache.expire(attemptsKey, this.lockoutConfig.attemptWindowMinutes * 60);
    }

    // Lock account if max attempts reached
    if (attempts >= this.lockoutConfig.maxAttempts) {
      const lockKey = `lockout:${identifier}`;
      await this.cache.set(lockKey, true, {
        ttl: this.lockoutConfig.lockoutDurationMinutes * 60,
      });

      // Clear attempts counter
      await this.cache.del(attemptsKey);

      throw new ForbiddenException(
        `För många misslyckade inloggningsförsök. Kontot är låst i ${this.lockoutConfig.lockoutDurationMinutes} minuter.`
      );
    }
  }

  /**
   * Get remaining attempts for an identifier
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    const attemptsKey = `attempts:${identifier}`;
    const attempts = await this.cache.get<number>(attemptsKey);
    return this.lockoutConfig.maxAttempts - (attempts || 0);
  }

  /**
   * Manually unlock an account (admin function)
   */
  async unlockAccount(identifier: string): Promise<void> {
    await this.cache.del(`lockout:${identifier}`);
    await this.cache.del(`attempts:${identifier}`);
  }

  // ============================================
  // PER-USER RATE LIMITING
  // ============================================

  /**
   * Check and enforce rate limit for a user
   */
  async checkRateLimit(userId: string, endpoint?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const key = endpoint
      ? `ratelimit:${userId}:${endpoint}`
      : CacheKeys.rateLimitUser(userId);

    const requests = await this.cache.incr(key);

    // Set expiry on first request
    if (requests === 1) {
      await this.cache.expire(key, this.rateLimitConfig.windowSeconds);
    }

    const remaining = Math.max(0, this.rateLimitConfig.maxRequests - requests);
    const resetIn = await this.cache.ttl(key);

    if (requests > this.rateLimitConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn,
      };
    }

    return {
      allowed: true,
      remaining,
      resetIn,
    };
  }

  /**
   * Enforce rate limit - throws exception if exceeded
   */
  async enforceRateLimit(userId: string, endpoint?: string): Promise<void> {
    const result = await this.checkRateLimit(userId, endpoint);

    if (!result.allowed) {
      throw new ForbiddenException(
        `För många förfrågningar. Försök igen om ${result.resetIn} sekunder.`
      );
    }
  }

  /**
   * Get rate limit status for response headers
   */
  async getRateLimitHeaders(userId: string): Promise<Record<string, string>> {
    const result = await this.checkRateLimit(userId);

    return {
      'X-RateLimit-Limit': String(this.rateLimitConfig.maxRequests),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetIn),
    };
  }

  // ============================================
  // SECURITY CHECKS
  // ============================================

  /**
   * Check for suspicious activity patterns
   */
  async checkSuspiciousActivity(userId: string, ipAddress?: string): Promise<boolean> {
    // Check for multiple IPs in short time
    const recentLogins = await this.prisma.loginAttempt.findMany({
      where: {
        identifier: userId,
        success: true,
        attemptedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      select: { ipAddress: true },
    });

    const uniqueIps = new Set(recentLogins.map((l) => l.ipAddress).filter(Boolean));

    // Flag if more than 3 different IPs in an hour
    if (uniqueIps.size > 3) {
      return true;
    }

    return false;
  }

  /**
   * Get failed login attempts for monitoring
   */
  async getFailedLoginAttempts(options: {
    identifier?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    const { identifier, fromDate, toDate, limit = 100 } = options;

    const where: Record<string, unknown> = { success: false };

    if (identifier) where.identifier = identifier;
    if (fromDate || toDate) {
      where.attemptedAt = {};
      if (fromDate) (where.attemptedAt as Record<string, Date>).gte = fromDate;
      if (toDate) (where.attemptedAt as Record<string, Date>).lte = toDate;
    }

    return this.prisma.loginAttempt.findMany({
      where,
      orderBy: { attemptedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Clean up old login attempts (for scheduled job)
   */
  async cleanupOldAttempts(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.loginAttempt.deleteMany({
      where: {
        attemptedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
