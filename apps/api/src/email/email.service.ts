import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.fromAddress = this.configService.get('SMTP_FROM') || 'noreply@ortac.se';
    this.appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

    // Configure transporter
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    if (smtpHost && smtpPort) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      });
      this.logger.log(`Email configured: ${smtpHost}:${smtpPort}`);
    } else {
      // Use ethereal for development/testing
      this.logger.warn('SMTP not configured - emails will be logged only');
    }
  }

  // Send email
  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.log(`[DEV] Email would be sent to: ${options.to}`);
        this.logger.log(`[DEV] Subject: ${options.subject}`);
        return true;
      }

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent to: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // === Password Reset ===

  async sendPasswordResetEmail(userId: string, email: string): Promise<boolean> {
    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    return this.send({
      to: email,
      subject: 'Återställ ditt lösenord - ORTAC',
      html: this.getPasswordResetTemplate(resetUrl),
      text: `Klicka på länken för att återställa ditt lösenord: ${resetUrl}`,
    });
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      return null;
    }

    return resetToken.userId;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  // === Welcome Email ===

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    courseName?: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Välkommen till ORTAC!',
      html: this.getWelcomeTemplate(firstName, courseName),
    });
  }

  // === Certificate Email ===

  async sendCertificateEmail(
    email: string,
    firstName: string,
    courseName: string,
    certificateNumber: string,
    verificationUrl: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Certifikat utfärdat - ${courseName}`,
      html: this.getCertificateTemplate(firstName, courseName, certificateNumber, verificationUrl),
    });
  }

  // === Course Enrollment Email ===

  async sendEnrollmentEmail(
    email: string,
    firstName: string,
    courseName: string,
    cohortName: string,
    startDate: Date,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Inskriven i ${courseName} - ORTAC`,
      html: this.getEnrollmentTemplate(firstName, courseName, cohortName, startDate),
    });
  }

  // === OSCE Reminder Email ===

  async sendOsceReminderEmail(
    email: string,
    firstName: string,
    date: Date,
    location?: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Påminnelse: OSCE-examination - ORTAC',
      html: this.getOsceReminderTemplate(firstName, date, location),
    });
  }

  // === Email Templates ===

  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1a5276; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 30px; background: #1a5276; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background: #154360; }
    .info-box { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .highlight { color: #1a5276; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ORTAC</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>ORTAC - Orthopaedic Resuscitation and Trauma Acute Care</p>
      <p>Detta är ett automatiskt meddelande. Vänligen svara inte på detta mail.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return this.getBaseTemplate(`
      <h2>Återställ ditt lösenord</h2>
      <p>Du har begärt att återställa ditt lösenord för ORTAC.</p>
      <p>Klicka på knappen nedan för att välja ett nytt lösenord:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Återställ lösenord</a>
      </p>
      <p>Länken är giltig i 1 timme.</p>
      <p>Om du inte har begärt att återställa ditt lösenord kan du ignorera detta mail.</p>
      <div class="info-box">
        <p><small>Om knappen inte fungerar, kopiera denna länk till din webbläsare:<br>
        <a href="${resetUrl}">${resetUrl}</a></small></p>
      </div>
    `);
  }

  private getWelcomeTemplate(firstName: string, courseName?: string): string {
    return this.getBaseTemplate(`
      <h2>Välkommen ${firstName}!</h2>
      <p>Ditt konto på ORTAC har skapats.</p>
      ${courseName ? `<p>Du har blivit inskriven i kursen <span class="highlight">${courseName}</span>.</p>` : ''}
      <p>Med ORTAC får du tillgång till:</p>
      <ul>
        <li>Interaktiva utbildningsmaterial</li>
        <li>Quiz och kunskapstester</li>
        <li>Kliniska algoritmer</li>
        <li>OSCE-förberedelser</li>
        <li>Certifiering</li>
      </ul>
      <p style="text-align: center;">
        <a href="${this.appUrl}" class="button">Kom igång</a>
      </p>
    `);
  }

  private getCertificateTemplate(
    firstName: string,
    courseName: string,
    certificateNumber: string,
    verificationUrl: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Grattis ${firstName}!</h2>
      <p>Du har slutfört kursen <span class="highlight">${courseName}</span> och ditt certifikat har utfärdats.</p>
      <div class="info-box">
        <p><strong>Certifikatnummer:</strong> ${certificateNumber}</p>
        <p><strong>Verifierings-URL:</strong> <a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
      <p style="text-align: center;">
        <a href="${this.appUrl}/certificates" class="button">Visa certifikat</a>
      </p>
      <p>Du kan ladda ner ditt certifikat som PDF från din profil.</p>
    `);
  }

  private getEnrollmentTemplate(
    firstName: string,
    courseName: string,
    cohortName: string,
    startDate: Date,
  ): string {
    const dateStr = startDate.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.getBaseTemplate(`
      <h2>Välkommen till kursen ${firstName}!</h2>
      <p>Du har blivit inskriven i:</p>
      <div class="info-box">
        <p><strong>Kurs:</strong> ${courseName}</p>
        <p><strong>Kursomgång:</strong> ${cohortName}</p>
        <p><strong>Startdatum:</strong> ${dateStr}</p>
      </div>
      <p style="text-align: center;">
        <a href="${this.appUrl}/course" class="button">Gå till kursen</a>
      </p>
      <p>Lycka till med dina studier!</p>
    `);
  }

  private getOsceReminderTemplate(
    firstName: string,
    date: Date,
    location?: string,
  ): string {
    const dateStr = date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.getBaseTemplate(`
      <h2>Påminnelse: OSCE-examination</h2>
      <p>Hej ${firstName},</p>
      <p>Detta är en påminnelse om din kommande OSCE-examination.</p>
      <div class="info-box">
        <p><strong>Datum:</strong> ${dateStr}</p>
        <p><strong>Tid:</strong> ${timeStr}</p>
        ${location ? `<p><strong>Plats:</strong> ${location}</p>` : ''}
      </div>
      <h3>Förbered dig</h3>
      <ul>
        <li>Repetera de kliniska algoritmerna</li>
        <li>Gå igenom OSCE-stationerna</li>
        <li>Ta med legitimation</li>
      </ul>
      <p style="text-align: center;">
        <a href="${this.appUrl}/algorithms" class="button">Öppna algoritmer</a>
      </p>
      <p>Lycka till!</p>
    `);
  }
}
