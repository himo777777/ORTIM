import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Req, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../types/prisma-types';
import { AnalyticsService } from './analytics.service';
import { SessionTrackingService } from './services/session-tracking.service';
import { ReportBuilderService, ReportConfiguration, SavedReportDto } from './services/report-builder.service';
import { EventTrackingService, TrackEventDto, EventType } from './services/event-tracking.service';
import { PredictionService, PredictionType } from './services/prediction.service';
import { BiExportService, ExportConfig, ExportDataType, ExportFormat } from './services/bi-export.service';
import { ABTestService, CreateTestDto, ABTestStatus, TestType, MetricType } from './services/ab-test.service';
import { Request, Response } from 'express';

// DTOs for session endpoints
class StartSessionDto {
  deviceType?: string;
  browser?: string;
}

class HeartbeatDto {
  sessionId: string;
  pageView?: boolean;
  action?: boolean;
}

class EndSessionDto {
  sessionId: string;
}

// DTOs for report endpoints
class GenerateReportDto {
  reportType: 'cohort' | 'question' | 'progress' | 'learner' | 'custom';
  title?: string;
  filters?: {
    cohortId?: string;
    courseId?: string;
    dateRange?: { start: string; end: string };
    userIds?: string[];
    minProgress?: number;
    maxProgress?: number;
    bloomLevels?: string[];
  };
  includeCharts?: boolean;
}

class SaveReportDto {
  name: string;
  description?: string;
  reportType: 'cohort' | 'question' | 'progress' | 'learner' | 'custom';
  configuration: ReportConfiguration;
  schedule?: string;
}

// DTO for BI export
class BiExportDto {
  dataType: ExportDataType;
  format: ExportFormat;
  filters?: {
    startDate?: string;
    endDate?: string;
    cohortId?: string;
    userId?: string;
    courseId?: string;
  };
  columns?: string[];
  includeHeaders?: boolean;
}

class ScheduledExportDto {
  name: string;
  config: BiExportDto;
  schedule: string;
  recipients: string[];
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
// DTOs for A/B testing
class CreateABTestDto {
  name: string;
  description?: string;
  testType: TestType;
  targetPage?: string;
  trafficPercent?: number;
  primaryMetric: MetricType;
  secondaryMetrics?: MetricType[];
  startDate?: string;
  endDate?: string;
  variants: {
    name: string;
    description?: string;
    isControl?: boolean;
    config: Record<string, unknown>;
    weight?: number;
  }[];
}

class RecordConversionDto {
  testId: string;
  metricName: string;
  metricValue: number;
  sessionId?: string;
}

class GetVariantDto {
  testId: string;
  sessionId?: string;
}

export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly sessionTrackingService: SessionTrackingService,
    private readonly reportBuilderService: ReportBuilderService,
    private readonly eventTrackingService: EventTrackingService,
    private readonly predictionService: PredictionService,
    private readonly biExportService: BiExportService,
    private readonly abTestService: ABTestService,
  ) {}

  @Get('overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get platform overview statistics' })
  async getOverview() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user engagement statistics' })
  async getUserStats() {
    return this.analyticsService.getUserEngagementStats();
  }

  @Get('courses')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get course progress statistics' })
  async getCourseStats() {
    return this.analyticsService.getCourseProgressStats();
  }

  @Get('quiz')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get quiz statistics' })
  async getQuizStats() {
    return this.analyticsService.getQuizStats();
  }

  @Get('cohorts')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get cohort analytics' })
  async getCohortAnalytics() {
    return this.analyticsService.getCohortAnalytics();
  }

  @Get('cohorts/compare')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Compare multiple cohorts' })
  @ApiQuery({ name: 'ids', required: true, type: String, description: 'Comma-separated cohort IDs' })
  async compareCohorts(@Query('ids') ids: string) {
    const cohortIds = ids.split(',').map((id) => id.trim()).filter(Boolean);
    if (cohortIds.length < 2) {
      throw new Error('Minst två kohorter krävs för jämförelse');
    }
    return this.analyticsService.compareCohorts(cohortIds);
  }

  @Get('cohorts/:id/benchmark')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Benchmark a cohort against platform average' })
  @ApiParam({ name: 'id', description: 'Cohort ID' })
  async benchmarkCohort(@Param('id') id: string) {
    return this.analyticsService.benchmarkCohort(id);
  }

  @Get('activity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get daily activity for charts' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  async getDailyActivity(@Query('days') days?: number) {
    return this.analyticsService.getDailyActivity(days || 30);
  }

  @Get('questions')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get question performance analytics' })
  async getQuestionAnalytics() {
    return this.analyticsService.getQuestionAnalytics();
  }

  @Get('certificates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get certificate analytics' })
  async getCertificateAnalytics() {
    return this.analyticsService.getCertificateAnalytics();
  }

  // ============================================
  // SESSION TRACKING ENDPOINTS (Fas 11)
  // ============================================

  @Post('session/start')
  @ApiOperation({ summary: 'Start a new user session' })
  async startSession(
    @CurrentUser() user: { id: string },
    @Body() dto: StartSessionDto,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    return this.sessionTrackingService.startSession(
      user.id,
      dto.deviceType || this.detectDeviceType(userAgent),
      dto.browser || this.detectBrowser(userAgent),
    );
  }

  @Post('session/heartbeat')
  @ApiOperation({ summary: 'Send session heartbeat' })
  async heartbeat(@Body() dto: HeartbeatDto) {
    return this.sessionTrackingService.heartbeat(
      dto.sessionId,
      dto.pageView || false,
      dto.action || false,
    );
  }

  @Post('session/end')
  @ApiOperation({ summary: 'End a user session' })
  async endSession(@Body() dto: EndSessionDto) {
    return this.sessionTrackingService.endSession(dto.sessionId);
  }

  @Get('session/active')
  @ApiOperation({ summary: 'Get active session for current user' })
  async getActiveSession(@CurrentUser() user: { id: string }) {
    return this.sessionTrackingService.getActiveSession(user.id);
  }

  @Get('session/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  async getSessionStats(@Query('days') days?: number) {
    return this.sessionTrackingService.getSessionStats(days || 30);
  }

  @Get('session/history')
  @ApiOperation({ summary: 'Get session history for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of sessions (default: 20)' })
  async getSessionHistory(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: number,
  ) {
    return this.sessionTrackingService.getUserSessions(user.id, limit || 20);
  }

  @Get('session/active-users')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get count of currently active users' })
  async getActiveUsersCount() {
    return { count: await this.sessionTrackingService.getActiveUsersCount() };
  }

  // ============================================
  // REPORT BUILDER ENDPOINTS (Fas 11)
  // ============================================

  @Post('reports/generate')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Generate a report based on configuration' })
  @ApiBody({ type: GenerateReportDto })
  async generateReport(@Body() dto: GenerateReportDto) {
    const config: ReportConfiguration = {
      reportType: dto.reportType,
      title: dto.title || `${dto.reportType} Rapport`,
      filters: dto.filters ? {
        ...dto.filters,
        dateRange: dto.filters.dateRange ? {
          start: new Date(dto.filters.dateRange.start),
          end: new Date(dto.filters.dateRange.end),
        } : undefined,
      } : {},
      columns: [],
      includeCharts: dto.includeCharts ?? true,
    };
    return this.reportBuilderService.generateReport(config);
  }

  @Get('reports/saved')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get saved reports for user' })
  async getSavedReports(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.reportBuilderService.getSavedReports(user.id, user.role);
  }

  @Post('reports/saved')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Save a report configuration' })
  @ApiBody({ type: SaveReportDto })
  async saveReport(
    @CurrentUser() user: { id: string },
    @Body() dto: SaveReportDto,
  ) {
    return this.reportBuilderService.saveReport(user.id, dto);
  }

  @Get('reports/saved/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get a specific saved report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async getSavedReport(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reportBuilderService.getSavedReport(id, user.id, user.role);
  }

  @Post('reports/saved/:id/run')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Run a saved report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async runSavedReport(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reportBuilderService.runSavedReport(id, user.id, user.role);
  }

  @Put('reports/saved/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a saved report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async updateSavedReport(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: Partial<SaveReportDto>,
  ) {
    return this.reportBuilderService.updateSavedReport(id, user.id, user.role, dto);
  }

  @Delete('reports/saved/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a saved report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async deleteSavedReport(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reportBuilderService.deleteSavedReport(id, user.id, user.role);
  }

  @Post('reports/export/csv')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Export a report to CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="report.csv"')
  async exportToCSV(
    @Body() dto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const config: ReportConfiguration = {
      reportType: dto.reportType,
      title: dto.title || `${dto.reportType} Rapport`,
      filters: dto.filters ? {
        ...dto.filters,
        dateRange: dto.filters.dateRange ? {
          start: new Date(dto.filters.dateRange.start),
          end: new Date(dto.filters.dateRange.end),
        } : undefined,
      } : {},
      columns: [],
      includeCharts: false,
    };
    const result = await this.reportBuilderService.generateReport(config);
    const csv = this.reportBuilderService.exportToCSV(result);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.reportType}-rapport-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Post('reports/export/json')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Export a report to JSON' })
  @Header('Content-Type', 'application/json')
  async exportToJSON(
    @Body() dto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const config: ReportConfiguration = {
      reportType: dto.reportType,
      title: dto.title || `${dto.reportType} Rapport`,
      filters: dto.filters ? {
        ...dto.filters,
        dateRange: dto.filters.dateRange ? {
          start: new Date(dto.filters.dateRange.start),
          end: new Date(dto.filters.dateRange.end),
        } : undefined,
      } : {},
      columns: [],
      includeCharts: dto.includeCharts ?? true,
    };
    const result = await this.reportBuilderService.generateReport(config);
    const json = this.reportBuilderService.exportToJSON(result);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.reportType}-rapport-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(json);
  }

  // ============================================
  // EVENT TRACKING ENDPOINTS (Fas 11)
  // ============================================

  @Post('events/track')
  @ApiOperation({ summary: 'Track a single event' })
  async trackEvent(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: TrackEventDto,
  ) {
    return this.eventTrackingService.trackEvent(user?.id || null, dto);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Track multiple events in batch' })
  async trackEventsBatch(
    @CurrentUser() user: { id: string } | null,
    @Body() events: TrackEventDto[],
  ) {
    return this.eventTrackingService.trackEvents(user?.id || null, events);
  }

  @Get('events')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get events with filters' })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'eventName', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getEvents(
    @Query('eventType') eventType?: EventType,
    @Query('eventName') eventName?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.eventTrackingService.getEvents(
      { eventType, eventName, userId },
      limit || 100,
      offset || 0,
    );
  }

  @Get('events/aggregations')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get event aggregations' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getEventAggregations(@Query('days') days?: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days || 30));
    return this.eventTrackingService.getEventAggregations({ startDate });
  }

  @Get('events/timeline')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get event timeline' })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'granularity', required: false, enum: ['hour', 'day'] })
  async getEventTimeline(
    @Query('eventType') eventType?: EventType,
    @Query('days') days?: number,
    @Query('granularity') granularity?: 'hour' | 'day',
  ) {
    return this.eventTrackingService.getEventTimeline(
      eventType || null,
      days || 30,
      granularity || 'day',
    );
  }

  @Get('events/popular-pages')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get popular pages' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularPages(
    @Query('days') days?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventTrackingService.getPopularPages(days || 30, limit || 20);
  }

  @Get('events/search-analytics')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get search term analytics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getSearchAnalytics(@Query('days') days?: number) {
    return this.eventTrackingService.getSearchAnalytics(days || 30);
  }

  @Get('events/user-journey/:userId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get user journey events' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  async getUserJourney(
    @Param('userId') userId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.eventTrackingService.getUserJourney(userId, sessionId);
  }

  // ============================================
  // PREDICTION ENDPOINTS (Fas 11)
  // ============================================

  @Get('predictions/at-risk')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get at-risk learners' })
  @ApiQuery({ name: 'minRiskScore', required: false, type: Number })
  async getAtRiskLearners(@Query('minRiskScore') minRiskScore?: number) {
    return this.predictionService.getAtRiskLearners(minRiskScore || 40);
  }

  @Get('predictions/dropout-risk/:userId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Calculate dropout risk for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async calculateDropoutRisk(@Param('userId') userId: string) {
    return this.predictionService.calculateDropoutRisk(userId);
  }

  @Get('predictions/exam-score/:userId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Predict exam score for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async predictExamScore(@Param('userId') userId: string) {
    return this.predictionService.predictExamScore(userId);
  }

  @Get('predictions/history/:userId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get prediction history for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'type', required: false, enum: ['dropout_risk', 'exam_score', 'completion_date'] })
  async getPredictionHistory(
    @Param('userId') userId: string,
    @Query('type') type?: PredictionType,
  ) {
    return this.predictionService.getPredictionHistory(userId, type);
  }

  // ============================================
  // BI EXPORT ENDPOINTS (Fas 12)
  // ============================================

  @Post('export/generate')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Generate a data export' })
  @ApiBody({ type: BiExportDto })
  async generateExport(
    @Body() dto: BiExportDto,
    @Res() res: Response,
  ) {
    const config: ExportConfig = {
      dataType: dto.dataType,
      format: dto.format,
      filters: dto.filters ? {
        startDate: dto.filters.startDate ? new Date(dto.filters.startDate) : undefined,
        endDate: dto.filters.endDate ? new Date(dto.filters.endDate) : undefined,
        cohortId: dto.filters.cohortId,
        userId: dto.filters.userId,
        courseId: dto.filters.courseId,
      } : undefined,
      columns: dto.columns,
      includeHeaders: dto.includeHeaders ?? true,
    };

    const result = await this.biExportService.generateExport(config);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('export/columns/:dataType')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get available columns for a data type' })
  @ApiParam({ name: 'dataType', description: 'Data type to get columns for' })
  async getAvailableColumns(@Param('dataType') dataType: ExportDataType) {
    return {
      dataType,
      columns: this.biExportService.getAvailableColumns(dataType),
    };
  }

  @Get('export/data-types')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get available export data types' })
  async getDataTypes() {
    return {
      dataTypes: [
        { id: 'users', label: 'Användare', description: 'Användardata med XP, nivå, kohorter' },
        { id: 'progress', label: 'Framsteg', description: 'Kapitelframsteg per användare' },
        { id: 'quiz_results', label: 'Quiz-resultat', description: 'Quiz-försök och poäng' },
        { id: 'sessions', label: 'Sessioner', description: 'Inloggningssessioner och aktivitet' },
        { id: 'events', label: 'Händelser', description: 'Detaljerade användarhändelser' },
        { id: 'cohorts', label: 'Kohorter', description: 'Kohortinformation och medlemsantal' },
        { id: 'certificates', label: 'Certifikat', description: 'Utfärdade certifikat' },
        { id: 'predictions', label: 'Prediktioner', description: 'AI-prediktioner och riskbedömningar' },
      ],
      formats: [
        { id: 'csv', label: 'CSV', description: 'Kommaseparerad (Excel-kompatibel)' },
        { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
        { id: 'xlsx', label: 'TSV', description: 'Tabbseparerad (Excel)' },
      ],
    };
  }

  @Post('export/scheduled')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a scheduled export' })
  @ApiBody({ type: ScheduledExportDto })
  async createScheduledExport(
    @CurrentUser() user: { id: string },
    @Body() dto: ScheduledExportDto,
  ) {
    const exportConfig: ExportConfig = {
      dataType: dto.config.dataType,
      format: dto.config.format,
      filters: dto.config.filters ? {
        startDate: dto.config.filters.startDate ? new Date(dto.config.filters.startDate) : undefined,
        endDate: dto.config.filters.endDate ? new Date(dto.config.filters.endDate) : undefined,
        cohortId: dto.config.filters.cohortId,
        userId: dto.config.filters.userId,
        courseId: dto.config.filters.courseId,
      } : undefined,
      columns: dto.config.columns,
      includeHeaders: dto.config.includeHeaders ?? true,
    };

    return this.biExportService.saveScheduledExport(
      user.id,
      dto.name,
      exportConfig,
      dto.schedule,
      dto.recipients,
    );
  }

  @Get('export/scheduled')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get scheduled exports for current user' })
  async getScheduledExports(@CurrentUser() user: { id: string }) {
    return this.biExportService.getScheduledExports(user.id);
  }

  @Delete('export/scheduled/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a scheduled export' })
  @ApiParam({ name: 'id', description: 'Scheduled export ID' })
  async deleteScheduledExport(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.biExportService.deleteScheduledExport(id, user.id);
    return { success: true };
  }

  @Get('export/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get export statistics' })
  async getExportStats() {
    return this.biExportService.getExportStats();
  }

  // ============================================
  // A/B TEST ENDPOINTS (Fas 13)
  // ============================================

  @Get('ab-tests/summary')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get A/B test summary for dashboard' })
  async getABTestSummary() {
    return this.abTestService.getTestSummary();
  }

  @Get('ab-tests')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all A/B tests' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'] })
  @ApiQuery({ name: 'testType', required: false, enum: ['content', 'ui', 'quiz', 'algorithm'] })
  async getABTests(
    @Query('status') status?: ABTestStatus,
    @Query('testType') testType?: TestType,
  ) {
    return this.abTestService.getTests(status, testType);
  }

  @Post('ab-tests')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new A/B test' })
  @ApiBody({ type: CreateABTestDto })
  async createABTest(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateABTestDto,
  ) {
    const createDto: CreateTestDto = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    return this.abTestService.createTest(createDto, user.id);
  }

  @Get('ab-tests/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get a specific A/B test' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  async getABTest(@Param('id') id: string) {
    return this.abTestService.getTest(id);
  }

  @Get('ab-tests/:id/results')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get A/B test results with statistical analysis' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  async getABTestResults(@Param('id') id: string) {
    return this.abTestService.getTestResults(id);
  }

  @Put('ab-tests/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update A/B test status' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiBody({ schema: { properties: { status: { enum: ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'] } } } })
  async updateABTestStatus(
    @Param('id') id: string,
    @Body('status') status: ABTestStatus,
  ) {
    return this.abTestService.updateTestStatus(id, status);
  }

  @Delete('ab-tests/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an A/B test' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  async deleteABTest(@Param('id') id: string) {
    await this.abTestService.deleteTest(id);
    return { success: true };
  }

  @Post('ab-tests/variant')
  @ApiOperation({ summary: 'Get variant assignment for current user' })
  @ApiBody({ type: GetVariantDto })
  async getVariantAssignment(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: GetVariantDto,
  ) {
    return this.abTestService.getVariantAssignment(
      dto.testId,
      user?.id,
      dto.sessionId,
    );
  }

  @Get('ab-tests/page/:targetPage')
  @ApiOperation({ summary: 'Get active tests for a specific page' })
  @ApiParam({ name: 'targetPage', description: 'Target page identifier' })
  async getActiveTestsForPage(@Param('targetPage') targetPage: string) {
    return this.abTestService.getActiveTestsForPage(targetPage);
  }

  @Post('ab-tests/conversion')
  @ApiOperation({ summary: 'Record a conversion for an A/B test' })
  @ApiBody({ type: RecordConversionDto })
  async recordConversion(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: RecordConversionDto,
  ) {
    return this.abTestService.recordConversion(
      dto.testId,
      dto.metricName,
      dto.metricValue,
      user?.id,
      dto.sessionId,
    );
  }

  @Get('ab-tests/user/assignments')
  @ApiOperation({ summary: 'Get all active test assignments for current user' })
  async getUserAssignments(@CurrentUser() user: { id: string }) {
    return this.abTestService.getUserAssignments(user.id);
  }

  // Helper methods
  private detectDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    return 'Other';
  }
}
