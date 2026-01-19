import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  // Generate a unique verification code
  private generateVerificationCode(): string {
    return randomBytes(16).toString('hex').toUpperCase();
  }

  // Generate certificate number with format: COURSE-YYYY-NNNN
  private async generateCertificateNumber(courseCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${courseCode}-${year}`;

    // Count existing certificates with this prefix to get the next number
    const count = await this.prisma.certificate.count({
      where: {
        certificateNumber: {
          startsWith: prefix,
        },
      },
    });

    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  }

  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
    });
  }

  async verify(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationUrl: code },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!certificate) {
      return { isValid: false };
    }

    const now = new Date();
    const isValid = certificate.validUntil > now;

    return {
      isValid,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        courseName: certificate.courseName,
        issuedAt: certificate.issuedAt,
        validUntil: certificate.validUntil,
        examPassed: certificate.examPassed,
        holderName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      },
    };
  }

  /**
   * Check if user is eligible for certificate and generate it if so.
   * Returns eligibility status and certificate if generated.
   */
  async checkAndGenerateCertificate(userId: string, courseCode: string) {
    // 1. Check if user already has a valid certificate for this course
    const existingCert = await this.prisma.certificate.findFirst({
      where: {
        userId,
        courseCode,
        validUntil: { gt: new Date() }, // Still valid
      },
    });

    if (existingCert) {
      return {
        eligible: true,
        alreadyHasCertificate: true,
        certificate: existingCert,
        message: 'Du har redan ett giltigt certifikat för denna kurs',
      };
    }

    // 2. Get course with chapters and certificate template
    const course = await this.prisma.course.findUnique({
      where: { code: courseCode },
      include: {
        parts: {
          include: {
            chapters: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
        certTemplate: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }

    // 3. Get all chapter IDs for this course
    const chapterIds = course.parts.flatMap(p => p.chapters.map(c => c.id));

    if (chapterIds.length === 0) {
      throw new BadRequestException('Kursen har inga aktiva kapitel');
    }

    // 4. Get user's progress for all chapters
    const progress = await this.prisma.chapterProgress.findMany({
      where: {
        userId,
        chapterId: { in: chapterIds },
      },
    });

    // 5. Check completion requirements
    const completedChapters = progress.filter(p => p.completedAt !== null);
    const quizPassedChapters = progress.filter(p => p.quizPassed);

    const allChaptersCompleted = completedChapters.length >= chapterIds.length;
    const allQuizzesPassed = quizPassedChapters.length >= chapterIds.length;

    // Calculate average quiz score (if available)
    const quizScores = progress
      .filter(p => p.bestQuizScore !== null)
      .map(p => p.bestQuizScore as number);
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
      : 0;

    // 6. Return eligibility status if not eligible
    if (!allChaptersCompleted || !allQuizzesPassed) {
      return {
        eligible: false,
        alreadyHasCertificate: false,
        certificate: null,
        requirements: {
          chaptersCompleted: completedChapters.length,
          chaptersRequired: chapterIds.length,
          quizzesPassed: quizPassedChapters.length,
          quizzesRequired: chapterIds.length,
        },
        message: !allChaptersCompleted
          ? `Du har inte slutfört alla kapitel (${completedChapters.length}/${chapterIds.length})`
          : `Du har inte klarat alla quiz (${quizPassedChapters.length}/${chapterIds.length})`,
      };
    }

    // 7. Generate certificate
    const template = course.certTemplate;
    const validityYears = template?.validityYears || 3;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + validityYears);

    const certificateNumber = await this.generateCertificateNumber(courseCode);
    const verificationCode = this.generateVerificationCode();

    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseCode,
        courseName: course.fullName,
        certificateNumber,
        verificationUrl: verificationCode,
        validUntil,
        examScore: averageQuizScore,
        examPassed: true,
        lipusNumber: course.lipusNumber,
      },
    });

    return {
      eligible: true,
      alreadyHasCertificate: false,
      certificate,
      message: 'Certifikat har genererats!',
    };
  }

  /**
   * Recertify an existing certificate.
   * Creates a new certificate with reference to the previous one.
   */
  async recertify(certificateId: string, userId: string) {
    // 1. Find the existing certificate
    const oldCert = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!oldCert) {
      throw new NotFoundException('Certifikatet hittades inte');
    }

    // 2. Verify ownership
    if (oldCert.userId !== userId) {
      throw new BadRequestException('Du kan bara förnya dina egna certifikat');
    }

    // 3. Check if certificate is within recertification window (e.g., expired or within 90 days of expiry)
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (oldCert.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry > 90) {
      throw new BadRequestException(
        `Certifikatet kan inte förnyas ännu. Det går ut om ${daysUntilExpiry} dagar.`,
      );
    }

    // 4. Check if user has completed recertification requirements
    const course = await this.prisma.course.findUnique({
      where: { code: oldCert.courseCode },
      include: {
        certTemplate: true,
        parts: {
          include: {
            chapters: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }

    const template = course.certTemplate;

    // Check if course requires recertification course completion
    if (template?.recertRequired && template?.recertCourseName) {
      // Check for recertification course progress
      // For now, we'll just require all quizzes passed (simplified)
      const chapterIds = course.parts.flatMap(p => p.chapters.map(c => c.id));
      const progress = await this.prisma.chapterProgress.findMany({
        where: {
          userId,
          chapterId: { in: chapterIds },
        },
      });

      const quizPassedChapters = progress.filter(p => p.quizPassed);
      const allQuizzesPassed = quizPassedChapters.length >= chapterIds.length;

      if (!allQuizzesPassed) {
        return {
          eligible: false,
          message: 'Du måste klara alla quiz för att förnya certifikatet',
          requirements: {
            quizzesPassed: quizPassedChapters.length,
            quizzesRequired: chapterIds.length,
          },
        };
      }
    }

    // 5. Calculate new validity period
    const validityYears = template?.recertValidityYears || template?.validityYears || 3;
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + validityYears);

    // 6. Generate new certificate
    const certificateNumber = await this.generateCertificateNumber(oldCert.courseCode);
    const verificationCode = this.generateVerificationCode();

    const newCertificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseCode: oldCert.courseCode,
        courseName: oldCert.courseName,
        certificateNumber,
        verificationUrl: verificationCode,
        validUntil,
        examScore: oldCert.examScore,
        examPassed: true,
        lipusNumber: oldCert.lipusNumber,
        isRecertification: true,
        previousCertId: oldCert.id,
        recertificationCount: (oldCert.recertificationCount || 0) + 1,
      },
    });

    return {
      eligible: true,
      certificate: newCertificate,
      message: 'Certifikatet har förnyats!',
      previousCertificate: {
        id: oldCert.id,
        certificateNumber: oldCert.certificateNumber,
        validUntil: oldCert.validUntil,
      },
    };
  }

  /**
   * Get certificate expiration status
   */
  async getExpirationStatus(certificateId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certifikatet hittades inte');
    }

    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (certificate.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status: 'valid' | 'expiring_soon' | 'expired';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 90) {
      status = 'expiring_soon';
    } else {
      status = 'valid';
    }

    return {
      certificateId: certificate.id,
      validUntil: certificate.validUntil,
      daysUntilExpiry,
      status,
      canRecertify: daysUntilExpiry <= 90,
      isRecertification: certificate.isRecertification,
      recertificationCount: certificate.recertificationCount || 0,
    };
  }
}
