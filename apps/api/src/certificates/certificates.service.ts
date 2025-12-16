import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

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
}
