import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../types/prisma-types';
import { ReportsService } from './reports.service';
import { PrismaService } from '../common/prisma/prisma.service';

interface AuthRequest {
  user: { userId: string; role: UserRole };
}

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('certificate/:id/pdf')
  @ApiOperation({ summary: 'Download certificate as PDF' })
  @ApiProduces('application/pdf')
  async downloadCertificatePdf(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    // Verify ownership or admin
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      throw new ForbiddenException('Certifikat hittades inte');
    }

    if (
      certificate.userId !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Ingen behörighet');
    }

    const pdf = await this.reportsService.generateCertificatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certifikat-${certificate.certificateNumber}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get('cohort/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Download cohort progress report as PDF (Instructor/Admin)' })
  @ApiProduces('application/pdf')
  async downloadCohortProgressReport(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    // Verify instructor owns this cohort or is admin
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
    });

    if (!cohort) {
      throw new ForbiddenException('Kohort hittades inte');
    }

    if (
      cohort.instructorId !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Ingen behörighet');
    }

    const pdf = await this.reportsService.generateCohortProgressReport(id);

    const filename = `progress-${cohort.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get('participant/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Download participant progress report as PDF (Instructor/Admin)' })
  @ApiProduces('application/pdf')
  async downloadParticipantProgressReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { firstName: true, lastName: true },
    });

    if (!user) {
      throw new ForbiddenException('Användare hittades inte');
    }

    const pdf = await this.reportsService.generateParticipantProgressReport(id);

    const filename = `progress-${user.firstName}-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }

  @Get('my/progress')
  @ApiOperation({ summary: 'Download your own progress report as PDF' })
  @ApiProduces('application/pdf')
  async downloadMyProgressReport(@Req() req: AuthRequest, @Res() res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) {
      throw new ForbiddenException('Användare hittades inte');
    }

    const pdf = await this.reportsService.generateParticipantProgressReport(
      req.user.userId,
    );

    const filename = `min-progress-${new Date().toISOString().split('T')[0]}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  }
}
