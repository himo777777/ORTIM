import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { QuizModule } from './quiz/quiz.module';
import { CertificatesModule } from './certificates/certificates.module';
import { InstructorModule } from './instructor/instructor.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { EmailModule } from './email/email.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { SentryModule } from './common/sentry/sentry.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './common/audit/audit.module';
import { SecurityModule } from './common/security/security.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Error tracking
    SentryModule,

    // Caching
    RedisModule,

    // Audit logging
    AuditModule,

    // Security (rate limiting, account lockout)
    SecurityModule,

    // Feature modules
    AuthModule,
    CoursesModule,
    QuizModule,
    CertificatesModule,
    InstructorModule,
    AdminModule,
    NotificationsModule,
    ReportsModule,
    EmailModule,
    WebsocketModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
