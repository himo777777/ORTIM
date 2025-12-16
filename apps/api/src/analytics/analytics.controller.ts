import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../types/prisma-types';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get platform overview statistics' })
  async getOverview() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user engagement statistics' })
  async getUserStats() {
    return this.analyticsService.getUserEngagementStats();
  }

  @Get('courses')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get course progress statistics' })
  async getCourseStats() {
    return this.analyticsService.getCourseProgressStats();
  }

  @Get('quiz')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get quiz statistics' })
  async getQuizStats() {
    return this.analyticsService.getQuizStats();
  }

  @Get('cohorts')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get cohort analytics' })
  async getCohortAnalytics() {
    return this.analyticsService.getCohortAnalytics();
  }

  @Get('activity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get daily activity for charts' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  async getDailyActivity(@Query('days') days?: number) {
    return this.analyticsService.getDailyActivity(days || 30);
  }

  @Get('questions')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get question performance analytics' })
  async getQuestionAnalytics() {
    return this.analyticsService.getQuestionAnalytics();
  }

  @Get('certificates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get certificate analytics' })
  async getCertificateAnalytics() {
    return this.analyticsService.getCertificateAnalytics();
  }
}
