import Dexie, { type Table } from 'dexie';

// ===========================================
// ORTAC Offline Database (IndexedDB)
// ===========================================

// Types for local storage
export interface LocalChapter {
  id: string;
  slug: string;
  chapterNumber: number;
  title: string;
  content: string;
  estimatedMinutes: number;
  version: number;
  cachedAt: number;
}

export interface LocalQuizQuestion {
  id: string;
  questionCode: string;
  chapterId: string | null;
  bloomLevel: string;
  questionText: string;
  options: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  reference: string | null;
  version: number;
  cachedAt: number;
}

export interface LocalAlgorithm {
  id: string;
  code: string;
  title: string;
  description: string | null;
  svgContent: string;
  version: number;
  cachedAt: number;
}

export interface LocalProgress {
  id: string; // chapterId
  chapterId: string;
  readProgress: number;
  quizPassed: boolean;
  bestQuizScore: number | null;
  lastAccessedAt: number;
  syncStatus: 'synced' | 'pending';
}

export interface LocalQuizAttempt {
  id: string;
  type: 'practice' | 'chapter' | 'exam';
  chapterId: string | null;
  answers: Array<{
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  startedAt: number;
  completedAt: number;
  syncStatus: 'synced' | 'pending';
}

export interface LocalReviewCard {
  id: string; // `${questionId}`
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: number;
  lastReviewedAt: number | null;
  syncStatus: 'synced' | 'pending';
}

export interface SyncQueueItem {
  id: string;
  type: 'progress' | 'quiz' | 'review';
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

export interface LocalUser {
  id: string;
  personnummer: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Database class
class ORTACDatabase extends Dexie {
  chapters!: Table<LocalChapter>;
  questions!: Table<LocalQuizQuestion>;
  algorithms!: Table<LocalAlgorithm>;
  progress!: Table<LocalProgress>;
  quizAttempts!: Table<LocalQuizAttempt>;
  reviewCards!: Table<LocalReviewCard>;
  syncQueue!: Table<SyncQueueItem>;
  user!: Table<LocalUser>;

  constructor() {
    super('ortac');

    this.version(1).stores({
      chapters: 'id, slug, chapterNumber, version',
      questions: 'id, questionCode, chapterId, bloomLevel',
      algorithms: 'id, code, version',
      progress: 'id, chapterId, syncStatus',
      quizAttempts: 'id, type, chapterId, syncStatus, completedAt',
      reviewCards: 'id, questionId, nextReviewAt, syncStatus',
      syncQueue: 'id, type, createdAt',
      user: 'id',
    });
  }

  // Helper methods

  /**
   * Cache a chapter for offline access
   */
  async cacheChapter(chapter: Omit<LocalChapter, 'cachedAt'>): Promise<void> {
    await this.chapters.put({
      ...chapter,
      cachedAt: Date.now(),
    });
  }

  /**
   * Get chapter by slug, preferring cache
   */
  async getChapter(slug: string): Promise<LocalChapter | undefined> {
    return this.chapters.where('slug').equals(slug).first();
  }

  /**
   * Cache quiz questions
   */
  async cacheQuestions(questions: Array<Omit<LocalQuizQuestion, 'cachedAt'>>): Promise<void> {
    const withTimestamp = questions.map((q) => ({
      ...q,
      cachedAt: Date.now(),
    }));
    await this.questions.bulkPut(withTimestamp);
  }

  /**
   * Get questions for a chapter
   */
  async getQuestionsForChapter(chapterId: string): Promise<LocalQuizQuestion[]> {
    return this.questions.where('chapterId').equals(chapterId).toArray();
  }

  /**
   * Get random questions for practice
   */
  async getRandomQuestions(count: number): Promise<LocalQuizQuestion[]> {
    const all = await this.questions.toArray();
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Update chapter progress
   */
  async updateProgress(chapterId: string, data: Partial<LocalProgress>): Promise<void> {
    const existing = await this.progress.get(chapterId);

    if (existing) {
      await this.progress.update(chapterId, {
        ...data,
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
      });
    } else {
      await this.progress.put({
        id: chapterId,
        chapterId,
        readProgress: 0,
        quizPassed: false,
        bestQuizScore: null,
        lastAccessedAt: Date.now(),
        syncStatus: 'pending',
        ...data,
      });
    }

    // Add to sync queue
    await this.addToSyncQueue('progress', 'update', { chapterId, ...data });
  }

  /**
   * Save quiz attempt locally
   */
  async saveQuizAttempt(attempt: Omit<LocalQuizAttempt, 'syncStatus'>): Promise<void> {
    await this.quizAttempts.put({
      ...attempt,
      syncStatus: 'pending',
    });

    // Add to sync queue
    await this.addToSyncQueue('quiz', 'create', attempt);
  }

  /**
   * Get review cards due today
   */
  async getDueReviewCards(): Promise<LocalReviewCard[]> {
    const now = Date.now();
    return this.reviewCards.where('nextReviewAt').belowOrEqual(now).toArray();
  }

  /**
   * Update review card after grading
   */
  async updateReviewCard(
    questionId: string,
    data: Partial<LocalReviewCard>
  ): Promise<void> {
    const existing = await this.reviewCards.get(questionId);

    if (existing) {
      await this.reviewCards.update(questionId, {
        ...data,
        syncStatus: 'pending',
      });
    } else {
      await this.reviewCards.put({
        id: questionId,
        questionId,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewAt: Date.now(),
        lastReviewedAt: null,
        syncStatus: 'pending',
        ...data,
      });
    }

    await this.addToSyncQueue('review', 'update', { questionId, ...data });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    type: SyncQueueItem['type'],
    action: SyncQueueItem['action'],
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.syncQueue.put({
      id: crypto.randomUUID(),
      type,
      action,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    });
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.orderBy('createdAt').toArray();
  }

  /**
   * Remove synced item from queue
   */
  async removeSyncItem(id: string): Promise<void> {
    await this.syncQueue.delete(id);
  }

  /**
   * Increment retry count for failed sync
   */
  async incrementRetryCount(id: string): Promise<void> {
    const item = await this.syncQueue.get(id);
    if (item) {
      await this.syncQueue.update(id, { retryCount: item.retryCount + 1 });
    }
  }

  /**
   * Clear all cached data (for logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.chapters.clear(),
      this.questions.clear(),
      this.algorithms.clear(),
      this.progress.clear(),
      this.quizAttempts.clear(),
      this.reviewCards.clear(),
      this.syncQueue.clear(),
      this.user.clear(),
    ]);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    chapters: number;
    questions: number;
    algorithms: number;
    pendingSync: number;
  }> {
    const [chapters, questions, algorithms, pendingSync] = await Promise.all([
      this.chapters.count(),
      this.questions.count(),
      this.algorithms.count(),
      this.syncQueue.count(),
    ]);

    return { chapters, questions, algorithms, pendingSync };
  }
}

// Singleton instance
export const db = new ORTACDatabase();

// Export types
export type { ORTACDatabase };
