import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  ReportFrequency,
  OrganizationMemberRole,
} from '../types/prisma-types';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ============================================
  // ORGANIZATION CRUD (Admin)
  // ============================================

  async findAll(params?: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 50, search } = params || {};

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { organizationNumber: { contains: search } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              members: true,
              reportRecipients: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { organizations, total, skip, take };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
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
          },
          orderBy: { addedAt: 'desc' },
        },
        reportRecipients: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organisationen hittades inte');
    }

    return organization;
  }

  async create(
    data: {
      name: string;
      organizationNumber?: string;
      contactEmail: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: ReportFrequency;
      logoUrl?: string;
    },
    adminUserId: string,
  ) {
    if (data.organizationNumber) {
      const existing = await this.prisma.organization.findUnique({
        where: { organizationNumber: data.organizationNumber },
      });
      if (existing) {
        throw new ConflictException('Organisationsnummer redan registrerat');
      }
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: data.name,
        organizationNumber: data.organizationNumber,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        reportFrequency: data.reportFrequency || 'MONTHLY',
        logoUrl: data.logoUrl,
        nextReportDueAt: this.calculateNextReportDate(
          data.reportFrequency || 'MONTHLY',
        ),
      },
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'CREATE',
      entityType: 'Organization',
      entityId: organization.id,
      details: { name: organization.name },
    });

    return organization;
  }

  async update(
    id: string,
    data: {
      name?: string;
      organizationNumber?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: ReportFrequency;
      reportEnabled?: boolean;
      logoUrl?: string;
      isActive?: boolean;
    },
    adminUserId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organisationen hittades inte');
    }

    if (
      data.organizationNumber &&
      data.organizationNumber !== organization.organizationNumber
    ) {
      const existing = await this.prisma.organization.findUnique({
        where: { organizationNumber: data.organizationNumber },
      });
      if (existing) {
        throw new ConflictException('Organisationsnummer redan registrerat');
      }
    }

    // Recalculate next report date if frequency changed
    const updateData: any = { ...data };
    if (
      data.reportFrequency &&
      data.reportFrequency !== organization.reportFrequency
    ) {
      updateData.nextReportDueAt = this.calculateNextReportDate(
        data.reportFrequency,
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'UPDATE',
      entityType: 'Organization',
      entityId: id,
      details: data,
    });

    return updated;
  }

  async delete(id: string, adminUserId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organisationen hittades inte');
    }

    await this.prisma.organization.delete({ where: { id } });

    await this.auditService.log({
      userId: adminUserId,
      action: 'DELETE',
      entityType: 'Organization',
      entityId: id,
      details: { name: organization.name },
    });

    return { success: true };
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  async addMember(
    organizationId: string,
    data: {
      userId: string;
      role?: OrganizationMemberRole;
      department?: string;
    },
    adminUserId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisationen hittades inte');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('Användaren hittades inte');
    }

    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Användaren är redan medlem i organisationen');
    }

    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: data.userId,
        role: data.role || 'EMPLOYEE',
        department: data.department,
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

    await this.auditService.log({
      userId: adminUserId,
      action: 'CREATE',
      entityType: 'OrganizationMember',
      entityId: member.id,
      details: {
        organizationId,
        userId: data.userId,
        role: data.role || 'EMPLOYEE',
      },
    });

    return member;
  }

  async updateMember(
    organizationId: string,
    userId: string,
    data: {
      role?: OrganizationMemberRole;
      department?: string;
    },
    adminUserId: string,
  ) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('Medlemskapet hittades inte');
    }

    const updated = await this.prisma.organizationMember.update({
      where: { id: member.id },
      data,
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

    await this.auditService.log({
      userId: adminUserId,
      action: 'UPDATE',
      entityType: 'OrganizationMember',
      entityId: member.id,
      details: data,
    });

    return updated;
  }

  async removeMember(
    organizationId: string,
    userId: string,
    adminUserId: string,
  ) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('Medlemskapet hittades inte');
    }

    await this.prisma.organizationMember.delete({ where: { id: member.id } });

    await this.auditService.log({
      userId: adminUserId,
      action: 'DELETE',
      entityType: 'OrganizationMember',
      entityId: member.id,
      details: { organizationId, userId },
    });

    return { success: true };
  }

  // ============================================
  // REPORT RECIPIENTS
  // ============================================

  async addReportRecipient(
    organizationId: string,
    data: { email: string; name?: string },
    adminUserId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organisationen hittades inte');
    }

    const recipient = await this.prisma.organizationReportRecipient.create({
      data: {
        organizationId,
        email: data.email,
        name: data.name,
      },
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'CREATE',
      entityType: 'OrganizationReportRecipient',
      entityId: recipient.id,
      details: { email: data.email },
    });

    return recipient;
  }

  async removeReportRecipient(recipientId: string, adminUserId: string) {
    const recipient = await this.prisma.organizationReportRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Mottagaren hittades inte');
    }

    await this.prisma.organizationReportRecipient.delete({
      where: { id: recipientId },
    });

    await this.auditService.log({
      userId: adminUserId,
      action: 'DELETE',
      entityType: 'OrganizationReportRecipient',
      entityId: recipientId,
      details: { email: recipient.email },
    });

    return { success: true };
  }

  // ============================================
  // PORTAL DATA (for organization managers)
  // ============================================

  async getPortalDashboard(userId: string) {
    // Find user's organization membership
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { in: ['MANAGER', 'ADMIN'] },
        organization: { isActive: true },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Du har inte behörighet till organisationsportalen');
    }

    const organizationId = membership.organizationId;

    // Get summary statistics
    const [
      totalEmployees,
      employeesWithCertificates,
      expiringCertificates,
      averageProgress,
    ] = await Promise.all([
      this.prisma.organizationMember.count({
        where: { organizationId },
      }),
      this.prisma.organizationMember.count({
        where: {
          organizationId,
          user: {
            certificates: { some: {} },
          },
        },
      }),
      this.prisma.certificate.count({
        where: {
          user: {
            organizationMemberships: {
              some: { organizationId },
            },
          },
          validUntil: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.getAverageProgressForOrganization(organizationId),
    ]);

    // Get recent certificates
    const recentCertificates = await this.prisma.certificate.findMany({
      where: {
        user: {
          organizationMemberships: {
            some: { organizationId },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: 'ACCESS',
      entityType: 'OrganizationPortal',
      entityId: organizationId,
      details: { action: 'dashboard' },
    });

    return {
      organization: membership.organization,
      stats: {
        totalEmployees,
        employeesWithCertificates,
        certificationRate:
          totalEmployees > 0
            ? Math.round((employeesWithCertificates / totalEmployees) * 100)
            : 0,
        expiringCertificates,
        averageProgress,
      },
      recentCertificates,
    };
  }

  async getPortalEmployees(
    userId: string,
    params?: { skip?: number; take?: number; search?: string },
  ) {
    const membership = await this.validatePortalAccess(userId);
    const organizationId = membership.organizationId;

    const { skip = 0, take = 50, search } = params || {};

    const where: any = {
      organizationId,
    };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [employees, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where,
        skip,
        take,
        orderBy: { user: { lastName: 'asc' } },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              workplace: true,
              certificates: {
                orderBy: { issuedAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  courseName: true,
                  issuedAt: true,
                  validUntil: true,
                },
              },
              _count: {
                select: {
                  chapterProgress: true,
                  certificates: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.organizationMember.count({ where }),
    ]);

    await this.auditService.log({
      userId,
      action: 'ACCESS',
      entityType: 'OrganizationPortal',
      entityId: organizationId,
      details: { action: 'employees', search },
    });

    return { employees, total, skip, take };
  }

  async getPortalEmployeeDetail(userId: string, employeeUserId: string) {
    const membership = await this.validatePortalAccess(userId);
    const organizationId = membership.organizationId;

    // Verify employee belongs to organization
    const employeeMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: employeeUserId,
        },
      },
    });

    if (!employeeMembership) {
      throw new NotFoundException('Anställd hittades inte i organisationen');
    }

    const employee = await this.prisma.user.findUnique({
      where: { id: employeeUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        workplace: true,
        createdAt: true,
        certificates: {
          orderBy: { issuedAt: 'desc' },
        },
        chapterProgress: {
          include: {
            chapter: {
              select: {
                title: true,
                chapterNumber: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            cohort: {
              include: {
                course: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: 'ACCESS',
      entityType: 'OrganizationPortal',
      entityId: organizationId,
      details: { action: 'employeeDetail', employeeUserId },
    });

    return {
      ...employee,
      department: employeeMembership.department,
      memberRole: employeeMembership.role,
    };
  }

  async exportPortalData(userId: string): Promise<string> {
    const membership = await this.validatePortalAccess(userId);
    const organizationId = membership.organizationId;

    const employees = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            personnummer: true,
            firstName: true,
            lastName: true,
            email: true,
            workplace: true,
            certificates: {
              orderBy: { issuedAt: 'desc' },
            },
          },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    });

    const headers = [
      'Förnamn',
      'Efternamn',
      'E-post',
      'Avdelning',
      'Certifikat',
      'Certifikat giltig till',
      'Status',
    ];

    const rows = employees.map((e) => {
      const latestCert = e.user.certificates[0];
      const certStatus = latestCert
        ? new Date(latestCert.validUntil) > new Date()
          ? 'Giltigt'
          : 'Utgånget'
        : 'Inget certifikat';

      return [
        e.user.firstName,
        e.user.lastName,
        e.user.email || '',
        e.department || '',
        latestCert?.courseName || '',
        latestCert?.validUntil.toISOString().split('T')[0] || '',
        certStatus,
      ];
    });

    await this.auditService.log({
      userId,
      action: 'EXPORT',
      entityType: 'OrganizationPortal',
      entityId: organizationId,
      details: { action: 'exportEmployees', count: employees.length },
    });

    return this.arrayToCsv([headers, ...rows]);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async validatePortalAccess(userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { in: ['MANAGER', 'ADMIN'] },
        organization: { isActive: true },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Du har inte behörighet till organisationsportalen');
    }

    return membership;
  }

  private async getAverageProgressForOrganization(
    organizationId: string,
  ): Promise<number> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      select: {
        user: {
          select: {
            chapterProgress: {
              select: { readProgress: true },
            },
          },
        },
      },
    });

    if (members.length === 0) return 0;

    let totalProgress = 0;
    let progressCount = 0;

    members.forEach((member) => {
      member.user.chapterProgress.forEach((progress) => {
        totalProgress += progress.readProgress;
        progressCount++;
      });
    });

    return progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;
  }

  private calculateNextReportDate(frequency: ReportFrequency): Date {
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

    next.setHours(7, 0, 0, 0); // 07:00
    return next;
  }

  private arrayToCsv(data: string[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            const escaped = cell.replace(/"/g, '""');
            if (
              escaped.includes(',') ||
              escaped.includes('"') ||
              escaped.includes('\n')
            ) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(','),
      )
      .join('\n');
  }
}
