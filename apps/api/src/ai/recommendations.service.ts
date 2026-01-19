import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RecommendationDto, LearningProfileDto } from './dto/recommendation.dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get personalized study recommendations for a user
   */
  async getRecommendations(userId: string): Promise<{
    recommendations: RecommendationDto[];
    generatedAt: Date;
    learningProfile: LearningProfileDto | null;
  }> {
    const recommendations: RecommendationDto[] = [];

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        chapterProgress: {
          include: { chapter: { include: { part: true } } },
        },
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 50,
          include: { answers: true },
        },
        reviewCards: {
          where: { nextReviewAt: { lte: new Date() } },
          include: { question: { include: { chapter: true } } },
        },
      },
    });

    if (!user) {
      return { recommendations: [], generatedAt: new Date(), learningProfile: null };
    }

    // Analyze performance
    const analysis = this.analyzePerformance(user);

    // 1. Spaced Repetition recommendations (highest priority)
    if (user.reviewCards.length > 0) {
      const dueCards = user.reviewCards.slice(0, 5);
      for (const card of dueCards) {
        recommendations.push({
          type: 'spaced_repetition',
          title: `Repetera: ${card.question.questionCode}`,
          description: `Du har ${user.reviewCards.length} kort som behöver repeteras för optimal inlärning.`,
          contentId: card.questionId,
          contentType: 'question',
          priority: 0.95,
          estimatedMinutes: 2 * user.reviewCards.length,
          metadata: {
            reviewCount: card.repetitions,
          },
        });
        break; // Only add one spaced repetition recommendation
      }
    }

    // 2. Weakness-focused recommendations
    for (const weakChapter of analysis.weakChapters.slice(0, 2)) {
      recommendations.push({
        type: 'weakness_focus',
        title: `Fokusera på: ${weakChapter.title}`,
        description: `Din senaste prestation på quiz i detta kapitel var ${weakChapter.lastScore}%. Läs igenom kapitlet igen.`,
        contentId: weakChapter.id,
        contentType: 'chapter',
        priority: 0.85 - weakChapter.lastScore / 100 * 0.3,
        estimatedMinutes: weakChapter.estimatedMinutes,
        metadata: {
          lastAttemptScore: weakChapter.lastScore,
        },
      });
    }

    // 3. Quiz practice recommendations
    const chaptersNeedingQuiz = analysis.completedChaptersWithoutQuiz.slice(0, 2);
    for (const chapter of chaptersNeedingQuiz) {
      recommendations.push({
        type: 'quiz_practice',
        title: `Testa dig: ${chapter.title}`,
        description: `Du har läst detta kapitel men inte testat dina kunskaper med ett quiz.`,
        contentId: chapter.id,
        contentType: 'quiz',
        priority: 0.7,
        estimatedMinutes: 10,
      });
    }

    // 4. New content recommendations
    for (const chapter of analysis.unreadChapters.slice(0, 2)) {
      recommendations.push({
        type: 'new_content',
        title: `Nytt kapitel: ${chapter.title}`,
        description: `Fortsätt din utbildning med nästa kapitel i kursen.`,
        contentId: chapter.id,
        contentType: 'chapter',
        priority: 0.6,
        estimatedMinutes: chapter.estimatedMinutes,
      });
    }

    // 5. Chapter review recommendations (for chapters completed long ago)
    for (const chapter of analysis.chaptersNeedingReview.slice(0, 2)) {
      recommendations.push({
        type: 'chapter_review',
        title: `Repetera: ${chapter.title}`,
        description: `Det har gått ${chapter.daysSinceCompletion} dagar sedan du läste detta kapitel. En snabb genomgång rekommenderas.`,
        contentId: chapter.id,
        contentType: 'chapter',
        priority: 0.5,
        estimatedMinutes: Math.round(chapter.estimatedMinutes * 0.5),
        metadata: {
          daysAgo: chapter.daysSinceCompletion,
        },
      });
    }

    // Sort by priority
    recommendations.sort((a, b) => b.priority - a.priority);

    // Get learning profile
    const learningProfile = await this.getLearningProfile(userId);

    return {
      recommendations: recommendations.slice(0, 6),
      generatedAt: new Date(),
      learningProfile,
    };
  }

  /**
   * Get or create user learning profile
   */
  async getLearningProfile(userId: string): Promise<LearningProfileDto | null> {
    // Check for existing profile
    let profile = await this.prisma.userLearningProfile.findUnique({
      where: { userId },
    });

    // If no profile, create one based on user data
    if (!profile) {
      const analysis = await this.analyzeUserForProfile(userId);
      if (!analysis) return null;

      profile = await this.prisma.userLearningProfile.create({
        data: {
          userId,
          weakTopics: analysis.weakTopics,
          strongTopics: analysis.strongTopics,
          preferredTimes: analysis.preferredTimes,
          averageSession: analysis.averageSession,
          learningStyle: analysis.learningStyle,
        },
      });
    }

    return {
      userId: profile.userId,
      weakTopics: profile.weakTopics as string[],
      strongTopics: profile.strongTopics as string[],
      preferredTimes: profile.preferredTimes as string[] | undefined,
      averageSession: profile.averageSession || undefined,
      learningStyle: profile.learningStyle as 'visual' | 'reading' | 'practice' | undefined,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Update learning profile based on new activity
   */
  async updateLearningProfile(userId: string): Promise<void> {
    const analysis = await this.analyzeUserForProfile(userId);
    if (!analysis) return;

    await this.prisma.userLearningProfile.upsert({
      where: { userId },
      create: {
        userId,
        weakTopics: analysis.weakTopics,
        strongTopics: analysis.strongTopics,
        preferredTimes: analysis.preferredTimes,
        averageSession: analysis.averageSession,
        learningStyle: analysis.learningStyle,
      },
      update: {
        weakTopics: analysis.weakTopics,
        strongTopics: analysis.strongTopics,
        preferredTimes: analysis.preferredTimes,
        averageSession: analysis.averageSession,
        learningStyle: analysis.learningStyle,
      },
    });
  }

  /**
   * Analyze user performance for recommendations
   */
  private analyzePerformance(user: any) {
    const now = new Date();

    // Find weak chapters (low quiz scores)
    const chapterScores = new Map<string, { scores: number[]; chapter: any }>();

    for (const attempt of user.quizAttempts) {
      if (attempt.chapterId) {
        const existing = chapterScores.get(attempt.chapterId) || { scores: [], chapter: null };
        existing.scores.push(attempt.score);
        chapterScores.set(attempt.chapterId, existing);
      }
    }

    // Get chapter details
    const weakChapters: Array<{
      id: string;
      title: string;
      lastScore: number;
      estimatedMinutes: number;
    }> = [];

    for (const progress of user.chapterProgress) {
      const scoreData = chapterScores.get(progress.chapterId);
      if (scoreData && scoreData.scores.length > 0) {
        const lastScore = scoreData.scores[0];
        if (lastScore < 70) {
          weakChapters.push({
            id: progress.chapter.id,
            title: progress.chapter.title,
            lastScore,
            estimatedMinutes: progress.chapter.estimatedMinutes,
          });
        }
      }
    }

    // Find chapters completed without quiz
    const completedChapterIds = user.chapterProgress
      .filter((cp: any) => cp.completedAt !== null)
      .map((cp: any) => cp.chapterId);

    const attemptedChapterIds = new Set(
      user.quizAttempts.filter((a: any) => a.chapterId).map((a: any) => a.chapterId),
    );

    const completedChaptersWithoutQuiz = user.chapterProgress
      .filter(
        (cp: any) =>
          cp.completedAt !== null &&
          !attemptedChapterIds.has(cp.chapterId),
      )
      .map((cp: any) => ({
        id: cp.chapter.id,
        title: cp.chapter.title,
      }));

    // Find unread chapters (no progress started)
    const startedChapterIds = new Set(user.chapterProgress.map((cp: any) => cp.chapterId));

    // We'd need all chapters to find unread ones - simplified here
    const unreadChapters: Array<{
      id: string;
      title: string;
      estimatedMinutes: number;
    }> = [];

    // Find chapters needing review (completed more than 14 days ago)
    const chaptersNeedingReview: Array<{
      id: string;
      title: string;
      daysSinceCompletion: number;
      estimatedMinutes: number;
    }> = [];

    for (const progress of user.chapterProgress) {
      if (progress.completedAt) {
        const daysSinceCompletion = Math.floor(
          (now.getTime() - new Date(progress.completedAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceCompletion > 14) {
          chaptersNeedingReview.push({
            id: progress.chapter.id,
            title: progress.chapter.title,
            daysSinceCompletion,
            estimatedMinutes: progress.chapter.estimatedMinutes,
          });
        }
      }
    }

    return {
      weakChapters,
      completedChaptersWithoutQuiz,
      unreadChapters,
      chaptersNeedingReview,
    };
  }

  /**
   * Analyze user data for learning profile
   */
  private async analyzeUserForProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 100,
        },
        chapterProgress: true,
      },
    });

    if (!user) return null;

    // Analyze weak topics (chapters with low quiz scores)
    const chapterScores = new Map<string, number[]>();
    for (const attempt of user.quizAttempts) {
      if (attempt.chapterId) {
        const scores = chapterScores.get(attempt.chapterId) || [];
        scores.push(attempt.score);
        chapterScores.set(attempt.chapterId, scores);
      }
    }

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    for (const [chapterId, scores] of chapterScores) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < 60) {
        weakTopics.push(chapterId);
      } else if (avgScore > 85) {
        strongTopics.push(chapterId);
      }
    }

    // Analyze preferred study times
    const activityHours = user.quizAttempts
      .filter((a) => a.completedAt)
      .map((a) => new Date(a.completedAt!).getHours());

    const preferredTimes: string[] = [];
    const hourCounts = new Map<number, number>();
    for (const hour of activityHours) {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Find most common study hours
    const sortedHours = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (sortedHours.length > 0) {
      const topHour = sortedHours[0][0];
      if (topHour >= 6 && topHour < 12) preferredTimes.push('morning');
      else if (topHour >= 12 && topHour < 18) preferredTimes.push('afternoon');
      else preferredTimes.push('evening');
    }

    // Calculate average session length
    const sessionLengths = user.quizAttempts
      .filter((a) => a.timeSpentSeconds)
      .map((a) => a.timeSpentSeconds!);

    const averageSession =
      sessionLengths.length > 0
        ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length / 60)
        : undefined;

    // Determine learning style based on behavior
    const completedChapters = user.chapterProgress.filter((cp) => cp.completedAt).length;
    const passedQuizzes = user.quizAttempts.filter((a) => a.passed).length;

    let learningStyle: 'visual' | 'reading' | 'practice' | undefined;
    if (passedQuizzes > completedChapters * 1.5) {
      learningStyle = 'practice';
    } else if (completedChapters > passedQuizzes * 1.5) {
      learningStyle = 'reading';
    }

    return {
      weakTopics,
      strongTopics,
      preferredTimes,
      averageSession,
      learningStyle,
    };
  }
}
