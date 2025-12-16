import { Controller, Get, Post, Put, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../types/prisma-types';

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

  @Get('cohorts/:id/participants')
  @ApiOperation({ summary: 'Get cohort participants with progress' })
  async getCohortParticipants(@Param('id') id: string) {
    const participants = await this.instructorService.getCohortParticipants(id);
    if (!participants) {
      throw new NotFoundException('Kohorten hittades inte');
    }
    return participants;
  }

  @Post('osce/:enrollmentId')
  @ApiOperation({ summary: 'Create OSCE assessment' })
  async createOsceAssessment(
    @CurrentUser() user: User,
    @Param('enrollmentId') enrollmentId: string,
    @Body() body: {
      stationNumber: number;
      stationName: string;
      passed: boolean;
      score?: number;
      comments?: string;
    },
  ) {
    return this.instructorService.createOsceAssessment(user.id, enrollmentId, body);
  }

  @Put('osce/:assessmentId')
  @ApiOperation({ summary: 'Update OSCE assessment' })
  async updateOsceAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() body: {
      passed?: boolean;
      score?: number;
      comments?: string;
    },
  ) {
    return this.instructorService.updateOsceAssessment(assessmentId, body);
  }

  @Get('enrollments/:enrollmentId/osce')
  @ApiOperation({ summary: 'Get OSCE assessments for enrollment' })
  async getOsceAssessments(@Param('enrollmentId') enrollmentId: string) {
    return this.instructorService.getOsceAssessments(enrollmentId);
  }
}
