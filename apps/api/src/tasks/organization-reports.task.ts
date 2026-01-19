import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../common/audit/audit.service';

@Injectable()
export class OrganizationReportsTask {
  private readonly logger = new Logger(OrganizationReportsTask.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  /**
   * Run every Monday at 07:00 for WEEKLY reports
   */
  @Cron('0 7 * * 1')
  async sendWeeklyReports() {
    await this.processReports('WEEKLY');
  }

  /**
   * Run on 1st and 15th of each month at 07:00 for BIWEEKLY reports
   */
  @Cron('0 7 1,15 * *')
  async sendBiweeklyReports() {
    await this.processReports('BIWEEKLY');
  }

  /**
   * Run on 1st of each month at 07:00 for MONTHLY reports
   */
  @Cron('0 7 1 * *')
  async sendMonthlyReports() {
    await this.processReports('MONTHLY');
  }

  /**
   * Process and send reports for organizations with the given frequency
   */
  private async processReports(frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY') {
    this.logger.log(`Starting ${frequency} organization reports...`);

    const organizations = await this.prisma.organization.findMany({
      where: {
        isActive: true,
        reportEnabled: true,
        reportFrequency: frequency,
      },
      include: {
        reportRecipients: {
          where: { isActive: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                certificates: {
                  orderBy: { issuedAt: 'desc' },
                  take: 1,
                },
                chapterProgress: {
                  select: {
                    readProgress: true,
                    completedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let reportsSent = 0;

    for (const org of organizations) {
      if (org.reportRecipients.length === 0) {
        this.logger.warn(`Organization ${org.name} has no active report recipients`);
        continue;
      }

      try {
        const reportData = this.generateReportData(org);
        const reportHtml = this.generateReportHtml(org.name, reportData);

        // Send to all recipients
        for (const recipient of org.reportRecipients) {
          await this.emailService.send({
            to: recipient.email,
            subject: `Utbildningsrapport - ${org.name} - ${this.getReportPeriodLabel(frequency)}`,
            html: reportHtml,
          });
        }

        // Update last report sent timestamp and calculate next due date
        await this.prisma.organization.update({
          where: { id: org.id },
          data: {
            lastReportSentAt: new Date(),
            nextReportDueAt: this.calculateNextReportDate(frequency),
          },
        });

        // Audit log
        await this.auditService.log({
          userId: null,
          action: 'EXPORT',
          entityType: 'OrganizationReport',
          entityId: org.id,
          details: {
            frequency,
            recipientCount: org.reportRecipients.length,
            employeeCount: org.members.length,
          },
        });

        reportsSent++;
        this.logger.log(`Sent report for organization: ${org.name}`);
      } catch (error) {
        this.logger.error(`Failed to send report for ${org.name}: ${error.message}`);
      }
    }

    this.logger.log(`${frequency} reports complete. Sent ${reportsSent} reports.`);
  }

  /**
   * Generate report data for an organization
   */
  private generateReportData(org: any): OrganizationReportData {
    const employees = org.members.map((m: any) => ({
      name: `${m.user.firstName} ${m.user.lastName}`,
      department: m.department || '-',
      hasCertificate: m.user.certificates.length > 0,
      certificateValid: m.user.certificates.length > 0 &&
        new Date(m.user.certificates[0].validUntil) > new Date(),
      certificateExpiry: m.user.certificates[0]?.validUntil || null,
      progress: this.calculateAverageProgress(m.user.chapterProgress),
      chaptersCompleted: m.user.chapterProgress.filter((p: any) => p.completedAt).length,
    }));

    const totalEmployees = employees.length;
    const withCertificate = employees.filter((e: any) => e.hasCertificate).length;
    const withValidCertificate = employees.filter((e: any) => e.certificateValid).length;
    const expiringIn30Days = employees.filter((e: any) => {
      if (!e.certificateExpiry) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(e.certificateExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    const averageProgress = totalEmployees > 0
      ? Math.round(
          employees.reduce((sum: number, e: any) => sum + e.progress, 0) / totalEmployees,
        )
      : 0;

    return {
      totalEmployees,
      withCertificate,
      withValidCertificate,
      certificationRate: totalEmployees > 0
        ? Math.round((withValidCertificate / totalEmployees) * 100)
        : 0,
      expiringIn30Days,
      averageProgress,
      employees: employees.sort((a: any, b: any) => a.name.localeCompare(b.name, 'sv')),
    };
  }

  /**
   * Calculate average progress for a user
   */
  private calculateAverageProgress(progress: { readProgress: number }[]): number {
    if (progress.length === 0) return 0;
    const total = progress.reduce((sum, p) => sum + p.readProgress, 0);
    return Math.round(total / progress.length);
  }

  /**
   * Generate HTML report
   */
  private generateReportHtml(orgName: string, data: OrganizationReportData): string {
    const employeeRows = data.employees
      .map(
        (e: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${e.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${e.department}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            ${e.certificateValid ? '✓' : e.hasCertificate ? '⚠️ Utgånget' : '-'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            ${e.certificateExpiry ? new Date(e.certificateExpiry).toLocaleDateString('sv-SE') : '-'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            ${e.progress}%
          </td>
        </tr>
      `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; }
    .header { background: #1a5276; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1a5276; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    .alert-card { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .alert-card.danger { background: #f8d7da; border-color: #dc3545; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Utbildningsrapport</h1>
      <p>${orgName} - ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}</p>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.totalEmployees}</div>
          <div class="stat-label">Anställda</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.certificationRate}%</div>
          <div class="stat-label">Certifieringsgrad</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.averageProgress}%</div>
          <div class="stat-label">Genomsnittlig progress</div>
        </div>
      </div>

      ${data.expiringIn30Days > 0 ? `
      <div class="alert-card danger">
        <strong>⚠️ Observera:</strong> ${data.expiringIn30Days} certifikat går ut inom 30 dagar.
      </div>
      ` : ''}

      <h2 style="color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 10px;">
        Anställda (${data.totalEmployees})
      </h2>
      <table>
        <thead>
          <tr>
            <th>Namn</th>
            <th>Avdelning</th>
            <th style="text-align: center;">Certifikat</th>
            <th style="text-align: center;">Giltig till</th>
            <th style="text-align: center;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>

      <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1a5276;">Sammanfattning</h3>
        <ul>
          <li><strong>${data.withValidCertificate}</strong> av ${data.totalEmployees} anställda har giltigt certifikat</li>
          <li><strong>${data.withCertificate - data.withValidCertificate}</strong> har utgånget certifikat</li>
          <li><strong>${data.totalEmployees - data.withCertificate}</strong> saknar certifikat</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>ORTAC - Orthopaedic Resuscitation and Trauma Acute Care</p>
      <p>Denna rapport genererades automatiskt. Logga in på portalen för mer detaljerad information.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get human-readable period label
   */
  private getReportPeriodLabel(frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'): string {
    const now = new Date();
    switch (frequency) {
      case 'WEEKLY':
        return `Vecka ${this.getWeekNumber(now)}`;
      case 'BIWEEKLY':
        return now.getDate() <= 15
          ? `1-15 ${now.toLocaleDateString('sv-SE', { month: 'long' })}`
          : `16-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} ${now.toLocaleDateString('sv-SE', { month: 'long' })}`;
      case 'MONTHLY':
        return now.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Calculate next report due date
   */
  private calculateNextReportDate(frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'WEEKLY':
        next.setDate(now.getDate() + (8 - now.getDay())); // Next Monday
        break;
      case 'BIWEEKLY':
        if (now.getDate() < 15) {
          next.setDate(15);
        } else {
          next.setMonth(now.getMonth() + 1);
          next.setDate(1);
        }
        break;
      case 'MONTHLY':
        next.setMonth(now.getMonth() + 1);
        next.setDate(1);
        break;
    }

    next.setHours(7, 0, 0, 0);
    return next;
  }

  /**
   * Manual trigger for testing
   */
  async runManualReport(organizationId: string): Promise<{ success: boolean; message: string }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        reportRecipients: { where: { isActive: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                certificates: { orderBy: { issuedAt: 'desc' }, take: 1 },
                chapterProgress: { select: { readProgress: true, completedAt: true } },
              },
            },
          },
        },
      },
    });

    if (!org) {
      return { success: false, message: 'Organization not found' };
    }

    if (org.reportRecipients.length === 0) {
      return { success: false, message: 'No active report recipients' };
    }

    const reportData = this.generateReportData(org);
    const reportHtml = this.generateReportHtml(org.name, reportData);

    for (const recipient of org.reportRecipients) {
      await this.emailService.send({
        to: recipient.email,
        subject: `Utbildningsrapport - ${org.name} - Manuell rapport`,
        html: reportHtml,
      });
    }

    return {
      success: true,
      message: `Report sent to ${org.reportRecipients.length} recipient(s)`
    };
  }
}

interface OrganizationReportData {
  totalEmployees: number;
  withCertificate: number;
  withValidCertificate: number;
  certificationRate: number;
  expiringIn30Days: number;
  averageProgress: number;
  employees: any[];
}
