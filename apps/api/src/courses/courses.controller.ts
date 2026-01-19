import { Controller, Get, Post, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../types/prisma-types';

@ApiTags('Courses')
@Controller()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active courses (instructor-only courses filtered by role)' })
  async findAll(@CurrentUser() user: User | null) {
    return this.coursesService.findAll(user?.role);
  }

  @Get('courses/:code')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course by code' })
  async findByCode(@Param('code') code: string, @CurrentUser() user: User | null) {
    const course = await this.coursesService.findByCode(code);
    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }
    // Block access to instructor-only courses for non-instructors/admins
    if (course.instructorOnly && user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      throw new NotFoundException('Kursen hittades inte');
    }
    return course;
  }

  @Get('chapters/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chapter by slug' })
  async findChapter(@Param('slug') slug: string, @CurrentUser() user: User) {
    const chapter = await this.coursesService.findChapter(slug);
    if (!chapter) {
      throw new NotFoundException('Kapitlet hittades inte');
    }
    // Block access to instructor-only course chapters for non-instructors/admins
    if (chapter.part?.course?.instructorOnly && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      throw new NotFoundException('Kapitlet hittades inte');
    }
    return chapter;
  }

  @Get('algorithms')
  @ApiOperation({ summary: 'Get all algorithms' })
  async findAlgorithms() {
    return this.coursesService.findAlgorithms();
  }

  @Get('algorithms/:code')
  @ApiOperation({ summary: 'Get algorithm by code' })
  async findAlgorithm(@Param('code') code: string) {
    const algorithm = await this.coursesService.findAlgorithm(code);
    if (!algorithm) {
      throw new NotFoundException('Algoritmen hittades inte');
    }
    return algorithm;
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress across all chapters' })
  async getUserProgress(@CurrentUser() user: User) {
    return this.coursesService.getUserProgress(user.id);
  }

  @Get('progress/course/:courseCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress for a specific course' })
  async getCourseProgress(
    @CurrentUser() user: User,
    @Param('courseCode') courseCode: string,
  ) {
    const progress = await this.coursesService.getCourseProgress(user.id, courseCode);
    if (!progress) {
      throw new NotFoundException('Kursen hittades inte');
    }
    return progress;
  }

  @Get('progress/:chapterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress for a specific chapter' })
  async getChapterProgress(
    @CurrentUser() user: User,
    @Param('chapterId') chapterId: string,
  ) {
    return this.coursesService.getChapterProgress(user.id, chapterId);
  }

  @Post('progress/:chapterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update chapter progress' })
  async updateChapterProgress(
    @CurrentUser() user: User,
    @Param('chapterId') chapterId: string,
    @Body() body: { readProgress?: number; quizPassed?: boolean; bestQuizScore?: number },
  ) {
    return this.coursesService.updateChapterProgress(user.id, chapterId, body);
  }
}
