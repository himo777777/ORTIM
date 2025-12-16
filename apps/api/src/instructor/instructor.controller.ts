import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('Instructor')
@Controller('instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@ApiBearerAuth()
export class InstructorController {
  constructor(private instructorService: InstructorService) {}

  @Get('cohorts')
  @ApiOperation({ summary: 'Get instructor cohorts' })
  async findCohorts(@CurrentUser() user: User) {
    return this.instructorService.findCohorts(user.id);
  }

  @Get('cohorts/:id')
  @ApiOperation({ summary: 'Get cohort details' })
  async findCohort(@Param('id') id: string) {
    const cohort = await this.instructorService.findCohort(id);
    if (!cohort) {
      throw new NotFoundException('Kohorten hittades inte');
    }
    return cohort;
  }

  @Post('cohorts')
  @ApiOperation({ summary: 'Create new cohort' })
  async createCohort(
    @CurrentUser() user: User,
    @Body() body: {
      courseId: string;
      name: string;
      description?: string;
      startDate: Date;
      endDate?: Date;
      maxParticipants?: number;
    },
  ) {
    return this.instructorService.createCohort(user.id, body);
  }

  @Get('cohorts/:id/stats')
  @ApiOperation({ summary: 'Get cohort statistics' })
  async getCohortStats(@Param('id') id: string) {
    const stats = await this.instructorService.getCohortStats(id);
    if (!stats) {
      throw new NotFoundException('Kohorten hittades inte');
    }
    return stats;
  }
}
