import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../common/prisma/prisma.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('EmailService', () => {
  let service: EmailService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@test.com',
        SMTP_PASS: 'password',
        SMTP_FROM: 'noreply@ortac.se',
        APP_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should create token and send email', async () => {
      mockPrismaService.passwordResetToken.create.mockResolvedValue({
        id: '1',
        token: 'test-token',
        userId: 'user-1',
      });

      const result = await service.sendPasswordResetEmail('user-1', 'test@example.com');

      expect(result).toBe(true);
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      );
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should return userId for valid token', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        token: 'valid-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        usedAt: null,
      });

      const result = await service.validatePasswordResetToken('valid-token');

      expect(result).toBe('user-1');
    });

    it('should return null for expired token', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        usedAt: null,
      });

      const result = await service.validatePasswordResetToken('expired-token');

      expect(result).toBeNull();
    });

    it('should return null for already used token', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        token: 'used-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(),
      });

      const result = await service.validatePasswordResetToken('used-token');

      expect(result).toBeNull();
    });

    it('should return null for non-existent token', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await service.validatePasswordResetToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('markPasswordResetTokenUsed', () => {
    it('should mark token as used', async () => {
      mockPrismaService.passwordResetToken.update.mockResolvedValue({
        id: '1',
        usedAt: new Date(),
      });

      await service.markPasswordResetTokenUsed('test-token');

      expect(mockPrismaService.passwordResetToken.update).toHaveBeenCalledWith({
        where: { token: 'test-token' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcomeEmail(
        'test@example.com',
        'Test',
        'ORTAC Course'
      );

      expect(result).toBe(true);
    });
  });

  describe('sendCertificateEmail', () => {
    it('should send certificate email', async () => {
      const result = await service.sendCertificateEmail(
        'test@example.com',
        'Test',
        'ORTAC Course',
        'CERT-001',
        'http://localhost:3000/verify/abc123'
      );

      expect(result).toBe(true);
    });
  });
});
