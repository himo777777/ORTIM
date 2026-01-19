import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RagOptions {
  chapterId?: string;
  limit?: number;
  contentTypes?: ('CHAPTER' | 'QUESTION' | 'OBJECTIVE')[];
}

export interface RagSource {
  type: string;
  id: string;
  title: string;
  relevance: number;
}

export interface RagContext {
  contextText: string;
  sources: RagSource[];
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get relevant context for a query using keyword matching
   * This is a simple implementation - can be enhanced with embeddings later
   */
  async getRelevantContext(
    query: string,
    options: RagOptions = {},
  ): Promise<RagContext> {
    const { chapterId, limit = 5, contentTypes = ['CHAPTER', 'QUESTION', 'OBJECTIVE'] } = options;

    const sources: RagSource[] = [];
    const contextParts: string[] = [];

    // Extract keywords from query (simple implementation)
    const keywords = this.extractKeywords(query);
    this.logger.debug(`Extracted keywords: ${keywords.join(', ')}`);

    // If specific chapter context is requested, prioritize it
    if (chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          learningObjectives: true,
          quizQuestions: { include: { options: true } },
        },
      });

      if (chapter) {
        sources.push({
          type: 'CHAPTER',
          id: chapter.id,
          title: chapter.title,
          relevance: 1.0,
        });

        contextParts.push(`## Kapitel: ${chapter.title}\n${chapter.content.slice(0, 3000)}`);

        // Add learning objectives
        chapter.learningObjectives.forEach((lo) => {
          contextParts.push(`Lärandemål: ${lo.description}`);
        });
      }
    }

    // Search for relevant chapters based on keywords
    if (contentTypes.includes('CHAPTER') && keywords.length > 0) {
      const chapters = await this.searchChapters(keywords, limit);
      for (const chapter of chapters) {
        if (sources.some((s) => s.id === chapter.id)) continue;

        const relevance = this.calculateRelevance(query, chapter.content);
        if (relevance > 0.1) {
          sources.push({
            type: 'CHAPTER',
            id: chapter.id,
            title: chapter.title,
            relevance,
          });

          // Add relevant excerpt
          const excerpt = this.extractRelevantExcerpt(chapter.content, keywords);
          contextParts.push(`## ${chapter.title}\n${excerpt}`);
        }
      }
    }

    // Search for relevant quiz questions
    if (contentTypes.includes('QUESTION') && keywords.length > 0) {
      const questions = await this.searchQuestions(keywords, limit);
      for (const question of questions) {
        const relevance = this.calculateRelevance(query, question.questionText);
        if (relevance > 0.15) {
          sources.push({
            type: 'QUESTION',
            id: question.id,
            title: question.questionCode,
            relevance,
          });

          contextParts.push(
            `## Quizfråga: ${question.questionCode}\n` +
              `Fråga: ${question.questionText}\n` +
              `Förklaring: ${question.explanation}`,
          );
        }
      }
    }

    // Sort sources by relevance
    sources.sort((a, b) => b.relevance - a.relevance);

    // Limit total context size
    const contextText = contextParts.join('\n\n').slice(0, 8000);

    return {
      contextText,
      sources: sources.slice(0, limit),
    };
  }

  /**
   * Index content for better RAG retrieval (future embedding support)
   */
  async indexContent(contentType: 'CHAPTER' | 'QUESTION' | 'OBJECTIVE'): Promise<{
    indexed: number;
    errors: number;
  }> {
    let indexed = 0;
    let errors = 0;

    try {
      if (contentType === 'CHAPTER') {
        const chapters = await this.prisma.chapter.findMany({
          where: { isActive: true },
        });

        for (const chapter of chapters) {
          try {
            // Chunk content
            const chunks = this.chunkContent(chapter.content, 500);

            // Store chunks (for future embedding support)
            for (let i = 0; i < chunks.length; i++) {
              await this.prisma.contentEmbedding.upsert({
                where: {
                  contentType_contentId_chunkIndex: {
                    contentType: 'CHAPTER',
                    contentId: chapter.id,
                    chunkIndex: i,
                  },
                },
                create: {
                  contentType: 'CHAPTER',
                  contentId: chapter.id,
                  chunkIndex: i,
                  content: chunks[i],
                  embedding: [], // Will be populated when embedding service is ready
                },
                update: {
                  content: chunks[i],
                },
              });
            }
            indexed++;
          } catch (e) {
            this.logger.error(`Error indexing chapter ${chapter.id}:`, e);
            errors++;
          }
        }
      }

      // Similar for QUESTION and OBJECTIVE types...
    } catch (e) {
      this.logger.error(`Error during indexing:`, e);
      errors++;
    }

    return { indexed, errors };
  }

  /**
   * Extract keywords from a query
   */
  private extractKeywords(query: string): string[] {
    // Swedish stop words
    const stopWords = new Set([
      'och', 'i', 'att', 'det', 'som', 'en', 'på', 'är', 'av', 'för',
      'med', 'till', 'den', 'har', 'de', 'inte', 'om', 'ett', 'men',
      'var', 'jag', 'kan', 'man', 'vad', 'hur', 'vilka', 'när', 'ska',
      'finns', 'vara', 'detta', 'kommer', 'vilket', 'alla', 'eller',
    ]);

    return query
      .toLowerCase()
      .replace(/[^\wåäö\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Search chapters by keywords
   */
  private async searchChapters(keywords: string[], limit: number) {
    // Build search condition
    const searchConditions = keywords.map((keyword) => ({
      OR: [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { content: { contains: keyword, mode: 'insensitive' as const } },
      ],
    }));

    return this.prisma.chapter.findMany({
      where: {
        isActive: true,
        OR: searchConditions,
      },
      take: limit * 2, // Fetch more to filter by relevance
      include: {
        part: { include: { course: true } },
      },
    });
  }

  /**
   * Search quiz questions by keywords
   */
  private async searchQuestions(keywords: string[], limit: number) {
    const searchConditions = keywords.map((keyword) => ({
      OR: [
        { questionText: { contains: keyword, mode: 'insensitive' as const } },
        { explanation: { contains: keyword, mode: 'insensitive' as const } },
      ],
    }));

    return this.prisma.quizQuestion.findMany({
      where: {
        isActive: true,
        OR: searchConditions,
      },
      take: limit,
      include: {
        chapter: true,
        options: true,
      },
    });
  }

  /**
   * Calculate simple relevance score based on keyword matching
   */
  private calculateRelevance(query: string, content: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) return 0;

    let matches = 0;
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        matches++;
      }
    }

    return matches / keywords.length;
  }

  /**
   * Extract a relevant excerpt from content based on keywords
   */
  private extractRelevantExcerpt(content: string, keywords: string[], maxLength = 800): string {
    const contentLower = content.toLowerCase();

    // Find the position of the first matching keyword
    let bestPosition = 0;
    for (const keyword of keywords) {
      const pos = contentLower.indexOf(keyword.toLowerCase());
      if (pos !== -1) {
        bestPosition = pos;
        break;
      }
    }

    // Extract excerpt around the keyword
    const start = Math.max(0, bestPosition - 100);
    const end = Math.min(content.length, start + maxLength);

    let excerpt = content.slice(start, end);

    // Clean up the excerpt
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Chunk content into smaller pieces for embedding
   */
  private chunkContent(content: string, targetWordCount: number): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWordCount = paragraph.split(/\s+/).length;

      if (currentWordCount + paragraphWordCount > targetWordCount && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentWordCount = paragraphWordCount;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentWordCount += paragraphWordCount;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
