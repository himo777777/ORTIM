import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ClaudeService } from './claude.service';
import { RagService } from './rag.service';
import { RecommendationsService } from './recommendations.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  chapterId?: string;
  userProgress?: {
    completedChapters: string[];
    weakTopics: string[];
    currentLevel: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private claudeService: ClaudeService,
    private ragService: RagService,
    private recommendationsService: RecommendationsService,
  ) {}

  /**
   * Send a chat message and get an AI response
   */
  async chat(
    userId: string,
    message: string,
    conversationId?: string,
    contextChapterId?: string,
  ): Promise<{
    conversationId: string;
    messageId: string;
    content: string;
    sourcesUsed: { type: string; id: string; title: string; relevance: number }[];
    tokensUsed: number;
  }> {
    // Get or create conversation
    let conversation = conversationId
      ? await this.prisma.chatConversation.findUnique({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 100),
        },
        include: { messages: true },
      });
    }

    // Get user context for personalization
    const userContext = await this.getUserContext(userId);

    // Get relevant content using RAG
    const ragContext = await this.ragService.getRelevantContext(message, {
      chapterId: contextChapterId,
      limit: 5,
    });

    // Build conversation history
    const history: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Generate AI response
    const response = await this.claudeService.chat(history, {
      context: ragContext.contextText,
      userProgress: userContext,
    });

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Save assistant message
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        contextUsed: ragContext.sources,
        tokensUsed: response.tokensUsed,
      },
    });

    // Update conversation title if this is the first message
    if (conversation.messages.length === 0) {
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { title: this.generateTitle(message) },
      });
    }

    // Audit log the AI interaction
    this.auditService.logAIChat(userId, conversation.id, response.tokensUsed).catch((err) => {
      this.logger.warn('Failed to log AI chat audit:', err);
    });

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      content: response.content,
      sourcesUsed: ragContext.sources,
      tokensUsed: response.tokensUsed,
    };
  }

  /**
   * Stream a chat response using SSE
   */
  async *streamChat(
    userId: string,
    message: string,
    conversationId?: string,
    contextChapterId?: string,
  ): AsyncGenerator<{ type: string; data: string }> {
    // Get or create conversation
    let conversation = conversationId
      ? await this.prisma.chatConversation.findUnique({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 100),
        },
        include: { messages: true },
      });
    }

    // Yield conversation ID first
    yield { type: 'conversation', data: JSON.stringify({ id: conversation.id }) };

    // Get context
    const userContext = await this.getUserContext(userId);
    const ragContext = await this.ragService.getRelevantContext(message, {
      chapterId: contextChapterId,
      limit: 5,
    });

    // Yield sources
    yield { type: 'sources', data: JSON.stringify(ragContext.sources) };

    // Build history
    const history: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    history.push({ role: 'user', content: message });

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Stream response
    let fullContent = '';
    let tokensUsed = 0;

    for await (const chunk of this.claudeService.streamChat(history, {
      context: ragContext.contextText,
      userProgress: userContext,
    })) {
      if (chunk.type === 'content') {
        fullContent += chunk.data;
        yield { type: 'content', data: chunk.data };
      } else if (chunk.type === 'usage') {
        tokensUsed = chunk.tokensUsed;
      }
    }

    // Save assistant message
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: fullContent,
        contextUsed: ragContext.sources,
        tokensUsed,
      },
    });

    // Audit log the AI interaction
    this.auditService.logAIChat(userId, conversation.id, tokensUsed).catch((err) => {
      this.logger.warn('Failed to log AI chat audit:', err);
    });

    yield { type: 'done', data: JSON.stringify({ messageId: assistantMessage.id, tokensUsed }) };
  }

  /**
   * Get user conversations
   */
  async getConversations(userId: string, limit = 20) {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(userId: string, conversationId: string) {
    return this.prisma.chatConversation.findUnique({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return { success: false, message: 'Conversation not found' };
    }

    await this.prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * Get AI-generated summary of a chapter
   */
  async summarizeChapter(
    chapterId: string,
    format: 'brief' | 'detailed' | 'bullet_points' = 'brief',
  ) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        learningObjectives: true,
        part: { include: { course: true } },
      },
    });

    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return this.claudeService.summarize(chapter.content, {
      format,
      context: {
        title: chapter.title,
        objectives: chapter.learningObjectives.map((lo) => lo.description),
      },
    });
  }

  /**
   * Get AI explanation of a quiz question
   */
  async explainQuestion(questionId: string, includeRelatedConcepts = true) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        chapter: true,
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return this.claudeService.explainQuestion({
      questionText: question.questionText,
      options: question.options.map((o) => ({
        label: o.optionLabel,
        text: o.optionText,
        isCorrect: o.isCorrect,
      })),
      existingExplanation: question.explanation,
      includeRelatedConcepts,
      chapterContext: question.chapter?.title,
    });
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(userId: string) {
    return this.recommendationsService.getRecommendations(userId);
  }

  /**
   * Get or update user learning profile
   */
  async getLearningProfile(userId: string) {
    return this.recommendationsService.getLearningProfile(userId);
  }

  /**
   * Helper: Get user context for AI personalization
   */
  private async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        chapterProgress: {
          where: { completedAt: { not: null } },
          select: { chapterId: true },
        },
        quizAttempts: {
          where: { passed: false },
          orderBy: { completedAt: 'desc' },
          take: 10,
          select: { chapterId: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Identify weak topics based on failed quizzes
    const weakChapterIds = [...new Set(user.quizAttempts.map((q) => q.chapterId).filter(Boolean))];

    return {
      completedChapters: user.chapterProgress.map((cp) => cp.chapterId),
      weakTopics: weakChapterIds as string[],
      currentLevel: user.level,
    };
  }

  /**
   * Helper: Generate conversation title from first message
   */
  private generateTitle(message: string): string {
    // Simple title generation - truncate and clean up
    const cleaned = message.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 50) {
      return cleaned;
    }
    return cleaned.slice(0, 47) + '...';
  }
}
