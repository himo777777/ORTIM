import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';
import { CacheService } from './common/redis/cache.service';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
}

interface DependencyStatus {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

@ApiTags('Health')
@Controller()
export class AppController {
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'b-ortim-api',
    };
  }

  @Get('health/detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unhealthy' })
  async detailedHealthCheck(): Promise<HealthStatus> {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allHealthy = dbStatus.status === 'up' && redisStatus.status === 'up';
    const allDown = dbStatus.status === 'down' && redisStatus.status === 'down';

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      overallStatus = 'healthy';
    } else if (allDown) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'b-ortim-api',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessCheck() {
    const dbStatus = await this.checkDatabase();

    if (dbStatus.status === 'down') {
      return {
        status: 'not_ready',
        reason: 'Database connection failed',
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  livenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    const start = Date.now();

    try {
      if (!this.cache.isAvailable()) {
        return {
          status: 'down',
          latency: Date.now() - start,
          error: 'Redis not configured or not connected',
        };
      }

      // Test read/write
      await this.cache.set('health_check', Date.now(), { ttl: 10 });
      await this.cache.get('health_check');

      return {
        status: 'up',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
