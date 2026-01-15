import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from '../certificates/certificates.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockCertificate = {
    id: 'cert-123',
    certificateNumber: 'BORTIM-2024-001',
    userId: 'user-123',
    user: mockUser,
    cohortId: 'cohort-123',
    courseCode: 'B-ORTIM-1',
    courseName: 'B-ORTIM Grundkurs',
    issuedAt: new Date('2024-01-01'),
    validUntil: new Date('2027-01-01'),
    examScore: 85,
    examPassed: true,
    oscePassed: true,
    lipusNumber: 'LIPUS-12345',
    verificationUrl: 'verify-abc123',
    pdfUrl: 'https://s3.example.com/cert.pdf',
  };

  const mockPrismaService = {
    certificate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('should return certificates for a user', async () => {
      mockPrismaService.certificate.findMany.mockResolvedValue([mockCertificate]);

      const result = await service.findByUser('user-123');

      expect(result).toEqual([mockCertificate]);
      expect(mockPrismaService.certificate.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { issuedAt: 'desc' },
      });
    });

    it('should return empty array if user has no certificates', async () => {
      mockPrismaService.certificate.findMany.mockResolvedValue([]);

      const result = await service.findByUser('user-no-certs');

      expect(result).toEqual([]);
    });

    it('should order certificates by issuedAt descending', async () => {
      const certificates = [
        { ...mockCertificate, id: 'cert-1', issuedAt: new Date('2024-01-01') },
        { ...mockCertificate, id: 'cert-2', issuedAt: new Date('2023-01-01') },
      ];
      mockPrismaService.certificate.findMany.mockResolvedValue(certificates);

      await service.findByUser('user-123');

      expect(mockPrismaService.certificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { issuedAt: 'desc' },
        })
      );
    });
  });

  describe('findById', () => {
    it('should return certificate by id', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(mockCertificate);

      const result = await service.findById('cert-123');

      expect(result).toEqual(mockCertificate);
      expect(mockPrismaService.certificate.findUnique).toHaveBeenCalledWith({
        where: { id: 'cert-123' },
      });
    });

    it('should return null if certificate not found', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('verify', () => {
    it('should return isValid true for valid certificate', async () => {
      const validCertificate = {
        ...mockCertificate,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
      mockPrismaService.certificate.findUnique.mockResolvedValue(validCertificate);

      const result = await service.verify('verify-abc123');

      expect(result.isValid).toBe(true);
      expect(result.certificate).toEqual({
        certificateNumber: validCertificate.certificateNumber,
        courseName: validCertificate.courseName,
        issuedAt: validCertificate.issuedAt,
        validUntil: validCertificate.validUntil,
        examPassed: validCertificate.examPassed,
        holderName: 'Test User',
      });
    });

    it('should return isValid false for expired certificate', async () => {
      const expiredCertificate = {
        ...mockCertificate,
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };
      mockPrismaService.certificate.findUnique.mockResolvedValue(expiredCertificate);

      const result = await service.verify('verify-abc123');

      expect(result.isValid).toBe(false);
    });

    it('should return isValid false for non-existent certificate', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);

      const result = await service.verify('invalid-code');

      expect(result).toEqual({ isValid: false });
    });

    it('should include user information in verification', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        ...mockCertificate,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      await service.verify('verify-abc123');

      expect(mockPrismaService.certificate.findUnique).toHaveBeenCalledWith({
        where: { verificationUrl: 'verify-abc123' },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      });
    });

    it('should construct holder name correctly', async () => {
      const certificateWithDifferentUser = {
        ...mockCertificate,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        user: { firstName: 'Anna', lastName: 'Andersson' },
      };
      mockPrismaService.certificate.findUnique.mockResolvedValue(certificateWithDifferentUser);

      const result = await service.verify('verify-abc123');

      expect(result.certificate?.holderName).toBe('Anna Andersson');
    });
  });
});
