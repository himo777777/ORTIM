import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  controllers: [CertificatesController],
  providers: [CertificatesService, PdfGeneratorService],
  exports: [CertificatesService, PdfGeneratorService],
})
export class CertificatesModule {}
