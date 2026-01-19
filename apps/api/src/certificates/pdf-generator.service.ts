import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { generateCertificateHtml } from './certificate.template';

@Injectable()
export class PdfGeneratorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a PDF certificate for a given certificate ID
   */
  async generateCertificatePdf(certificateId: string): Promise<Buffer> {
    // Fetch certificate with related data
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certifikatet hittades inte');
    }

    // Fetch certificate template for styling/signer info
    const course = await this.prisma.course.findUnique({
      where: { code: certificate.courseCode },
      include: {
        certTemplate: true,
      },
    });

    const template = course?.certTemplate;

    // Generate QR code as data URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://ortac.se'}/verify/${certificate.verificationUrl}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
    });

    // Generate HTML content
    const html = generateCertificateHtml({
      certificateNumber: certificate.certificateNumber,
      recipientName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      courseName: certificate.courseName,
      courseCode: certificate.courseCode,
      issuedAt: certificate.issuedAt,
      validUntil: certificate.validUntil,
      examScore: certificate.examScore,
      examPassed: certificate.examPassed,
      lipusNumber: certificate.lipusNumber,
      verificationCode: certificate.verificationUrl,
      verificationUrl: verificationUrl,
      signerName: template?.signerName || undefined,
      signerTitle: template?.signerTitle || undefined,
      logoUrl: template?.logoUrl || undefined,
      signatureImageUrl: template?.signatureImageUrl || undefined,
    });

    // Inject QR code into HTML
    const htmlWithQr = html.replace(
      '<div class="qr-code" id="qr-code"></div>',
      `<img class="qr-code" src="${qrCodeDataUrl}" alt="QR Code">`
    );

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for fonts to load
      await page.setContent(htmlWithQr, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF with A4 landscape dimensions
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate certificate filename
   */
  generateFilename(certificateNumber: string, recipientName: string): string {
    const safeName = recipientName
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `certifikat-${certificateNumber}-${safeName}.pdf`;
  }
}
