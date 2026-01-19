import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '../../types/prisma-types';

// Report Types
export type ReportType = 'cohort' | 'question' | 'progress' | 'learner' | 'custom';

export interface ReportFilter {
  cohortId?: string;
  courseId?: string;
  dateRange?: { start: Date; end: Date };
  userIds?: string[];
  minProgress?: number;
  maxProgress?: number;
  bloomLevels?: string[];
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'percentage';
  visible: boolean;
}

export interface ReportConfiguration {
  reportType: ReportType;
  title: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCharts?: boolean;
}

export interface ReportResult {
  title: string;
  generatedAt: Date;
  filters: ReportFilter;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: Record<string, unknown>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  title: string;
  data: { label: string; value: number }[];
}

export interface SavedReportDto {
  name: string;
  description?: string;
  reportType: ReportType;
  configuration: ReportConfiguration;
  schedule?: string;
}

@Injectable()
export class ReportBuilderService {
  private readonly logger = new Logger(ReportBuilderService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // RAPPORTGENERERING
  // ============================================

  /**
   * Generera rapport baserat på konfiguration
   */
  async generateReport(config: ReportConfiguration): Promise<ReportResult> {
    this.logger.log(`Generating ${config.reportType} report: ${config.title}`);

    switch (config.reportType) {
      case 'cohort':
        return this.generateCohortReport(config);
      case 'question':
        return this.generateQuestionReport(config);
      case 'progress':
        return this.generateProgressReport(config);
      case 'learner':
        return this.generateLearnerReport(config);
      case 'custom':
        return this.generateCustomReport(config);
      default:
        throw new Error(`Unknown report type: ${config.reportType}`);
    }
  }

  /**
   * Kohortrapport - jämför kohorter
   */
  private async generateCohortReport(config: ReportConfiguration): Promise<ReportResult> {
    const { filters } = config;

    const cohorts = await this.prisma.cohort.findMany({
      where: {
        ...(filters.cohortId && { id: filters.cohortId }),
        ...(filters.courseId && { courseId: filters.courseId }),
        isActive: true,
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                totalXP: true,
                level: true,
                chapterProgress: {
                  select: { readProgress: true },
                },
              },
            },
            osceAssessments: {
              select: { passed: true, totalScore: true },
            },
          },
        },
        course: {
          select: { name: true, code: true },
        },
        instructor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const data = cohorts.map((cohort) => {
      const participants = cohort.enrollments;
      const activeCount = participants.filter((e) => e.status === 'ACTIVE').length;
      const completedCount = participants.filter((e) => e.status === 'COMPLETED').length;

      // Beräkna genomsnittlig progress
      let totalProgress = 0;
      let progressCount = 0;
      for (const enrollment of participants) {
        const userProgress = enrollment.user.chapterProgress;
        if (userProgress.length > 0) {
          const avg = userProgress.reduce((sum, p) => sum + p.readProgress, 0) / userProgress.length;
          totalProgress += avg;
          progressCount++;
        }
      }

      // OSCE-statistik
      const osceAttempts = participants.flatMap((e) => e.osceAssessments);
      const oscePassed = osceAttempts.filter((a) => a.passed).length;
      const osceAvgScore = osceAttempts.length > 0
        ? osceAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / osceAttempts.length
        : 0;

      return {
        cohortId: cohort.id,
        cohortName: cohort.name,
        courseName: cohort.course.name,
        instructor: `${cohort.instructor.firstName} ${cohort.instructor.lastName}`,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        totalParticipants: participants.length,
        activeParticipants: activeCount,
        completedParticipants: completedCount,
        completionRate: participants.length > 0 ? Math.round((completedCount / participants.length) * 100) : 0,
        averageProgress: progressCount > 0 ? Math.round(totalProgress / progressCount) : 0,
        oscePassRate: osceAttempts.length > 0 ? Math.round((oscePassed / osceAttempts.length) * 100) : 0,
        osceAverageScore: Math.round(osceAvgScore),
        averageXP: participants.length > 0
          ? Math.round(participants.reduce((sum, e) => sum + e.user.totalXP, 0) / participants.length)
          : 0,
      };
    });

    // Sammanfattning
    const summary = {
      totalCohorts: data.length,
      totalParticipants: data.reduce((sum, c) => sum + c.totalParticipants, 0),
      averageCompletionRate: data.length > 0
        ? Math.round(data.reduce((sum, c) => sum + c.completionRate, 0) / data.length)
        : 0,
      averageOscePassRate: data.length > 0
        ? Math.round(data.reduce((sum, c) => sum + c.oscePassRate, 0) / data.length)
        : 0,
    };

    return {
      title: config.title || 'Kohortrapport',
      generatedAt: new Date(),
      filters,
      columns: this.getCohortColumns(),
      data,
      summary,
      charts: config.includeCharts ? this.generateCohortCharts(data) : undefined,
    };
  }

  /**
   * Frågeprestationsrapport
   */
  private async generateQuestionReport(config: ReportConfiguration): Promise<ReportResult> {
    const { filters } = config;

    const questions = await this.prisma.quizQuestion.findMany({
      where: {
        ...(filters.courseId && {
          chapter: { part: { courseId: filters.courseId } },
        }),
        ...(filters.bloomLevels && filters.bloomLevels.length > 0 && {
          bloomLevel: { in: filters.bloomLevels },
        }),
        isActive: true,
      },
      include: {
        chapter: {
          select: { title: true, sortOrder: true },
        },
        attempts: {
          where: {
            ...(filters.dateRange && {
              attempt: {
                startedAt: {
                  gte: filters.dateRange.start,
                  lte: filters.dateRange.end,
                },
              },
            }),
          },
          select: {
            isCorrect: true,
            timeSpentSeconds: true,
            selectedOptionId: true,
          },
        },
      },
    });

    const data = questions.map((q) => {
      const attempts = q.attempts;
      const correctCount = attempts.filter((a) => a.isCorrect).length;
      const avgTime = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / attempts.length)
        : 0;

      // Svårighetsindikator baserat på korrekthetsgrad
      let difficulty = 'Okänd';
      const correctRate = attempts.length > 0 ? (correctCount / attempts.length) * 100 : 0;
      if (attempts.length >= 10) {
        if (correctRate >= 80) difficulty = 'Lätt';
        else if (correctRate >= 50) difficulty = 'Medel';
        else difficulty = 'Svår';
      }

      return {
        questionId: q.id,
        questionCode: q.questionCode,
        questionText: q.questionText.substring(0, 100) + (q.questionText.length > 100 ? '...' : ''),
        chapter: q.chapter?.title || '-',
        bloomLevel: q.bloomLevel,
        totalAttempts: attempts.length,
        correctAttempts: correctCount,
        correctRate: Math.round(correctRate),
        avgTimeSeconds: avgTime,
        difficulty,
      };
    });

    // Sortera efter korrekthetsgrad (lägst först = svåraste frågor)
    data.sort((a, b) => a.correctRate - b.correctRate);

    const summary = {
      totalQuestions: data.length,
      totalAttempts: data.reduce((sum, q) => sum + q.totalAttempts, 0),
      averageCorrectRate: data.length > 0
        ? Math.round(data.reduce((sum, q) => sum + q.correctRate, 0) / data.length)
        : 0,
      hardestQuestions: data.slice(0, 5).map((q) => ({
        code: q.questionCode,
        correctRate: q.correctRate,
      })),
      easiestQuestions: [...data].reverse().slice(0, 5).map((q) => ({
        code: q.questionCode,
        correctRate: q.correctRate,
      })),
    };

    return {
      title: config.title || 'Frågeprestation',
      generatedAt: new Date(),
      filters,
      columns: this.getQuestionColumns(),
      data,
      summary,
      charts: config.includeCharts ? this.generateQuestionCharts(data) : undefined,
    };
  }

  /**
   * Framstegsrapport
   */
  private async generateProgressReport(config: ReportConfiguration): Promise<ReportResult> {
    const { filters } = config;

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        ...(filters.cohortId && { cohortId: filters.cohortId }),
        ...(filters.courseId && { courseId: filters.courseId }),
        ...(filters.userIds && filters.userIds.length > 0 && { userId: { in: filters.userIds } }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            totalXP: true,
            level: true,
            currentStreak: true,
            lastActivityAt: true,
            chapterProgress: {
              select: {
                chapterId: true,
                readProgress: true,
                lastAccessedAt: true,
              },
            },
            quizAttempts: {
              select: {
                score: true,
                passed: true,
                type: true,
                completedAt: true,
              },
            },
          },
        },
        course: {
          select: { name: true, code: true },
          include: {
            parts: {
              include: {
                chapters: { select: { id: true } },
              },
            },
          },
        },
        cohort: {
          select: { name: true },
        },
      },
    });

    const data = enrollments.map((e) => {
      const totalChapters = e.course.parts.reduce((sum, p) => sum + p.chapters.length, 0);
      const completedChapters = e.user.chapterProgress.filter((p) => p.readProgress === 100).length;
      const averageProgress = e.user.chapterProgress.length > 0
        ? Math.round(e.user.chapterProgress.reduce((sum, p) => sum + p.readProgress, 0) / e.user.chapterProgress.length)
        : 0;

      const quizAttempts = e.user.quizAttempts;
      const examAttempts = quizAttempts.filter((a) => a.type === 'EXAM');
      const practiceAttempts = quizAttempts.filter((a) => a.type === 'PRACTICE');
      const avgExamScore = examAttempts.length > 0
        ? Math.round(examAttempts.reduce((sum, a) => sum + a.score, 0) / examAttempts.length)
        : 0;

      // Dagar sedan senaste aktivitet
      const daysSinceActivity = e.user.lastActivityAt
        ? Math.floor((Date.now() - e.user.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Risk-indikator
      let riskLevel = 'Låg';
      if (daysSinceActivity > 14 || (averageProgress < 30 && e.status === 'ACTIVE')) {
        riskLevel = 'Hög';
      } else if (daysSinceActivity > 7 || averageProgress < 50) {
        riskLevel = 'Medel';
      }

      return {
        odrop: e.id,
        name: `${e.user.firstName} ${e.user.lastName}`,
        email: e.user.email || '-',
        cohort: e.cohort?.name || '-',
        course: e.course.name,
        status: e.status,
        enrolledAt: e.enrolledAt,
        completedChapters,
        totalChapters,
        progress: averageProgress,
        totalXP: e.user.totalXP,
        level: e.user.level,
        streak: e.user.currentStreak,
        quizAttempts: quizAttempts.length,
        practiceAttempts: practiceAttempts.length,
        examAttempts: examAttempts.length,
        avgExamScore,
        lastActivity: e.user.lastActivityAt,
        daysSinceActivity,
        riskLevel,
      };
    });

    // Applicera progress-filter
    let filteredData = data;
    if (filters.minProgress !== undefined) {
      filteredData = filteredData.filter((d) => d.progress >= filters.minProgress!);
    }
    if (filters.maxProgress !== undefined) {
      filteredData = filteredData.filter((d) => d.progress <= filters.maxProgress!);
    }

    const summary = {
      totalLearners: filteredData.length,
      activeCount: filteredData.filter((d) => d.status === 'ACTIVE').length,
      completedCount: filteredData.filter((d) => d.status === 'COMPLETED').length,
      averageProgress: filteredData.length > 0
        ? Math.round(filteredData.reduce((sum, d) => sum + d.progress, 0) / filteredData.length)
        : 0,
      atRiskCount: filteredData.filter((d) => d.riskLevel === 'Hög').length,
      averageXP: filteredData.length > 0
        ? Math.round(filteredData.reduce((sum, d) => sum + d.totalXP, 0) / filteredData.length)
        : 0,
    };

    return {
      title: config.title || 'Framstegsrapport',
      generatedAt: new Date(),
      filters,
      columns: this.getProgressColumns(),
      data: filteredData,
      summary,
      charts: config.includeCharts ? this.generateProgressCharts(filteredData) : undefined,
    };
  }

  /**
   * Individuell deltagarrapport
   */
  private async generateLearnerReport(config: ReportConfiguration): Promise<ReportResult> {
    const { filters } = config;

    if (!filters.userIds || filters.userIds.length === 0) {
      throw new Error('Användar-ID krävs för deltagarrapport');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: filters.userIds } },
      include: {
        enrollments: {
          include: {
            course: { select: { name: true, code: true } },
            cohort: { select: { name: true } },
            osceAssessments: {
              include: {
                station: { select: { title: true, code: true } },
              },
            },
          },
        },
        chapterProgress: {
          include: {
            chapter: { select: { title: true, sortOrder: true } },
          },
        },
        quizAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 20,
          select: {
            score: true,
            passed: true,
            type: true,
            startedAt: true,
            completedAt: true,
          },
        },
        badges: {
          include: {
            badge: { select: { name: true, icon: true, category: true } },
          },
          orderBy: { earnedAt: 'desc' },
        },
        certificates: {
          select: {
            type: true,
            issuedAt: true,
            validUntil: true,
            verificationCode: true,
          },
        },
      },
    });

    const data = users.map((user) => {
      const completedChapters = user.chapterProgress.filter((p) => p.readProgress === 100);
      const examAttempts = user.quizAttempts.filter((a) => a.type === 'EXAM');
      const bestExamScore = examAttempts.length > 0
        ? Math.max(...examAttempts.map((a) => a.score))
        : 0;

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        workplace: user.workplace,
        speciality: user.speciality,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        totalXP: user.totalXP,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        completedChapters: completedChapters.length,
        totalQuizAttempts: user.quizAttempts.length,
        examAttempts: examAttempts.length,
        bestExamScore,
        badgesEarned: user.badges.length,
        certificates: user.certificates.length,
        enrollments: user.enrollments.map((e) => ({
          course: e.course.name,
          cohort: e.cohort?.name,
          status: e.status,
          enrolledAt: e.enrolledAt,
          osceCompleted: e.osceAssessments.filter((a) => a.passed).length,
        })),
        recentBadges: user.badges.slice(0, 5).map((b) => ({
          name: b.badge.name,
          category: b.badge.category,
          earnedAt: b.earnedAt,
        })),
      };
    });

    return {
      title: config.title || 'Deltagarrapport',
      generatedAt: new Date(),
      filters,
      columns: this.getLearnerColumns(),
      data,
      summary: {
        totalLearners: data.length,
        averageXP: Math.round(data.reduce((sum, d) => sum + d.totalXP, 0) / data.length),
        averageLevel: Math.round(data.reduce((sum, d) => sum + d.level, 0) / data.length),
        totalBadges: data.reduce((sum, d) => sum + d.badgesEarned, 0),
      },
    };
  }

  /**
   * Anpassad rapport (flexibel)
   */
  private async generateCustomReport(config: ReportConfiguration): Promise<ReportResult> {
    // Anpassad rapport baserad på valda kolumner och filter
    // Mer komplex logik kan läggas till här
    return this.generateProgressReport(config);
  }

  // ============================================
  // SPARADE RAPPORTER
  // ============================================

  /**
   * Spara rapportkonfiguration
   */
  async saveReport(userId: string, dto: SavedReportDto) {
    return this.prisma.savedReport.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        reportType: dto.reportType,
        configuration: dto.configuration as unknown as Record<string, unknown>,
        schedule: dto.schedule,
      },
    });
  }

  /**
   * Hämta sparade rapporter för användare
   */
  async getSavedReports(userId: string, role: UserRole) {
    // Admin och instruktörer kan se alla rapporter
    const where = role === UserRole.ADMIN
      ? {}
      : { userId };

    return this.prisma.savedReport.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Hämta en sparad rapport
   */
  async getSavedReport(id: string, userId: string, role: UserRole) {
    const report = await this.prisma.savedReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Rapport hittades inte');
    }

    if (report.userId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Ingen åtkomst till denna rapport');
    }

    return report;
  }

  /**
   * Kör en sparad rapport
   */
  async runSavedReport(id: string, userId: string, role: UserRole) {
    const savedReport = await this.getSavedReport(id, userId, role);
    const config = savedReport.configuration as unknown as ReportConfiguration;

    const result = await this.generateReport(config);

    // Uppdatera lastRunAt
    await this.prisma.savedReport.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    return result;
  }

  /**
   * Uppdatera sparad rapport
   */
  async updateSavedReport(id: string, userId: string, role: UserRole, dto: Partial<SavedReportDto>) {
    const existing = await this.getSavedReport(id, userId, role);

    if (existing.userId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Kan inte uppdatera annan användares rapport');
    }

    return this.prisma.savedReport.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.configuration && { configuration: dto.configuration as unknown as Record<string, unknown> }),
        ...(dto.schedule !== undefined && { schedule: dto.schedule }),
      },
    });
  }

  /**
   * Ta bort sparad rapport
   */
  async deleteSavedReport(id: string, userId: string, role: UserRole) {
    const existing = await this.getSavedReport(id, userId, role);

    if (existing.userId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Kan inte ta bort annan användares rapport');
    }

    return this.prisma.savedReport.delete({ where: { id } });
  }

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Exportera rapport till CSV
   */
  exportToCSV(result: ReportResult): string {
    const { columns, data } = result;
    const visibleColumns = columns.filter((c) => c.visible);

    // Header-rad
    const header = visibleColumns.map((c) => `"${c.label}"`).join(',');

    // Data-rader
    const rows = data.map((row) =>
      visibleColumns
        .map((col) => {
          const value = row[col.field];
          if (value === null || value === undefined) return '""';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          if (value instanceof Date) return `"${value.toISOString()}"`;
          return `"${value}"`;
        })
        .join(',')
    );

    return [header, ...rows].join('\n');
  }

  /**
   * Exportera rapport till JSON
   */
  exportToJSON(result: ReportResult): string {
    return JSON.stringify(result, null, 2);
  }

  // ============================================
  // HJÄLPMETODER
  // ============================================

  private getCohortColumns(): ReportColumn[] {
    return [
      { field: 'cohortName', label: 'Kohort', type: 'string', visible: true },
      { field: 'courseName', label: 'Kurs', type: 'string', visible: true },
      { field: 'instructor', label: 'Instruktör', type: 'string', visible: true },
      { field: 'startDate', label: 'Startdatum', type: 'date', visible: true },
      { field: 'totalParticipants', label: 'Deltagare', type: 'number', visible: true },
      { field: 'activeParticipants', label: 'Aktiva', type: 'number', visible: true },
      { field: 'completionRate', label: 'Slutförandegrad', type: 'percentage', visible: true },
      { field: 'averageProgress', label: 'Snittframsteg', type: 'percentage', visible: true },
      { field: 'oscePassRate', label: 'OSCE-godkända', type: 'percentage', visible: true },
      { field: 'averageXP', label: 'Snitt-XP', type: 'number', visible: true },
    ];
  }

  private getQuestionColumns(): ReportColumn[] {
    return [
      { field: 'questionCode', label: 'Frågekod', type: 'string', visible: true },
      { field: 'questionText', label: 'Frågetext', type: 'string', visible: true },
      { field: 'chapter', label: 'Kapitel', type: 'string', visible: true },
      { field: 'bloomLevel', label: 'Bloom-nivå', type: 'string', visible: true },
      { field: 'totalAttempts', label: 'Försök', type: 'number', visible: true },
      { field: 'correctRate', label: 'Korrekthetsgrad', type: 'percentage', visible: true },
      { field: 'avgTimeSeconds', label: 'Snitttid (sek)', type: 'number', visible: true },
      { field: 'difficulty', label: 'Svårighetsgrad', type: 'string', visible: true },
    ];
  }

  private getProgressColumns(): ReportColumn[] {
    return [
      { field: 'name', label: 'Namn', type: 'string', visible: true },
      { field: 'email', label: 'E-post', type: 'string', visible: true },
      { field: 'cohort', label: 'Kohort', type: 'string', visible: true },
      { field: 'status', label: 'Status', type: 'string', visible: true },
      { field: 'progress', label: 'Framsteg', type: 'percentage', visible: true },
      { field: 'completedChapters', label: 'Kapitel klara', type: 'number', visible: true },
      { field: 'totalXP', label: 'XP', type: 'number', visible: true },
      { field: 'quizAttempts', label: 'Quiz-försök', type: 'number', visible: true },
      { field: 'avgExamScore', label: 'Snitt examenspoäng', type: 'number', visible: true },
      { field: 'daysSinceActivity', label: 'Dagar sedan aktivitet', type: 'number', visible: true },
      { field: 'riskLevel', label: 'Risknivå', type: 'string', visible: true },
    ];
  }

  private getLearnerColumns(): ReportColumn[] {
    return [
      { field: 'name', label: 'Namn', type: 'string', visible: true },
      { field: 'email', label: 'E-post', type: 'string', visible: true },
      { field: 'workplace', label: 'Arbetsplats', type: 'string', visible: true },
      { field: 'totalXP', label: 'XP', type: 'number', visible: true },
      { field: 'level', label: 'Nivå', type: 'number', visible: true },
      { field: 'currentStreak', label: 'Streak', type: 'number', visible: true },
      { field: 'completedChapters', label: 'Kapitel klara', type: 'number', visible: true },
      { field: 'bestExamScore', label: 'Bästa examen', type: 'number', visible: true },
      { field: 'badgesEarned', label: 'Badges', type: 'number', visible: true },
      { field: 'certificates', label: 'Certifikat', type: 'number', visible: true },
    ];
  }

  private generateCohortCharts(data: Record<string, unknown>[]): ChartData[] {
    return [
      {
        type: 'bar',
        title: 'Slutförandegrad per kohort',
        data: data.map((c) => ({
          label: c.cohortName as string,
          value: c.completionRate as number,
        })),
      },
      {
        type: 'bar',
        title: 'OSCE-godkända per kohort',
        data: data.map((c) => ({
          label: c.cohortName as string,
          value: c.oscePassRate as number,
        })),
      },
    ];
  }

  private generateQuestionCharts(data: Record<string, unknown>[]): ChartData[] {
    // Gruppera efter svårighetsgrad
    const byDifficulty = new Map<string, number>();
    for (const q of data) {
      const diff = q.difficulty as string;
      byDifficulty.set(diff, (byDifficulty.get(diff) || 0) + 1);
    }

    return [
      {
        type: 'pie',
        title: 'Fördelning efter svårighetsgrad',
        data: Array.from(byDifficulty.entries()).map(([label, value]) => ({ label, value })),
      },
    ];
  }

  private generateProgressCharts(data: Record<string, unknown>[]): ChartData[] {
    // Gruppera efter risknivå
    const byRisk = new Map<string, number>();
    for (const d of data) {
      const risk = d.riskLevel as string;
      byRisk.set(risk, (byRisk.get(risk) || 0) + 1);
    }

    return [
      {
        type: 'pie',
        title: 'Fördelning efter risknivå',
        data: Array.from(byRisk.entries()).map(([label, value]) => ({ label, value })),
      },
    ];
  }
}
