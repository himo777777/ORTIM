import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../types/prisma-types';

@ApiTags('Quiz')
@Controller('quiz')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Get quiz questions' })
  async getQuestions(
    @Query('chapterId') chapterId?: string,
    @Query('count') count = 10,
  ) {
    return this.quizService.getQuestions(chapterId, count);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  async submit(
    @CurrentUser() user: User,
    @Body() body: {
      type: string;
      chapterId?: string;
      answers: { questionId: string; selectedOption: string }[];
    },
  ) {
    return this.quizService.submitAttempt(user.id, body);
  }
}
