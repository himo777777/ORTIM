import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SessionTrackingService } from './services/session-tracking.service';
import { ReportBuilderService } from './services/report-builder.service';
import { EventTrackingService } from './services/event-tracking.service';
import { PredictionService } from './services/prediction.service';
import { BiExportService } from './services/bi-export.service';
import { ABTestService } from './services/ab-test.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    SessionTrackingService,
    ReportBuilderService,
    EventTrackingService,
    PredictionService,
    BiExportService,
    ABTestService,
  ],
  exports: [
    AnalyticsService,
    SessionTrackingService,
    ReportBuilderService,
    EventTrackingService,
    PredictionService,
    BiExportService,
    ABTestService,
  ],
})
export class AnalyticsModule {}
