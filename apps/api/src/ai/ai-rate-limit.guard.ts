import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../common/redis/cache.service';
import { ConfigService } from '@nestjs/config';

export const AI_RATE_LIMIT_KEY = 'ai_rate_limit';

export interface AiRateLimitOptions {
  maxRequests?: number;
  windowSeconds?: number;
}

// Decorator to set custom rate limit for specific endpoints
export function AiRateLimit(options: AiRateLimitOptions) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AI_RATE_LIMIT_KEY, options, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly defaultMaxRequests: number;
  private readonly defaultWindowSeconds: number;

  constructor(
    private reflector: Reflector,
    private cache: CacheService,
    private config: ConfigService,
  ) {
    // Default: 100 requests per hour for AI endpoints
    this.defaultMaxRequests = this.config.get('AI_RATE_LIMIT_PER_HOUR', 100);
    this.defaultWindowSeconds = 3600; // 1 hour
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guard handle this
    }

    // Get custom limits from decorator if present
    const options = this.reflector.get<AiRateLimitOptions>(
      AI_RATE_LIMIT_KEY,
      context.getHandler(),
    );

    const maxRequests = options?.maxRequests || this.defaultMaxRequests;
    const windowSeconds = options?.windowSeconds || this.defaultWindowSeconds;

    const key = `ai:ratelimit:${user.id}`;

    // Get current request count
    const currentCount = await this.cache.get<number>(key) || 0;

    if (currentCount >= maxRequests) {
      const ttl = await this.cache.ttl(key);
      const resetMinutes = Math.ceil(ttl / 60);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `AI-förfrågningsgräns nådd. Försök igen om ${resetMinutes} minuter.`,
          error: 'Too Many Requests',
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    const newCount = await this.cache.incr(key);

    // Set expiry on first request
    if (newCount === 1) {
      await this.cache.expire(key, windowSeconds);
    }

    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    const ttl = await this.cache.ttl(key);

    response.setHeader('X-AI-RateLimit-Limit', String(maxRequests));
    response.setHeader('X-AI-RateLimit-Remaining', String(Math.max(0, maxRequests - newCount)));
    response.setHeader('X-AI-RateLimit-Reset', String(ttl));

    return true;
  }
}
