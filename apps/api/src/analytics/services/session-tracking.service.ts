import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  averageDuration: number;
  averagePageViews: number;
  averageActions: number;
  deviceBreakdown: Record<string, number>;
}

export interface UserSessionInfo {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  pageViews: number;
  actions: number;
  deviceType: string | null;
  isActive: boolean;
}

@Injectable()
export class SessionTrackingService {
  private readonly logger = new Logger(SessionTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Starta en ny session för en användare
   */
  async startSession(
    userId: string,
    deviceType?: string,
    browser?: string,
  ): Promise<UserSessionInfo> {
    // Avsluta eventuell aktiv session först
    await this.endActiveSessionsForUser(userId);

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        deviceType: deviceType || this.detectDeviceType(),
        browser,
        isActive: true,
      },
    });

    this.logger.log(`Session started for user ${userId}: ${session.id}`);

    return {
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
      pageViews: session.pageViews,
      actions: session.actions,
      deviceType: session.deviceType,
      isActive: session.isActive,
    };
  }

  /**
   * Uppdatera session med heartbeat (aktivitet)
   */
  async heartbeat(
    sessionId: string,
    incrementPageViews: boolean = false,
    incrementActions: boolean = false,
  ): Promise<UserSessionInfo | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      this.logger.warn(`Heartbeat for inactive/missing session: ${sessionId}`);
      return null;
    }

    // Beräkna duration från start
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000,
    );

    const updated = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        durationSeconds,
        pageViews: incrementPageViews ? { increment: 1 } : undefined,
        actions: incrementActions ? { increment: 1 } : undefined,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt,
      durationSeconds: updated.durationSeconds,
      pageViews: updated.pageViews,
      actions: updated.actions,
      deviceType: updated.deviceType,
      isActive: updated.isActive,
    };
  }

  /**
   * Avsluta en session
   */
  async endSession(sessionId: string): Promise<UserSessionInfo | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return null;
    }

    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000,
    );

    const updated = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        endedAt: now,
        durationSeconds,
        isActive: false,
      },
    });

    this.logger.log(
      `Session ended: ${sessionId}, duration: ${durationSeconds}s`,
    );

    return {
      id: updated.id,
      userId: updated.userId,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt,
      durationSeconds: updated.durationSeconds,
      pageViews: updated.pageViews,
      actions: updated.actions,
      deviceType: updated.deviceType,
      isActive: updated.isActive,
    };
  }

  /**
   * Avsluta alla aktiva sessioner för en användare
   */
  async endActiveSessionsForUser(userId: string): Promise<number> {
    const now = new Date();

    // Hämta aktiva sessioner
    const activeSessions = await this.prisma.userSession.findMany({
      where: { userId, isActive: true },
    });

    // Uppdatera varje session med korrekt duration
    for (const session of activeSessions) {
      const durationSeconds = Math.floor(
        (now.getTime() - session.startedAt.getTime()) / 1000,
      );

      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          durationSeconds,
          isActive: false,
        },
      });
    }

    return activeSessions.length;
  }

  /**
   * Hämta aktiv session för användare
   */
  async getActiveSession(userId: string): Promise<UserSessionInfo | null> {
    const session = await this.prisma.userSession.findFirst({
      where: { userId, isActive: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
      pageViews: session.pageViews,
      actions: session.actions,
      deviceType: session.deviceType,
      isActive: session.isActive,
    };
  }

  /**
   * Hämta sessionsstatistik
   */
  async getSessionStats(days: number = 30): Promise<SessionStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.prisma.userSession.findMany({
      where: {
        startedAt: { gte: startDate },
      },
    });

    const activeSessions = sessions.filter((s) => s.isActive).length;
    const completedSessions = sessions.filter(
      (s) => !s.isActive && s.durationSeconds,
    );

    // Beräkna genomsnittlig duration (endast avslutade sessioner)
    const totalDuration = completedSessions.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0,
    );
    const averageDuration =
      completedSessions.length > 0
        ? Math.round(totalDuration / completedSessions.length)
        : 0;

    // Beräkna genomsnittliga sidvisningar och actions
    const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);
    const totalActions = sessions.reduce((sum, s) => sum + s.actions, 0);
    const averagePageViews =
      sessions.length > 0 ? Math.round(totalPageViews / sessions.length) : 0;
    const averageActions =
      sessions.length > 0 ? Math.round(totalActions / sessions.length) : 0;

    // Enhetsfördelning
    const deviceBreakdown: Record<string, number> = {};
    for (const session of sessions) {
      const device = session.deviceType || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    }

    return {
      totalSessions: sessions.length,
      activeSessions,
      averageDuration,
      averagePageViews,
      averageActions,
      deviceBreakdown,
    };
  }

  /**
   * Hämta sessionshistorik för en användare
   */
  async getUserSessions(
    userId: string,
    limit: number = 20,
  ): Promise<UserSessionInfo[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSeconds: s.durationSeconds,
      pageViews: s.pageViews,
      actions: s.actions,
      deviceType: s.deviceType,
      isActive: s.isActive,
    }));
  }

  /**
   * Hämta genomsnittlig sessionslängd för en användare
   */
  async getUserAverageSessionDuration(userId: string): Promise<number> {
    const result = await this.prisma.userSession.aggregate({
      where: {
        userId,
        isActive: false,
        durationSeconds: { not: null },
      },
      _avg: {
        durationSeconds: true,
      },
    });

    return Math.round(result._avg.durationSeconds || 0);
  }

  /**
   * Hämta antal aktiva användare just nu
   */
  async getActiveUsersCount(): Promise<number> {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Räkna unika användare med aktiva sessioner som uppdaterats senaste 5 min
    const result = await this.prisma.userSession.groupBy({
      by: ['userId'],
      where: {
        isActive: true,
        startedAt: { gte: fiveMinutesAgo },
      },
    });

    return result.length;
  }

  /**
   * Rensa gamla inaktiva sessioner (cleanup job)
   */
  async cleanupOldSessions(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.userSession.deleteMany({
      where: {
        isActive: false,
        endedAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old sessions`);
    return result.count;
  }

  /**
   * Detektera enhetstyp från user agent (förenklad)
   */
  private detectDeviceType(): string {
    // I verklig implementation skulle detta komma från user agent
    return 'desktop';
  }
}
