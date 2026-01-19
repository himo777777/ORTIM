import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Embeddings service for semantic search
 *
 * Note: This service provides the infrastructure for vector embeddings.
 * For production use, integrate with an embedding API (e.g., OpenAI, Cohere)
 * or use a local model.
 *
 * Current implementation uses keyword-based matching as a fallback.
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private embeddingModel: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.embeddingModel = this.config.get('EMBEDDING_MODEL', 'keyword-fallback');
    this.logger.log(`Embeddings service initialized with model: ${this.embeddingModel}`);
  }

  /**
   * Generate embedding for text
   * Returns a vector representation of the text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // For now, use a simple keyword-based approach
    // In production, replace with actual embedding API call
    return this.generateKeywordEmbedding(text);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length || vec1.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Find similar content using embeddings
   */
  async findSimilar(
    queryEmbedding: number[],
    contentType: string,
    limit = 5,
  ): Promise<Array<{ contentId: string; chunkIndex: number; similarity: number }>> {
    // Get all embeddings of the specified type
    const embeddings = await this.prisma.contentEmbedding.findMany({
      where: { contentType },
      select: {
        contentId: true,
        chunkIndex: true,
        embedding: true,
      },
    });

    // Calculate similarities
    const results = embeddings
      .map((e) => ({
        contentId: e.contentId,
        chunkIndex: e.chunkIndex,
        similarity: this.calculateSimilarity(queryEmbedding, e.embedding),
      }))
      .filter((r) => r.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  /**
   * Store embedding for content
   */
  async storeEmbedding(
    contentType: string,
    contentId: string,
    chunkIndex: number,
    content: string,
    embedding: number[],
  ): Promise<void> {
    await this.prisma.contentEmbedding.upsert({
      where: {
        contentType_contentId_chunkIndex: {
          contentType,
          contentId,
          chunkIndex,
        },
      },
      create: {
        contentType,
        contentId,
        chunkIndex,
        content,
        embedding,
      },
      update: {
        content,
        embedding,
      },
    });
  }

  /**
   * Generate embeddings for all chapters
   */
  async indexAllChapters(): Promise<{ indexed: number; errors: number }> {
    let indexed = 0;
    let errors = 0;

    const chapters = await this.prisma.chapter.findMany({
      where: { isActive: true },
    });

    for (const chapter of chapters) {
      try {
        const chunks = this.chunkText(chapter.content, 500);

        for (let i = 0; i < chunks.length; i++) {
          const embedding = await this.generateEmbedding(chunks[i]);
          await this.storeEmbedding('CHAPTER', chapter.id, i, chunks[i], embedding);
        }

        indexed++;
        this.logger.debug(`Indexed chapter: ${chapter.title}`);
      } catch (error) {
        errors++;
        this.logger.error(`Error indexing chapter ${chapter.id}:`, error);
      }
    }

    return { indexed, errors };
  }

  /**
   * Generate embeddings for all questions
   */
  async indexAllQuestions(): Promise<{ indexed: number; errors: number }> {
    let indexed = 0;
    let errors = 0;

    const questions = await this.prisma.quizQuestion.findMany({
      where: { isActive: true },
      include: { options: true },
    });

    for (const question of questions) {
      try {
        // Combine question text with explanation for embedding
        const text = `${question.questionText}\n${question.explanation}`;
        const embedding = await this.generateEmbedding(text);
        await this.storeEmbedding('QUESTION', question.id, 0, text, embedding);

        indexed++;
      } catch (error) {
        errors++;
        this.logger.error(`Error indexing question ${question.id}:`, error);
      }
    }

    return { indexed, errors };
  }

  /**
   * Simple keyword-based embedding (fallback)
   * Creates a sparse vector based on word frequencies
   */
  private generateKeywordEmbedding(text: string): number[] {
    // Swedish medical keywords relevant to ORTAC
    const vocabulary = [
      'fraktur', 'höft', 'knä', 'axel', 'handled', 'fotled',
      'blödning', 'trauma', 'ortopedi', 'operation', 'kirurgi',
      'patient', 'behandling', 'diagnos', 'symptom', 'smärta',
      'röntgen', 'ct', 'mr', 'ultraljud', 'undersökning',
      'anestesi', 'narkos', 'bedövning', 'postoperativ', 'komplikation',
      'infektion', 'dvt', 'emboli', 'lungemboli', 'trombos',
      'rehabilitation', 'mobilisering', 'fysioterapi', 'belastning',
      'protes', 'implantat', 'skruv', 'platta', 'märgspik',
      'luxation', 'subluxation', 'reposition', 'immobilisering',
      'gips', 'ortos', 'bandage', 'stödförband', 'avlastning',
    ];

    const textLower = text.toLowerCase();
    const embedding: number[] = new Array(vocabulary.length).fill(0);

    for (let i = 0; i < vocabulary.length; i++) {
      const word = vocabulary[i];
      // Count occurrences and normalize
      const count = (textLower.match(new RegExp(word, 'g')) || []).length;
      embedding[i] = count > 0 ? Math.min(count / 10, 1) : 0;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Split text into chunks
   */
  private chunkText(text: string, targetWords: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let currentWords = 0;

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).length;

      if (currentWords + words > targetWords && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentWords = words;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentWords += words;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
