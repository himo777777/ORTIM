import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Courses')
@Controller()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Get all active courses' })
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get('courses/:code')
  @ApiOperation({ summary: 'Get course by code' })
  async findByCode(@Param('code') code: string) {
    const course = await this.coursesService.findByCode(code);
    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }
    return course;
  }

  @Get('chapters/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chapter by slug' })
  async findChapter(@Param('slug') slug: string) {
    const chapter = await this.coursesService.findChapter(slug);
    if (!chapter) {
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
}
