import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, BloomLevel } from '../types/prisma-types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================
  // USERS
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async findAllUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.adminService.findAllUsers({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      role,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findUser(@Param('id') id: string) {
    return this.adminService.findUser(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create new user' })
  async createUser(
    @Body()
    body: {
      personnummer: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      workplace?: string;
      speciality?: string;
    },
  ) {
    return this.adminService.createUser(body);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      workplace?: string;
      speciality?: string;
    },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ============================================
  // COURSES
  // ============================================

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses' })
  async findAllCourses() {
    return this.adminService.findAllCourses();
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findCourse(@Param('id') id: string) {
    return this.adminService.findCourse(id);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create new course' })
  async createCourse(
    @Body()
    body: {
      code: string;
      name: string;
      fullName: string;
      version: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
    },
  ) {
    return this.adminService.createCourse(body);
  }

  @Put('courses/:id')
  @ApiOperation({ summary: 'Update course' })
  async updateCourse(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      fullName?: string;
      version?: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateCourse(id, body);
  }

  // ============================================
  // CHAPTERS
  // ============================================

  @Post('chapters')
  @ApiOperation({ summary: 'Create new chapter' })
  async createChapter(
    @Body()
    body: {
      partId: string;
      chapterNumber: number;
      title: string;
      slug: string;
      content: string;
      estimatedMinutes?: number;
    },
  ) {
    return this.adminService.createChapter(body);
  }

  @Put('chapters/:id')
  @ApiOperation({ summary: 'Update chapter' })
  async updateChapter(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      estimatedMinutes?: number;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateChapter(id, body);
  }

  // ============================================
  // QUESTIONS
  // ============================================

  @Get('questions')
  @ApiOperation({ summary: 'Get all questions' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'chapterId', required: false })
  @ApiQuery({ name: 'bloomLevel', required: false, enum: BloomLevel })
  async findAllQuestions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('chapterId') chapterId?: string,
    @Query('bloomLevel') bloomLevel?: BloomLevel,
  ) {
    return this.adminService.findAllQuestions({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      chapterId,
      bloomLevel,
    });
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get question by ID' })
  async findQuestion(@Param('id') id: string) {
    return this.adminService.findQuestion(id);
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create new question' })
  async createQuestion(
    @Body()
    body: {
      questionCode: string;
      chapterId?: string;
      bloomLevel: BloomLevel;
      questionText: string;
      explanation: string;
      reference?: string;
      isExamQuestion?: boolean;
      options: {
        optionLabel: string;
        optionText: string;
        isCorrect: boolean;
      }[];
    },
  ) {
    return this.adminService.createQuestion(body);
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Update question' })
  async updateQuestion(
    @Param('id') id: string,
    @Body()
    body: {
      chapterId?: string;
      bloomLevel?: BloomLevel;
      questionText?: string;
      explanation?: string;
      reference?: string;
      isActive?: boolean;
      isExamQuestion?: boolean;
    },
  ) {
    return this.adminService.updateQuestion(id, body);
  }

  @Put('questions/:id/options')
  @ApiOperation({ summary: 'Update question options' })
  async updateQuestionOptions(
    @Param('id') id: string,
    @Body()
    body: {
      options: {
        id?: string;
        optionLabel: string;
        optionText: string;
        isCorrect: boolean;
      }[];
    },
  ) {
    return this.adminService.updateQuestionOptions(id, body.options);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete question' })
  async deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(id);
  }

  // ============================================
  // ALGORITHMS
  // ============================================

  @Get('algorithms')
  @ApiOperation({ summary: 'Get all algorithms' })
  async findAllAlgorithms() {
    return this.adminService.findAllAlgorithms();
  }

  @Get('algorithms/:id')
  @ApiOperation({ summary: 'Get algorithm by ID' })
  async findAlgorithm(@Param('id') id: string) {
    return this.adminService.findAlgorithm(id);
  }

  @Post('algorithms')
  @ApiOperation({ summary: 'Create new algorithm' })
  async createAlgorithm(
    @Body()
    body: {
      code: string;
      title: string;
      description?: string;
      svgContent: string;
      chapterId?: string;
    },
  ) {
    return this.adminService.createAlgorithm(body);
  }

  @Put('algorithms/:id')
  @ApiOperation({ summary: 'Update algorithm' })
  async updateAlgorithm(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      svgContent?: string;
      chapterId?: string;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateAlgorithm(id, body);
  }

  @Delete('algorithms/:id')
  @ApiOperation({ summary: 'Delete algorithm' })
  async deleteAlgorithm(@Param('id') id: string) {
    return this.adminService.deleteAlgorithm(id);
  }
}
