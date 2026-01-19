import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SessionTrackingService } from './services/session-tracking.service';

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
  passed: boolean | null;
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

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SessionTrackingService))
    private sessionTrackingService: SessionTrackingService,
  ) {}

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
      sessionStats,
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
      this.sessionTrackingService.getSessionStats(30),
    ]);

    return {
      totalUsers,
      activeUsersLast7Days,
      activeUsersLast30Days,
      newUsersLast7Days,
      newUsersLast30Days,
      averageSessionDuration: sessionStats.averageDuration,
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
            lastAccessedAt: {
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
            timeSpentSeconds: true,
          },
        },
      },
    });

    return questions.map((q: { id: string; questionCode: string; attempts: Array<{ isCorrect: boolean; timeSpentSeconds: number | null }> }) => {
      const attempts = q.attempts.length;
      const correctCount = q.attempts.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
      const totalTime = q.attempts.reduce((sum: number, a: { timeSpentSeconds: number | null }) => sum + (a.timeSpentSeconds || 0), 0);

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

  // ============================================
  // KOHORTJÄMFÖRELSE (Fas 11)
  // ============================================

  /**
   * Jämför flera kohorter mot varandra
   */
  async compareCohorts(cohortIds: string[]): Promise<{
    cohorts: CohortComparisonData[];
    metrics: ComparisonMetric[];
    radarData: RadarChartData[];
  }> {
    const cohorts = await this.prisma.cohort.findMany({
      where: { id: { in: cohortIds } },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                totalXP: true,
                level: true,
                chapterProgress: { select: { readProgress: true } },
                quizAttempts: { select: { score: true, passed: true, type: true } },
              },
            },
            osceAssessments: { select: { passed: true, totalScore: true } },
          },
        },
        course: { select: { name: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });

    const cohortData: CohortComparisonData[] = cohorts.map((cohort) => {
      const enrollments = cohort.enrollments;
      const participants = enrollments.length;
      const activeCount = enrollments.filter((e) => e.status === 'ACTIVE').length;
      const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;

      // Beräkna genomsnittlig progress
      let totalProgress = 0;
      let progressCount = 0;
      for (const e of enrollments) {
        const progress = e.user.chapterProgress;
        if (progress.length > 0) {
          totalProgress += progress.reduce((s, p) => s + p.readProgress, 0) / progress.length;
          progressCount++;
        }
      }
      const avgProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

      // Quiz-statistik
      const allQuizAttempts = enrollments.flatMap((e) => e.user.quizAttempts);
      const examAttempts = allQuizAttempts.filter((a) => a.type === 'EXAM');
      const avgQuizScore = allQuizAttempts.length > 0
        ? Math.round(allQuizAttempts.reduce((s, a) => s + a.score, 0) / allQuizAttempts.length)
        : 0;
      const examPassRate = examAttempts.length > 0
        ? Math.round((examAttempts.filter((a) => a.passed).length / examAttempts.length) * 100)
        : 0;

      // OSCE-statistik
      const osceAssessments = enrollments.flatMap((e) => e.osceAssessments);
      const oscePassRate = osceAssessments.length > 0
        ? Math.round((osceAssessments.filter((a) => a.passed).length / osceAssessments.length) * 100)
        : 0;
      const avgOsceScore = osceAssessments.length > 0
        ? Math.round(osceAssessments.reduce((s, a) => s + (a.totalScore || 0), 0) / osceAssessments.length)
        : 0;

      // Engagemang
      const avgXP = participants > 0
        ? Math.round(enrollments.reduce((s, e) => s + e.user.totalXP, 0) / participants)
        : 0;
      const avgLevel = participants > 0
        ? Math.round(enrollments.reduce((s, e) => s + e.user.level, 0) / participants * 10) / 10
        : 0;

      return {
        id: cohort.id,
        name: cohort.name,
        course: cohort.course.name,
        instructor: `${cohort.instructor.firstName} ${cohort.instructor.lastName}`,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        participants,
        activeCount,
        completedCount,
        completionRate: participants > 0 ? Math.round((completedCount / participants) * 100) : 0,
        avgProgress,
        avgQuizScore,
        examPassRate,
        oscePassRate,
        avgOsceScore,
        avgXP,
        avgLevel,
      };
    });

    // Skapa jämförelsemetrik
    const metrics: ComparisonMetric[] = [
      { name: 'Slutförandegrad', unit: '%', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.completionRate })) },
      { name: 'Genomsnittlig progress', unit: '%', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.avgProgress })) },
      { name: 'Snitt quiz-poäng', unit: 'poäng', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.avgQuizScore })) },
      { name: 'Examen godkänd', unit: '%', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.examPassRate })) },
      { name: 'OSCE godkänd', unit: '%', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.oscePassRate })) },
      { name: 'Snitt XP', unit: 'XP', values: cohortData.map((c) => ({ cohortId: c.id, cohortName: c.name, value: c.avgXP })) },
    ];

    // Radardiagram-data (normaliserat till 0-100)
    const radarData: RadarChartData[] = cohortData.map((c) => ({
      cohortId: c.id,
      cohortName: c.name,
      axes: [
        { axis: 'Slutförande', value: c.completionRate },
        { axis: 'Progress', value: c.avgProgress },
        { axis: 'Quiz', value: c.avgQuizScore },
        { axis: 'Examen', value: c.examPassRate },
        { axis: 'OSCE', value: c.oscePassRate },
        { axis: 'Engagemang', value: Math.min(100, Math.round(c.avgXP / 50)) }, // Normalisera XP
      ],
    }));

    return { cohorts: cohortData, metrics, radarData };
  }

  /**
   * Jämför en kohort mot plattformssnittet
   */
  async benchmarkCohort(cohortId: string): Promise<{
    cohort: CohortComparisonData;
    platformAverage: CohortComparisonData;
    comparison: BenchmarkComparison[];
  }> {
    // Hämta kohortdata
    const { cohorts } = await this.compareCohorts([cohortId]);
    if (cohorts.length === 0) {
      throw new Error('Kohort hittades inte');
    }
    const cohort = cohorts[0];

    // Beräkna plattformssnitt
    const allCohorts = await this.prisma.cohort.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                totalXP: true,
                level: true,
                chapterProgress: { select: { readProgress: true } },
                quizAttempts: { select: { score: true, passed: true, type: true } },
              },
            },
            osceAssessments: { select: { passed: true, totalScore: true } },
          },
        },
      },
    });

    // Aggregera plattformsdata
    let totalParticipants = 0;
    let totalCompleted = 0;
    let totalProgress = 0;
    let progressCount = 0;
    let totalQuizScore = 0;
    let quizCount = 0;
    let totalExamPassed = 0;
    let examCount = 0;
    let totalOscePassed = 0;
    let osceCount = 0;
    let totalXP = 0;
    let totalLevel = 0;

    for (const c of allCohorts) {
      totalParticipants += c.enrollments.length;
      totalCompleted += c.enrollments.filter((e) => e.status === 'COMPLETED').length;

      for (const e of c.enrollments) {
        totalXP += e.user.totalXP;
        totalLevel += e.user.level;

        const progress = e.user.chapterProgress;
        if (progress.length > 0) {
          totalProgress += progress.reduce((s, p) => s + p.readProgress, 0) / progress.length;
          progressCount++;
        }

        for (const q of e.user.quizAttempts) {
          totalQuizScore += q.score;
          quizCount++;
          if (q.type === 'EXAM') {
            examCount++;
            if (q.passed) totalExamPassed++;
          }
        }

        for (const o of e.osceAssessments) {
          osceCount++;
          if (o.passed) totalOscePassed++;
        }
      }
    }

    const platformAverage: CohortComparisonData = {
      id: 'platform',
      name: 'Plattformssnitt',
      course: '-',
      instructor: '-',
      startDate: new Date(),
      endDate: null,
      participants: totalParticipants,
      activeCount: 0,
      completedCount: totalCompleted,
      completionRate: totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0,
      avgProgress: progressCount > 0 ? Math.round(totalProgress / progressCount) : 0,
      avgQuizScore: quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0,
      examPassRate: examCount > 0 ? Math.round((totalExamPassed / examCount) * 100) : 0,
      oscePassRate: osceCount > 0 ? Math.round((totalOscePassed / osceCount) * 100) : 0,
      avgOsceScore: 0,
      avgXP: totalParticipants > 0 ? Math.round(totalXP / totalParticipants) : 0,
      avgLevel: totalParticipants > 0 ? Math.round(totalLevel / totalParticipants * 10) / 10 : 0,
    };

    // Skapa jämförelse
    const comparison: BenchmarkComparison[] = [
      {
        metric: 'Slutförandegrad',
        cohortValue: cohort.completionRate,
        platformValue: platformAverage.completionRate,
        difference: cohort.completionRate - platformAverage.completionRate,
        unit: '%',
      },
      {
        metric: 'Genomsnittlig progress',
        cohortValue: cohort.avgProgress,
        platformValue: platformAverage.avgProgress,
        difference: cohort.avgProgress - platformAverage.avgProgress,
        unit: '%',
      },
      {
        metric: 'Snitt quiz-poäng',
        cohortValue: cohort.avgQuizScore,
        platformValue: platformAverage.avgQuizScore,
        difference: cohort.avgQuizScore - platformAverage.avgQuizScore,
        unit: 'poäng',
      },
      {
        metric: 'Examen godkänd',
        cohortValue: cohort.examPassRate,
        platformValue: platformAverage.examPassRate,
        difference: cohort.examPassRate - platformAverage.examPassRate,
        unit: '%',
      },
      {
        metric: 'OSCE godkänd',
        cohortValue: cohort.oscePassRate,
        platformValue: platformAverage.oscePassRate,
        difference: cohort.oscePassRate - platformAverage.oscePassRate,
        unit: '%',
      },
      {
        metric: 'Snitt XP',
        cohortValue: cohort.avgXP,
        platformValue: platformAverage.avgXP,
        difference: cohort.avgXP - platformAverage.avgXP,
        unit: 'XP',
      },
    ];

    return { cohort, platformAverage, comparison };
  }
}

// Typdeklarationer för kohortjämförelse
export interface CohortComparisonData {
  id: string;
  name: string;
  course: string;
  instructor: string;
  startDate: Date;
  endDate: Date | null;
  participants: number;
  activeCount: number;
  completedCount: number;
  completionRate: number;
  avgProgress: number;
  avgQuizScore: number;
  examPassRate: number;
  oscePassRate: number;
  avgOsceScore: number;
  avgXP: number;
  avgLevel: number;
}

export interface ComparisonMetric {
  name: string;
  unit: string;
  values: { cohortId: string; cohortName: string; value: number }[];
}

export interface RadarChartData {
  cohortId: string;
  cohortName: string;
  axes: { axis: string; value: number }[];
}

export interface BenchmarkComparison {
  metric: string;
  cohortValue: number;
  platformValue: number;
  difference: number;
  unit: string;
}
