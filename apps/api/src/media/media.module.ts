import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { R2Service } from './r2.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MediaController],
  providers: [MediaService, R2Service],
  exports: [MediaService, R2Service],
})
export class MediaModule {}
