import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExpirationCheckerTask } from './expiration-checker.task';
import { OrganizationReportsTask } from './organization-reports.task';
import { CertificatesModule } from '../certificates/certificates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CertificatesModule,
    NotificationsModule,
    EmailModule,
    AuditModule,
  ],
  providers: [ExpirationCheckerTask, OrganizationReportsTask],
  exports: [OrganizationReportsTask],
})
export class TasksModule {}
