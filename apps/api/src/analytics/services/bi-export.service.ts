import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

// Export types
export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ExportDataType =
  | 'users'
  | 'progress'
  | 'quiz_results'
  | 'sessions'
  | 'events'
  | 'cohorts'
  | 'certificates'
  | 'predictions';

export interface ExportFilter {
  startDate?: Date;
  endDate?: Date;
  cohortId?: string;
  userId?: string;
  courseId?: string;
}

export interface ExportConfig {
  dataType: ExportDataType;
  format: ExportFormat;
  filters?: ExportFilter;
  columns?: string[];
  includeHeaders?: boolean;
}

export interface ScheduledExport {
  id: string;
  name: string;
  config: ExportConfig;
  schedule: string; // Cron expression
  recipients: string[]; // Email addresses
  lastRunAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
}

export interface ExportResult {
  data: string | Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
  generatedAt: Date;
}

@Injectable()
export class BiExportService {
  private readonly logger = new Logger(BiExportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate export based on configuration
   */
  async generateExport(config: ExportConfig): Promise<ExportResult> {
    const data = await this.fetchData(config.dataType, config.filters);
    const filteredData = this.filterColumns(data, config.columns);

    switch (config.format) {
      case 'csv':
        return this.toCsv(filteredData, config);
      case 'json':
        return this.toJson(filteredData, config);
      case 'xlsx':
        return this.toXlsx(filteredData, config);
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }
  }

  /**
   * Fetch data based on data type
   */
  private async fetchData(
    dataType: ExportDataType,
    filters?: ExportFilter,
  ): Promise<Record<string, unknown>[]> {
    const dateFilter = this.buildDateFilter(filters);

    switch (dataType) {
      case 'users':
        return this.fetchUsers(filters);
      case 'progress':
        return this.fetchProgress(filters, dateFilter);
      case 'quiz_results':
        return this.fetchQuizResults(filters, dateFilter);
      case 'sessions':
        return this.fetchSessions(filters, dateFilter);
      case 'events':
        return this.fetchEvents(filters, dateFilter);
      case 'cohorts':
        return this.fetchCohorts(filters);
      case 'certificates':
        return this.fetchCertificates(filters, dateFilter);
      case 'predictions':
        return this.fetchPredictions(filters);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  private buildDateFilter(filters?: ExportFilter) {
    if (!filters?.startDate && !filters?.endDate) return undefined;

    return {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  /**
   * Fetch users data
   */
  private async fetchUsers(
    filters?: ExportFilter,
  ): Promise<Record<string, unknown>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(filters?.cohortId && {
          cohortMemberships: {
            some: { cohortId: filters.cohortId },
          },
        }),
        ...(filters?.userId && { id: filters.userId }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        xp: true,
        level: true,
        streak: true,
        cohortMemberships: {
          select: {
            cohort: {
              select: { name: true },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      cohorts: user.cohortMemberships.map((m) => m.cohort.name).join(', '),
    }));
  }

  /**
   * Fetch progress data
   */
  private async fetchProgress(
    filters?: ExportFilter,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<Record<string, unknown>[]> {
    const progress = await this.prisma.userChapterProgress.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.courseId && {
          chapter: { courseId: filters.courseId },
        }),
        ...(dateFilter && { updatedAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        chapter: {
          select: {
            title: true,
            orderIndex: true,
            course: {
              select: { name: true },
            },
          },
        },
      },
    });

    return progress.map((p) => ({
      userId: p.userId,
      userEmail: p.user.email,
      userName: `${p.user.firstName} ${p.user.lastName}`,
      chapterId: p.chapterId,
      chapterTitle: p.chapter.title,
      chapterOrder: p.chapter.orderIndex,
      courseName: p.chapter.course.name,
      status: p.status,
      progress: p.progress,
      timeSpentMinutes: Math.round(p.timeSpent / 60),
      completedAt: p.completedAt?.toISOString() || null,
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  /**
   * Fetch quiz results
   */
  private async fetchQuizResults(
    filters?: ExportFilter,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<Record<string, unknown>[]> {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(dateFilter && { completedAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        chapter: {
          select: {
            title: true,
            course: { select: { name: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return attempts.map((a) => ({
      attemptId: a.id,
      userId: a.userId,
      userEmail: a.user.email,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      chapterTitle: a.chapter?.title || 'General Quiz',
      courseName: a.chapter?.course.name || 'N/A',
      mode: a.mode,
      score: a.score,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      percentageScore: Math.round((a.correctAnswers / a.totalQuestions) * 100),
      passed: a.passed,
      timeSpentSeconds: a.timeSpent,
      completedAt: a.completedAt?.toISOString() || null,
    }));
  }

  /**
   * Fetch session data
   */
  private async fetchSessions(
    filters?: ExportFilter,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<Record<string, unknown>[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(dateFilter && { startedAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      userName: `${s.user.firstName} ${s.user.lastName}`,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() || null,
      durationMinutes: s.durationSeconds
        ? Math.round(s.durationSeconds / 60)
        : null,
      pageViews: s.pageViews,
      actions: s.actions,
      deviceType: s.deviceType,
      isActive: s.isActive,
    }));
  }

  /**
   * Fetch analytics events
   */
  private async fetchEvents(
    filters?: ExportFilter,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<Record<string, unknown>[]> {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(dateFilter && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limit for performance
    });

    return events.map((e) => ({
      eventId: e.id,
      userId: e.userId,
      sessionId: e.sessionId,
      eventType: e.eventType,
      eventName: e.eventName,
      pageUrl: e.pageUrl,
      properties: JSON.stringify(e.properties),
      timestamp: e.timestamp.toISOString(),
    }));
  }

  /**
   * Fetch cohorts data
   */
  private async fetchCohorts(
    filters?: ExportFilter,
  ): Promise<Record<string, unknown>[]> {
    const cohorts = await this.prisma.cohort.findMany({
      where: {
        ...(filters?.cohortId && { id: filters.cohortId }),
      },
      include: {
        _count: {
          select: { members: true },
        },
        course: {
          select: { name: true },
        },
      },
    });

    return cohorts.map((c) => ({
      cohortId: c.id,
      name: c.name,
      code: c.code,
      courseName: c.course.name,
      startDate: c.startDate?.toISOString() || null,
      endDate: c.endDate?.toISOString() || null,
      memberCount: c._count.members,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Fetch certificates data
   */
  private async fetchCertificates(
    filters?: ExportFilter,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<Record<string, unknown>[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.courseId && { courseId: filters.courseId }),
        ...(dateFilter && { issuedAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: { name: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certificates.map((c) => ({
      certificateId: c.id,
      verificationCode: c.verificationCode,
      userId: c.userId,
      userEmail: c.user.email,
      userName: `${c.user.firstName} ${c.user.lastName}`,
      courseName: c.course.name,
      type: c.type,
      issuedAt: c.issuedAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() || null,
      isValid: c.isValid,
    }));
  }

  /**
   * Fetch predictions data
   */
  private async fetchPredictions(
    filters?: ExportFilter,
  ): Promise<Record<string, unknown>[]> {
    const predictions = await this.prisma.userPrediction.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return predictions.map((p) => ({
      predictionId: p.id,
      userId: p.userId,
      userEmail: p.user.email,
      userName: `${p.user.firstName} ${p.user.lastName}`,
      predictionType: p.predictionType,
      value: p.value,
      confidence: p.confidence,
      factors: JSON.stringify(p.factors),
      generatedAt: p.generatedAt.toISOString(),
    }));
  }

  /**
   * Filter columns if specified
   */
  private filterColumns(
    data: Record<string, unknown>[],
    columns?: string[],
  ): Record<string, unknown>[] {
    if (!columns || columns.length === 0) return data;

    return data.map((row) => {
      const filtered: Record<string, unknown> = {};
      columns.forEach((col) => {
        if (col in row) {
          filtered[col] = row[col];
        }
      });
      return filtered;
    });
  }

  /**
   * Convert to CSV format
   */
  private toCsv(
    data: Record<string, unknown>[],
    config: ExportConfig,
  ): ExportResult {
    if (data.length === 0) {
      return {
        data: '',
        filename: `${config.dataType}_export_${Date.now()}.csv`,
        mimeType: 'text/csv',
        rowCount: 0,
        generatedAt: new Date(),
      };
    }

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    if (config.includeHeaders !== false) {
      rows.push(headers.map((h) => this.escapeCsvValue(h)).join(','));
    }

    data.forEach((row) => {
      const values = headers.map((h) => this.escapeCsvValue(row[h]));
      rows.push(values.join(','));
    });

    return {
      data: rows.join('\n'),
      filename: `${config.dataType}_export_${Date.now()}.csv`,
      mimeType: 'text/csv',
      rowCount: data.length,
      generatedAt: new Date(),
    };
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Convert to JSON format
   */
  private toJson(
    data: Record<string, unknown>[],
    config: ExportConfig,
  ): ExportResult {
    const result = {
      exportType: config.dataType,
      exportedAt: new Date().toISOString(),
      filters: config.filters,
      rowCount: data.length,
      data,
    };

    return {
      data: JSON.stringify(result, null, 2),
      filename: `${config.dataType}_export_${Date.now()}.json`,
      mimeType: 'application/json',
      rowCount: data.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Convert to Excel format (simplified - returns CSV with xlsx extension)
   * For full Excel support, use a library like exceljs
   */
  private toXlsx(
    data: Record<string, unknown>[],
    config: ExportConfig,
  ): ExportResult {
    // For a proper implementation, use exceljs or xlsx library
    // This is a simplified version that outputs tab-separated values
    if (data.length === 0) {
      return {
        data: '',
        filename: `${config.dataType}_export_${Date.now()}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: 0,
        generatedAt: new Date(),
      };
    }

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    if (config.includeHeaders !== false) {
      rows.push(headers.join('\t'));
    }

    data.forEach((row) => {
      const values = headers.map((h) => {
        const val = row[h];
        return val === null || val === undefined ? '' : String(val);
      });
      rows.push(values.join('\t'));
    });

    return {
      data: rows.join('\n'),
      filename: `${config.dataType}_export_${Date.now()}.tsv`,
      mimeType: 'text/tab-separated-values',
      rowCount: data.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Get available columns for a data type
   */
  getAvailableColumns(dataType: ExportDataType): string[] {
    const columnMap: Record<ExportDataType, string[]> = {
      users: [
        'id',
        'email',
        'firstName',
        'lastName',
        'fullName',
        'role',
        'createdAt',
        'lastLoginAt',
        'xp',
        'level',
        'streak',
        'cohorts',
      ],
      progress: [
        'userId',
        'userEmail',
        'userName',
        'chapterId',
        'chapterTitle',
        'chapterOrder',
        'courseName',
        'status',
        'progress',
        'timeSpentMinutes',
        'completedAt',
        'updatedAt',
      ],
      quiz_results: [
        'attemptId',
        'userId',
        'userEmail',
        'userName',
        'chapterTitle',
        'courseName',
        'mode',
        'score',
        'totalQuestions',
        'correctAnswers',
        'percentageScore',
        'passed',
        'timeSpentSeconds',
        'completedAt',
      ],
      sessions: [
        'sessionId',
        'userId',
        'userEmail',
        'userName',
        'startedAt',
        'endedAt',
        'durationMinutes',
        'pageViews',
        'actions',
        'deviceType',
        'isActive',
      ],
      events: [
        'eventId',
        'userId',
        'sessionId',
        'eventType',
        'eventName',
        'pageUrl',
        'properties',
        'timestamp',
      ],
      cohorts: [
        'cohortId',
        'name',
        'code',
        'courseName',
        'startDate',
        'endDate',
        'memberCount',
        'status',
        'createdAt',
      ],
      certificates: [
        'certificateId',
        'verificationCode',
        'userId',
        'userEmail',
        'userName',
        'courseName',
        'type',
        'issuedAt',
        'expiresAt',
        'isValid',
      ],
      predictions: [
        'predictionId',
        'userId',
        'userEmail',
        'userName',
        'predictionType',
        'value',
        'confidence',
        'factors',
        'generatedAt',
      ],
    };

    return columnMap[dataType] || [];
  }

  /**
   * Save scheduled export configuration
   */
  async saveScheduledExport(
    userId: string,
    name: string,
    config: ExportConfig,
    schedule: string,
    recipients: string[],
  ): Promise<{ id: string }> {
    const report = await this.prisma.savedReport.create({
      data: {
        userId,
        name,
        description: `BI Export: ${config.dataType}`,
        reportType: 'bi_export',
        configuration: {
          exportConfig: config,
          schedule,
          recipients,
        } as object,
        schedule,
      },
    });

    return { id: report.id };
  }

  /**
   * Get scheduled exports for user
   */
  async getScheduledExports(userId: string): Promise<ScheduledExport[]> {
    const reports = await this.prisma.savedReport.findMany({
      where: {
        userId,
        reportType: 'bi_export',
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((r) => {
      const config = r.configuration as {
        exportConfig: ExportConfig;
        schedule: string;
        recipients: string[];
      };
      return {
        id: r.id,
        name: r.name,
        config: config.exportConfig,
        schedule: config.schedule,
        recipients: config.recipients,
        lastRunAt: r.lastRunAt || undefined,
        nextRunAt: undefined, // Would need to calculate based on cron
        isActive: true,
      };
    });
  }

  /**
   * Delete scheduled export
   */
  async deleteScheduledExport(id: string, userId: string): Promise<void> {
    await this.prisma.savedReport.deleteMany({
      where: {
        id,
        userId,
        reportType: 'bi_export',
      },
    });
  }

  /**
   * Run scheduled exports (called by cron)
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runScheduledExports(): Promise<void> {
    this.logger.log('Running scheduled BI exports...');

    const scheduledReports = await this.prisma.savedReport.findMany({
      where: {
        reportType: 'bi_export',
        schedule: { not: null },
      },
    });

    for (const report of scheduledReports) {
      try {
        const config = report.configuration as {
          exportConfig: ExportConfig;
          recipients: string[];
        };

        const result = await this.generateExport(config.exportConfig);

        // Update last run timestamp
        await this.prisma.savedReport.update({
          where: { id: report.id },
          data: { lastRunAt: new Date() },
        });

        // Here you would send the export via email to recipients
        this.logger.log(
          `Generated export for report ${report.id}: ${result.rowCount} rows`,
        );
      } catch (error) {
        this.logger.error(`Failed to run scheduled export ${report.id}:`, error);
      }
    }
  }

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalExports: number;
    scheduledExports: number;
    lastExportAt: Date | null;
    popularDataTypes: { dataType: string; count: number }[];
  }> {
    const scheduledCount = await this.prisma.savedReport.count({
      where: { reportType: 'bi_export' },
    });

    const lastExport = await this.prisma.savedReport.findFirst({
      where: {
        reportType: 'bi_export',
        lastRunAt: { not: null },
      },
      orderBy: { lastRunAt: 'desc' },
    });

    return {
      totalExports: 0, // Would need separate tracking
      scheduledExports: scheduledCount,
      lastExportAt: lastExport?.lastRunAt || null,
      popularDataTypes: [
        { dataType: 'progress', count: 0 },
        { dataType: 'quiz_results', count: 0 },
        { dataType: 'users', count: 0 },
      ],
    };
  }
}
