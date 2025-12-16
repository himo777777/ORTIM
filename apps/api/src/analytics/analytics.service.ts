import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UserEngagementStats {
  totalUsers: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  averageSessionDuration: number;
}

export interface CourseProgressStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  completionRate: number;
}

export interface QuizStats {
  totalAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passRate: number;
  attemptsByBloomLevel: Record<string, { attempts: number; avgScore: number }>;
}

export interface CohortStats {
  id: string;
  name: string;
  totalParticipants: number;
  activeParticipants: number;
  averageProgress: number;
  oscePassRate: number;
}

// Internal types for query results
type QuizAttemptResult = {
  id: string;
  userId: string;
  score: number;
  passed: boolean;
  type: string | null;
};

type EnrollmentWithProgress = {
  status: string;
  user: {
    chapterProgress: Array<{ readProgress: number }>;
  };
  osceAssessments: Array<{ passed: boolean }>;
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  // Get overall platform statistics
  async getPlatformStats(): Promise<{
    users: UserEngagementStats;
    courses: CourseProgressStats;
    quiz: QuizStats;
  }> {
    const [users, courses, quiz] = await Promise.all([
      this.getUserEngagementStats(),
      this.getCourseProgressStats(),
      this.getQuizStats(),
    ]);

    return { users, courses, quiz };
  }

  // User engagement statistics
  async getUserEngagementStats(): Promise<UserEngagementStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersLast7Days,
      activeUsersLast30Days,
      newUsersLast7Days,
      newUsersLast30Days,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      totalUsers,
      activeUsersLast7Days,
      activeUsersLast30Days,
      newUsersLast7Days,
      newUsersLast30Days,
      averageSessionDuration: 0, // Would need session tracking
    };
  }

  // Course progress statistics
  async getCourseProgressStats(): Promise<CourseProgressStats> {
    const enrollments = await this.prisma.enrollment.findMany({
      select: { status: true },
    });

    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e: { status: string }) => e.status === 'ACTIVE').length;
    const completedEnrollments = enrollments.filter((e: { status: string }) => e.status === 'COMPLETED').length;

    // Calculate average progress
    const progressData = await this.prisma.chapterProgress.groupBy({
      by: ['userId'],
      _avg: { readProgress: true },
    });

    const averageProgress = progressData.length > 0
      ? progressData.reduce((sum: number, p: { _avg: { readProgress: number | null } }) => sum + (p._avg.readProgress || 0), 0) / progressData.length
      : 0;

    const completionRate = totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

    return {
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      averageProgress: Math.round(averageProgress),
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }

  // Quiz statistics
  async getQuizStats(): Promise<QuizStats> {
    const attempts = await this.prisma.quizAttempt.findMany({
      select: {
        id: true,
        userId: true,
        score: true,
        passed: true,
        type: true,
      },
    });

    const totalAttempts = attempts.length;
    const uniqueUsers = new Set(attempts.map((a: QuizAttemptResult) => a.userId)).size;
    const averageScore = attempts.length > 0
      ? attempts.reduce((sum: number, a: QuizAttemptResult) => sum + a.score, 0) / attempts.length
      : 0;
    const passedAttempts = attempts.filter((a: QuizAttemptResult) => a.passed).length;
    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

    // Group by type (using type as a proxy for Bloom level)
    const attemptsByBloomLevel: Record<string, { attempts: number; avgScore: number }> = {};
    const typeGroups = new Map<string, { scores: number[]; count: number }>();

    for (const attempt of attempts) {
      const type = attempt.type || 'PRACTICE';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, { scores: [], count: 0 });
      }
      const group = typeGroups.get(type)!;
      group.scores.push(attempt.score);
      group.count++;
    }

    for (const [type, data] of typeGroups) {
      attemptsByBloomLevel[type] = {
        attempts: data.count,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      };
    }

    return {
      totalAttempts,
      uniqueUsers,
      averageScore: Math.round(averageScore),
      passRate: Math.round(passRate * 10) / 10,
      attemptsByBloomLevel,
    };
  }

  // Get cohort analytics
  async getCohortAnalytics(): Promise<CohortStats[]> {
    const cohorts = await this.prisma.cohort.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          include: {
            user: {
              include: {
                chapterProgress: true,
              },
            },
            osceAssessments: true,
          },
        },
      },
    });

    return cohorts.map((cohort: { id: string; name: string; enrollments: EnrollmentWithProgress[] }) => {
      const participants = cohort.enrollments;
      const activeParticipants = participants.filter((e: EnrollmentWithProgress) => e.status === 'ACTIVE').length;

      // Calculate average progress
      let totalProgress = 0;
      let progressCount = 0;
      for (const enrollment of participants) {
        const userProgress = enrollment.user.chapterProgress;
        if (userProgress.length > 0) {
          const avgUserProgress = userProgress.reduce((sum: number, p: { readProgress: number }) => sum + p.readProgress, 0) / userProgress.length;
          totalProgress += avgUserProgress;
          progressCount++;
        }
      }

      // Calculate OSCE pass rate
      let totalOsceStations = 0;
      let passedOsceStations = 0;
      for (const enrollment of participants) {
        for (const assessment of enrollment.osceAssessments) {
          totalOsceStations++;
          if (assessment.passed) passedOsceStations++;
        }
      }

      return {
        id: cohort.id,
        name: cohort.name,
        totalParticipants: participants.length,
        activeParticipants,
        averageProgress: progressCount > 0 ? Math.round(totalProgress / progressCount) : 0,
        oscePassRate: totalOsceStations > 0
          ? Math.round((passedOsceStations / totalOsceStations) * 100)
          : 0,
      };
    });
  }

  // Get daily activity for chart
  async getDailyActivity(days: number = 30): Promise<{
    date: string;
    logins: number;
    quizAttempts: number;
    chaptersCompleted: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result: {
      date: string;
      logins: number;
      quizAttempts: number;
      chaptersCompleted: number;
    }[] = [];

    // Generate dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [logins, quizAttempts, chaptersCompleted] = await Promise.all([
        this.prisma.user.count({
          where: {
            lastLoginAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.quizAttempt.count({
          where: {
            startedAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.chapterProgress.count({
          where: {
            readProgress: 100,
            updatedAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      result.push({ date: dateStr, logins, quizAttempts, chaptersCompleted });
    }

    return result;
  }

  // Get question performance analytics
  async getQuestionAnalytics(): Promise<{
    questionId: string;
    questionCode: string;
    attempts: number;
    correctRate: number;
    avgTimeSpent: number;
  }[]> {
    const questions = await this.prisma.quizQuestion.findMany({
      include: {
        attempts: {
          select: {
            isCorrect: true,
            timeSpent: true,
          },
        },
      },
    });

    return questions.map((q: { id: string; questionCode: string; attempts: Array<{ isCorrect: boolean; timeSpent: number | null }> }) => {
      const attempts = q.attempts.length;
      const correctCount = q.attempts.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
      const totalTime = q.attempts.reduce((sum: number, a: { timeSpent: number | null }) => sum + (a.timeSpent || 0), 0);

      return {
        questionId: q.id,
        questionCode: q.questionCode,
        attempts,
        correctRate: attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
        avgTimeSpent: attempts > 0 ? Math.round(totalTime / attempts) : 0,
      };
    });
  }

  // Get certificate analytics
  async getCertificateAnalytics(): Promise<{
    totalIssued: number;
    issuedLast30Days: number;
    byMonth: { month: string; count: number }[];
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalIssued, issuedLast30Days, certificates] = await Promise.all([
      this.prisma.certificate.count(),
      this.prisma.certificate.count({
        where: { issuedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.certificate.findMany({
        select: { issuedAt: true },
        orderBy: { issuedAt: 'asc' },
      }),
    ]);

    // Group by month
    const byMonth: Map<string, number> = new Map();
    for (const cert of certificates) {
      const month = cert.issuedAt.toISOString().substring(0, 7); // YYYY-MM
      byMonth.set(month, (byMonth.get(month) || 0) + 1);
    }

    return {
      totalIssued,
      issuedLast30Days,
      byMonth: Array.from(byMonth.entries()).map(([month, count]) => ({ month, count })),
    };
  }
}
