import { Controller, Get, Post, Param, UseGuards, NotFoundException, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../types/prisma-types';

@ApiTags('Certificates')
@Controller()
export class CertificatesController {
  constructor(
    private certificatesService: CertificatesService,
    private pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user certificates' })
  async findByUser(@CurrentUser() user: User) {
    return this.certificatesService.findByUser(user.id);
  }

  @Get('certificates/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate by ID' })
  async findById(@Param('id') id: string) {
    const certificate = await this.certificatesService.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certifikatet hittades inte');
    }
    return certificate;
  }

  @Get('certificates/:id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download certificate as PDF' })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // First verify the certificate exists
    const certificate = await this.certificatesService.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certifikatet hittades inte');
    }

    // Generate PDF
    const pdfBuffer = await this.pdfGeneratorService.generateCertificatePdf(id);

    // Generate filename
    const filename = this.pdfGeneratorService.generateFilename(
      certificate.certificateNumber,
      certificate.courseName,
    );

    // Set headers and send response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify certificate (public)' })
  async verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }

  @Post('certificates/check/:courseCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check eligibility and generate certificate if eligible' })
  async checkAndGenerate(
    @CurrentUser() user: User,
    @Param('courseCode') courseCode: string,
  ) {
    return this.certificatesService.checkAndGenerateCertificate(user.id, courseCode);
  }

  @Get('certificates/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate expiration status' })
  async getExpirationStatus(@Param('id') id: string) {
    return this.certificatesService.getExpirationStatus(id);
  }

  @Post('certificates/:id/recertify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recertify an expiring or expired certificate' })
  async recertify(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.certificatesService.recertify(id, user.id);
  }
}
