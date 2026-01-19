import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../types/prisma-types';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get current user gamification stats' })
  async getMyStats(@CurrentUser() user: User) {
    return this.gamificationService.getUserStats(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly', 'allTime'], required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @CurrentUser() user: User,
    @Query('period') period: 'weekly' | 'monthly' | 'allTime' = 'weekly',
    @Query('limit') limit = 10,
  ) {
    return this.gamificationService.getLeaderboard(period, limit, user.id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges() {
    return this.gamificationService.getAllBadges();
  }

  @Get('badges/mine')
  @ApiOperation({ summary: 'Get current user badges' })
  async getMyBadges(@CurrentUser() user: User) {
    return this.gamificationService.getUserBadges(user.id);
  }

  @Post('activity')
  @ApiOperation({ summary: 'Record user activity (updates streak)' })
  async recordActivity(@CurrentUser() user: User) {
    return this.gamificationService.updateStreak(user.id);
  }

  @Post('check-badges')
  @ApiOperation({ summary: 'Check and award any new badges' })
  async checkBadges(@CurrentUser() user: User) {
    const newBadges = await this.gamificationService.checkAndAwardBadges(user.id);
    return { newBadges };
  }
}
