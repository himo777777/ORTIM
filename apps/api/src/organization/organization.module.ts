import { Module } from '@nestjs/common';
import {
  OrganizationController,
  OrganizationPortalController,
} from './organization.controller';
import { OrganizationService } from './organization.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OrganizationController, OrganizationPortalController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
