import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpirationCheckerTask {
  private readonly logger = new Logger(ExpirationCheckerTask.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Run every day at 8:00 AM to check for expiring certificates
   * Sends reminders at 90, 60, and 30 days before expiration
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringCertificates() {
    this.logger.log('Starting certificate expiration check...');

    const now = new Date();
    const thresholds = [
      { days: 90, type: 'CERT_EXPIRING_90' },
      { days: 60, type: 'CERT_EXPIRING_60' },
      { days: 30, type: 'CERT_EXPIRING_30' },
    ];

    let totalNotifications = 0;

    for (const threshold of thresholds) {
      const targetDate = this.addDays(now, threshold.days);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find certificates expiring on this exact day
      const expiringCerts = await this.prisma.certificate.findMany({
        where: {
          validUntil: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      for (const cert of expiringCerts) {
        // Check if we've already sent this notification
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            userId: cert.userId,
            type: threshold.type,
            data: {
              path: ['certificateId'],
              equals: cert.id,
            },
            createdAt: {
              gte: this.addDays(now, -1), // Within last 24 hours
            },
          },
        });

        if (!existingNotification) {
          await this.sendExpirationReminder(cert, threshold.days);
          totalNotifications++;
        }
      }
    }

    this.logger.log(`Certificate expiration check complete. Sent ${totalNotifications} notifications.`);
  }

  /**
   * Send expiration reminder notification
   */
  private async sendExpirationReminder(
    certificate: {
      id: string;
      certificateNumber: string;
      courseName: string;
      validUntil: Date;
      userId: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
      };
    },
    daysUntilExpiry: number,
  ) {
    const expiryDate = certificate.validUntil.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let title: string;
    let message: string;
    let type: string;

    if (daysUntilExpiry === 90) {
      type = 'CERT_EXPIRING_90';
      title = 'Certifikat går ut om 3 månader';
      message = `Ditt certifikat "${certificate.courseName}" går ut ${expiryDate}. Planera för recertifiering.`;
    } else if (daysUntilExpiry === 60) {
      type = 'CERT_EXPIRING_60';
      title = 'Certifikat går ut om 2 månader';
      message = `Ditt certifikat "${certificate.courseName}" går ut ${expiryDate}. Det är dags att påbörja recertifieringen.`;
    } else {
      type = 'CERT_EXPIRING_30';
      title = 'Certifikat går ut om 1 månad!';
      message = `Ditt certifikat "${certificate.courseName}" går ut ${expiryDate}. Slutför recertifieringen snarast.`;
    }

    // Create in-app notification
    await this.prisma.notification.create({
      data: {
        userId: certificate.userId,
        type,
        title,
        message,
        data: {
          certificateId: certificate.id,
          certificateNumber: certificate.certificateNumber,
          courseName: certificate.courseName,
          expiryDate: certificate.validUntil.toISOString(),
          daysUntilExpiry,
        },
      },
    });

    this.logger.log(
      `Sent ${daysUntilExpiry}-day expiration reminder for certificate ${certificate.certificateNumber} to user ${certificate.user.firstName} ${certificate.user.lastName}`,
    );
  }

  /**
   * Add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Manual trigger for testing (can be called via admin endpoint)
   */
  async runManualCheck() {
    await this.checkExpiringCertificates();
    return { message: 'Certificate expiration check completed' };
  }
}
