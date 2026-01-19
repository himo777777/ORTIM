import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  // Generate certificate PDF
  async generateCertificatePdf(certificateId: string): Promise<Buffer> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            personnummer: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certifikat hittades inte');
    }

    const html = this.generateCertificateHtml(certificate);
    return this.htmlToPdf(html, { landscape: true });
  }

  // Generate progress report PDF for a cohort
  async generateCohortProgressReport(cohortId: string): Promise<Buffer> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: true,
        instructor: {
          select: { firstName: true, lastName: true },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                workplace: true,
              },
            },
            osceAssessments: true,
          },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException('Kohort hittades inte');
    }

    // Get chapter progress for all participants
    type EnrollmentType = typeof cohort.enrollments[number];
    const participantIds = cohort.enrollments.map((e: EnrollmentType) => e.user.id);
    const progressData = await this.prisma.chapterProgress.findMany({
      where: { userId: { in: participantIds } },
    });

    // Group progress by user
    type ProgressType = typeof progressData[number];
    const progressByUser: Record<string, ProgressType[]> = {};
    progressData.forEach((p: ProgressType) => {
      if (!progressByUser[p.userId]) progressByUser[p.userId] = [];
      progressByUser[p.userId].push(p);
    });

    // Build report data
    const participants = cohort.enrollments.map((enrollment: EnrollmentType) => {
      const userProgress = progressByUser[enrollment.user.id] || [];
      const completedChapters = userProgress.filter((p: ProgressType) => p.quizPassed).length;
      const totalChapters = 17;
      const osceCompleted = enrollment.osceAssessments.length;
      const oscePassed = enrollment.osceAssessments.filter((a: { passed: boolean }) => a.passed).length;

      return {
        name: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
        email: enrollment.user.email,
        workplace: enrollment.user.workplace,
        status: enrollment.status,
        chaptersCompleted: completedChapters,
        totalChapters,
        progressPercent: Math.round((completedChapters / totalChapters) * 100),
        osceCompleted,
        oscePassed,
        osceTotal: 5,
      };
    });

    const html = this.generateProgressReportHtml({
      cohort: {
        name: cohort.name,
        courseName: cohort.course.name,
        instructor: `${cohort.instructor.firstName} ${cohort.instructor.lastName}`,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
      },
      participants,
      generatedAt: new Date(),
    });

    return this.htmlToPdf(html);
  }

  // Generate individual progress report for a participant
  async generateParticipantProgressReport(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        chapterProgress: {
          include: {
            chapter: {
              include: {
                part: true,
              },
            },
          },
          orderBy: { chapter: { sortOrder: 'asc' } },
        },
        quizAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
        certificates: {
          orderBy: { issuedAt: 'desc' },
        },
        enrollments: {
          include: {
            cohort: {
              include: { course: true },
            },
            osceAssessments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Användare hittades inte');
    }

    const html = this.generateParticipantReportHtml(user);
    return this.htmlToPdf(html);
  }

  // Helper: Convert HTML to PDF using Puppeteer
  private async htmlToPdf(
    html: string,
    options: { landscape?: boolean } = {}
  ): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: options.landscape || false,
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // HTML template for certificate
  private generateCertificateHtml(certificate: {
    certificateNumber: string;
    courseName: string;
    courseCode: string;
    issuedAt: Date;
    validUntil: Date;
    examScore: number;
    lipusNumber: string | null;
    user: { firstName: string; lastName: string };
  }): string {
    const issuedDate = certificate.issuedAt.toLocaleDateString('sv-SE');
    const validUntilDate = certificate.validUntil.toLocaleDateString('sv-SE');

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Open Sans', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
      padding: 40px;
    }

    .certificate {
      background: white;
      border: 3px solid #1a5276;
      border-radius: 8px;
      padding: 60px;
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #d4af37;
      border-radius: 4px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1a5276;
      letter-spacing: 3px;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      color: #1a5276;
      margin: 20px 0 10px;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .recipient {
      text-align: center;
      margin: 40px 0;
    }

    .recipient-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #333;
      border-bottom: 2px solid #d4af37;
      display: inline-block;
      padding: 0 20px 10px;
    }

    .course-info {
      text-align: center;
      margin: 30px 0;
    }

    .course-name {
      font-size: 20px;
      font-weight: 600;
      color: #1a5276;
      margin-bottom: 5px;
    }

    .course-code {
      font-size: 14px;
      color: #666;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin: 40px 0;
      flex-wrap: wrap;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-top: 5px;
    }

    .footer {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature {
      text-align: center;
    }

    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      margin-bottom: 5px;
    }

    .signature-name {
      font-size: 12px;
      color: #666;
    }

    .cert-number {
      font-size: 11px;
      color: #999;
    }

    .lipus {
      text-align: center;
      margin-top: 20px;
      padding: 10px 20px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">ORTAC</div>
      <h1 class="title">Certifikat</h1>
      <p class="subtitle">Orthopaedic Resuscitation and Trauma Acute Care</p>
    </div>

    <div class="recipient">
      <p class="recipient-label">Härmed intygas att</p>
      <p class="recipient-name">${certificate.user.firstName} ${certificate.user.lastName}</p>
    </div>

    <div class="course-info">
      <p>har genomfört kursen</p>
      <p class="course-name">${certificate.courseName}</p>
      <p class="course-code">${certificate.courseCode}</p>
    </div>

    <div class="details">
      <div class="detail-item">
        <p class="detail-label">Utfärdad</p>
        <p class="detail-value">${issuedDate}</p>
      </div>
      <div class="detail-item">
        <p class="detail-label">Giltig till</p>
        <p class="detail-value">${validUntilDate}</p>
      </div>
      <div class="detail-item">
        <p class="detail-label">Resultat</p>
        <p class="detail-value">${Math.round(certificate.examScore)}%</p>
      </div>
    </div>

    ${certificate.lipusNumber ? `
    <div class="lipus">
      LIPUS-nummer: ${certificate.lipusNumber}
    </div>
    ` : ''}

    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signature-name">Kursansvarig</p>
      </div>
      <p class="cert-number">Certifikat: ${certificate.certificateNumber}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // HTML template for cohort progress report
  private generateProgressReportHtml(data: {
    cohort: {
      name: string;
      courseName: string;
      instructor: string;
      startDate: Date;
      endDate: Date | null;
    };
    participants: Array<{
      name: string;
      email: string | null;
      workplace: string | null;
      status: string;
      chaptersCompleted: number;
      totalChapters: number;
      progressPercent: number;
      osceCompleted: number;
      oscePassed: number;
      osceTotal: number;
    }>;
    generatedAt: Date;
  }): string {
    const startDate = data.cohort.startDate.toLocaleDateString('sv-SE');
    const endDate = data.cohort.endDate?.toLocaleDateString('sv-SE') || 'Pågående';
    const generatedAt = data.generatedAt.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const rows = data.participants
      .map(
        (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.workplace || '-'}</td>
        <td class="center">${p.status === 'active' ? 'Aktiv' : p.status}</td>
        <td class="center">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${p.progressPercent}%"></div>
          </div>
          <span class="progress-text">${p.chaptersCompleted}/${p.totalChapters} (${p.progressPercent}%)</span>
        </td>
        <td class="center">${p.oscePassed}/${p.osceTotal}</td>
      </tr>
    `
      )
      .join('');

    const completedCount = data.participants.filter(
      (p) => p.progressPercent === 100
    ).length;
    const avgProgress =
      data.participants.length > 0
        ? Math.round(
            data.participants.reduce((sum, p) => sum + p.progressPercent, 0) /
              data.participants.length
          )
        : 0;

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #1a5276;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      color: #1a5276;
    }
    .report-title {
      font-size: 18px;
      color: #333;
      margin-top: 5px;
    }
    .meta {
      text-align: right;
      font-size: 11px;
      color: #666;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
    }
    .info-item label {
      display: block;
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .info-item span {
      font-weight: 600;
      color: #333;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
    }
    .summary-card {
      flex: 1;
      background: #1a5276;
      color: white;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
    }
    .summary-card .label {
      font-size: 11px;
      opacity: 0.9;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #1a5276;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    .center {
      text-align: center;
    }
    .progress-bar {
      width: 80px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    .progress-fill {
      height: 100%;
      background: #27ae60;
      border-radius: 4px;
    }
    .progress-text {
      font-size: 11px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ORTAC</div>
      <div class="report-title">Progressrapport - ${data.cohort.name}</div>
    </div>
    <div class="meta">
      <div>Genererad: ${generatedAt}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <label>Kurs</label>
      <span>${data.cohort.courseName}</span>
    </div>
    <div class="info-item">
      <label>Instruktör</label>
      <span>${data.cohort.instructor}</span>
    </div>
    <div class="info-item">
      <label>Startdatum</label>
      <span>${startDate}</span>
    </div>
    <div class="info-item">
      <label>Slutdatum</label>
      <span>${endDate}</span>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="value">${data.participants.length}</div>
      <div class="label">Deltagare</div>
    </div>
    <div class="summary-card">
      <div class="value">${avgProgress}%</div>
      <div class="label">Genomsnittlig progress</div>
    </div>
    <div class="summary-card">
      <div class="value">${completedCount}</div>
      <div class="label">Färdiga med teori</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Deltagare</th>
        <th>Arbetsplats</th>
        <th class="center">Status</th>
        <th class="center">Kursprogress</th>
        <th class="center">OSCE</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    ORTAC - Orthopaedic Resuscitation and Trauma Acute Care
  </div>
</body>
</html>
    `;
  }

  // HTML template for individual participant report
  private generateParticipantReportHtml(user: {
    firstName: string;
    lastName: string;
    email: string | null;
    workplace: string | null;
    chapterProgress: Array<{
      chapter: {
        title: string;
        chapterNumber: number;
        part: { title: string; partNumber: number };
      };
      quizPassed: boolean;
      bestQuizScore: number | null;
      completedAt: Date | null;
    }>;
    quizAttempts: Array<{
      type: string;
      score: number;
      passed: boolean | null;
      completedAt: Date | null;
    }>;
    certificates: Array<{
      courseName: string;
      issuedAt: Date;
      certificateNumber: string;
    }>;
    enrollments: Array<{
      cohort: { name: string; course: { name: string } };
      osceAssessments: Array<{ stationName: string; passed: boolean; score: number | null }>;
    }>;
  }): string {
    const generatedAt = new Date().toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const completedChapters = user.chapterProgress.filter((p) => p.quizPassed).length;
    const totalChapters = 17;
    const progressPercent = Math.round((completedChapters / totalChapters) * 100);

    const chapterRows = user.chapterProgress
      .map(
        (p) => `
      <tr>
        <td>Del ${p.chapter.part.partNumber}</td>
        <td>${p.chapter.title}</td>
        <td class="center">${p.quizPassed ? '✓' : '-'}</td>
        <td class="center">${p.bestQuizScore ? `${Math.round(p.bestQuizScore)}%` : '-'}</td>
      </tr>
    `
      )
      .join('');

    const certRows = user.certificates
      .map(
        (c) => `
      <tr>
        <td>${c.courseName}</td>
        <td>${c.issuedAt.toLocaleDateString('sv-SE')}</td>
        <td>${c.certificateNumber}</td>
      </tr>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #1a5276;
    }
    .logo { font-size: 20px; font-weight: bold; color: #1a5276; }
    .user-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .user-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .user-details { color: #666; }
    .section { margin-bottom: 25px; }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a5276;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e0e0e0;
    }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a5276; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
    tr:nth-child(even) { background: #f8f9fa; }
    .center { text-align: center; }
    .progress-summary {
      display: inline-block;
      background: #27ae60;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin-left: 10px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ORTAC</div>
    <div>Genererad: ${generatedAt}</div>
  </div>

  <div class="user-info">
    <div class="user-name">${user.firstName} ${user.lastName}</div>
    <div class="user-details">
      ${user.email ? `E-post: ${user.email}` : ''}
      ${user.workplace ? ` | Arbetsplats: ${user.workplace}` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      Kursprogress
      <span class="progress-summary">${progressPercent}% klart</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Del</th>
          <th>Kapitel</th>
          <th class="center">Avklarat</th>
          <th class="center">Quiz-resultat</th>
        </tr>
      </thead>
      <tbody>
        ${chapterRows || '<tr><td colspan="4">Ingen progress registrerad</td></tr>'}
      </tbody>
    </table>
  </div>

  ${user.certificates.length > 0 ? `
  <div class="section">
    <div class="section-title">Certifikat</div>
    <table>
      <thead>
        <tr>
          <th>Kurs</th>
          <th>Utfärdad</th>
          <th>Certifikatnummer</th>
        </tr>
      </thead>
      <tbody>
        ${certRows}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    ORTAC - Orthopaedic Resuscitation and Trauma Acute Care
  </div>
</body>
</html>
    `;
  }
}
