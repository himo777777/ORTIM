import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'EXPORT';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry, context: AuditContext = {}): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          details: entry.details,
          userId: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Audit log error:', error);
    }
  }

  /**
   * Log user creation
   */
  async logUserCreated(userId: string, createdBy: string, context: AuditContext = {}) {
    await this.log(
      {
        action: 'CREATE',
        entityType: 'User',
        entityId: userId,
        details: { createdBy },
      },
      context
    );
  }

  /**
   * Log user update
   */
  async logUserUpdated(userId: string, changes: Record<string, unknown>, context: AuditContext = {}) {
    await this.log(
      {
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        details: { changes },
      },
      context
    );
  }

  /**
   * Log user deletion
   */
  async logUserDeleted(userId: string, deletedBy: string, context: AuditContext = {}) {
    await this.log(
      {
        action: 'DELETE',
        entityType: 'User',
        entityId: userId,
        details: { deletedBy },
      },
      context
    );
  }

  /**
   * Log course creation
   */
  async logCourseCreated(courseId: string, createdBy: string, context: AuditContext = {}) {
    await this.log(
      {
        action: 'CREATE',
        entityType: 'Course',
        entityId: courseId,
        details: { createdBy },
      },
      context
    );
  }

  /**
   * Log course update
   */
  async logCourseUpdated(courseId: string, changes: Record<string, unknown>, context: AuditContext = {}) {
    await this.log(
      {
        action: 'UPDATE',
        entityType: 'Course',
        entityId: courseId,
        details: { changes },
      },
      context
    );
  }

  /**
   * Log login attempt
   */
  async logLogin(userId: string, success: boolean, context: AuditContext = {}) {
    await this.log(
      {
        action: 'LOGIN',
        entityType: 'Auth',
        entityId: userId,
        details: { success },
      },
      context
    );
  }

  /**
   * Log logout
   */
  async logLogout(userId: string, context: AuditContext = {}) {
    await this.log(
      {
        action: 'LOGOUT',
        entityType: 'Auth',
        entityId: userId,
      },
      context
    );
  }

  /**
   * Log certificate issued
   */
  async logCertificateIssued(
    certificateId: string,
    userId: string,
    courseId: string,
    context: AuditContext = {}
  ) {
    await this.log(
      {
        action: 'CREATE',
        entityType: 'Certificate',
        entityId: certificateId,
        details: { userId, courseId },
      },
      context
    );
  }

  /**
   * Log data export
   */
  async logDataExport(exportType: string, userId: string, context: AuditContext = {}) {
    await this.log(
      {
        action: 'EXPORT',
        entityType: 'Export',
        details: { exportType, requestedBy: userId },
      },
      context
    );
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    action: AuditAction,
    description: string,
    context: AuditContext = {}
  ) {
    await this.log(
      {
        action,
        entityType: 'Admin',
        details: { description },
      },
      context
    );
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(options: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: AuditAction;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const {
      userId,
      entityType,
      entityId,
      action,
      fromDate,
      toDate,
      page = 1,
      pageSize = 50,
    } = options;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) (where.timestamp as Record<string, Date>).gte = fromDate;
      if (toDate) (where.timestamp as Record<string, Date>).lte = toDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
