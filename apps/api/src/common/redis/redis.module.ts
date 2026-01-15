import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          console.warn('REDIS_URL not configured, caching disabled');
          return null;
        }

        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.error('Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        redis.on('connect', () => {
          console.log('✓ Redis connected');
        });

        redis.on('error', (err) => {
          console.error('Redis error:', err.message);
        });

        return redis;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private cacheService: CacheService) {}

  async onModuleDestroy() {
    await this.cacheService.disconnect();
  }
}
