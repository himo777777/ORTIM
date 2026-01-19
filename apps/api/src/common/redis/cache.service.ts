import { Injectable, Inject, Optional } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes
  private readonly prefix = 'ortac:';

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null
  ) {}

  private getKey(key: string, options?: CacheOptions): string {
    const prefix = options?.prefix || this.prefix;
    return `${prefix}${key}`;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const fullKey = this.getKey(key, options);
      const value = await this.redis.get(fullKey);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.getKey(key, options);
      const ttl = options?.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);

      await this.redis.setex(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.getKey(key, options);
      await this.redis.del(fullKey);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string, options?: CacheOptions): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullPattern = this.getKey(pattern, options);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) return 0;

      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Cache delPattern error:', error);
      return 0;
    }
  }

  /**
   * Get or set a value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute factory and cache result
    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Increment a counter
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullKey = this.getKey(key, options);
      return await this.redis.incr(fullKey);
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.getKey(key, options);
      await this.redis.expire(fullKey, seconds);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.getKey(key, options);
      return (await this.redis.exists(fullKey)) === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    if (!this.redis) return -1;

    try {
      const fullKey = this.getKey(key, options);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flush(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Disconnect Redis client
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }
}

// Cache key generators for common patterns
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByPersonnummer: (pn: string) => `user:pn:${pn}`,
  course: (id: string) => `course:${id}`,
  courseList: () => 'courses:list',
  chapter: (id: string) => `chapter:${id}`,
  questions: (chapterId: string) => `questions:${chapterId}`,
  certificate: (id: string) => `certificate:${id}`,
  userProgress: (userId: string, courseId: string) => `progress:${userId}:${courseId}`,
  loginAttempts: (identifier: string) => `login:attempts:${identifier}`,
  rateLimitUser: (userId: string) => `ratelimit:user:${userId}`,
};

// TTL presets in seconds
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};
