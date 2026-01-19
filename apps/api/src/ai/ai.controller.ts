import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiRateLimitGuard, AiRateLimit } from './ai-rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../types/prisma-types';
import {
  SendChatMessageDto,
  ChatResponseDto,
  ConversationDto,
  SummarizeRequestDto,
  ExplainQuestionDto,
} from './dto/chat-message.dto';
import { RecommendationsResponseDto, LearningProfileDto } from './dto/recommendation.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  // ============================================
  // CHAT ENDPOINTS
  // ============================================

  @Post('chat')
  @UseGuards(AiRateLimitGuard)
  @ApiOperation({ summary: 'Send a chat message and get AI response' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded (100 requests/hour)' })
  async chat(
    @CurrentUser() user: User,
    @Body() dto: SendChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.aiService.chat(
      user.id,
      dto.message,
      dto.conversationId,
      dto.contextChapterId,
    );
  }

  @Post('chat/stream')
  @UseGuards(AiRateLimitGuard)
  @ApiOperation({ summary: 'Send a chat message and stream AI response via SSE' })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded (100 requests/hour)' })
  async streamChat(
    @CurrentUser() user: User,
    @Body() dto: SendChatMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.aiService.streamChat(
        user.id,
        dto.message,
        dto.conversationId,
        dto.contextChapterId,
      )) {
        res.write(`event: ${chunk.type}\ndata: ${chunk.data}\n\n`);
      }
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user chat conversations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [ConversationDto] })
  async getConversations(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ) {
    return this.aiService.getConversations(user.id, limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation with messages' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, type: ConversationDto })
  async getConversation(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
  ) {
    const conversation = await this.aiService.getConversation(user.id, conversationId);
    if (!conversation) {
      return { error: 'Conversation not found', statusCode: HttpStatus.NOT_FOUND };
    }
    return conversation;
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async deleteConversation(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
  ) {
    return this.aiService.deleteConversation(user.id, conversationId);
  }

  // ============================================
  // CONTENT ASSISTANCE ENDPOINTS
  // ============================================

  @Get('summarize/:chapterId')
  @UseGuards(AiRateLimitGuard)
  @AiRateLimit({ maxRequests: 50, windowSeconds: 3600 }) // 50 summaries/hour
  @ApiOperation({ summary: 'Get AI-generated summary of a chapter' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  @ApiQuery({ name: 'format', enum: ['brief', 'detailed', 'bullet_points'], required: false })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded (50 requests/hour)' })
  async summarizeChapter(
    @Param('chapterId') chapterId: string,
    @Query() query: SummarizeRequestDto,
  ) {
    return this.aiService.summarizeChapter(chapterId, query.format);
  }

  @Get('explain/:questionId')
  @UseGuards(AiRateLimitGuard)
  @AiRateLimit({ maxRequests: 100, windowSeconds: 3600 }) // 100 explanations/hour
  @ApiOperation({ summary: 'Get AI explanation of a quiz question' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiQuery({ name: 'includeRelatedConcepts', type: Boolean, required: false })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded (100 requests/hour)' })
  async explainQuestion(
    @Param('questionId') questionId: string,
    @Query() query: ExplainQuestionDto,
  ) {
    return this.aiService.explainQuestion(questionId, query.includeRelatedConcepts);
  }

  // ============================================
  // RECOMMENDATIONS & LEARNING PROFILE
  // ============================================

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized study recommendations' })
  @ApiResponse({ status: 200, type: RecommendationsResponseDto })
  async getRecommendations(@CurrentUser() user: User) {
    return this.aiService.getRecommendations(user.id);
  }

  @Get('learning-profile')
  @ApiOperation({ summary: 'Get user learning profile' })
  @ApiResponse({ status: 200, type: LearningProfileDto })
  async getLearningProfile(@CurrentUser() user: User) {
    return this.aiService.getLearningProfile(user.id);
  }
}
