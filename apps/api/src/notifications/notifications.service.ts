import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as webPush from 'web-push';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {
    // Configure web-push with VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@bortim.se';

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.logger.log('Web Push VAPID keys configured');
    } else {
      this.logger.warn('VAPID keys not configured - push notifications disabled');
    }
  }

  // Get VAPID public key for client subscription
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  // Subscribe to push notifications
  async subscribe(userId: string, subscription: PushSubscriptionData, userAgent?: string) {
    const { endpoint, keys } = subscription;

    // Upsert subscription (update if endpoint exists, create if not)
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });
  }

  // Unsubscribe from push notifications
  async unsubscribe(endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }

  // Unsubscribe all for a user
  async unsubscribeAll(userId: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }

  // Send push notification to a specific user
  async sendToUser(userId: string, payload: NotificationPayload) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    // Store notification in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: 'push',
        title: payload.title,
        body: payload.body,
        data: payload.data as object,
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) => this.sendPush(sub, payload)),
    );

    // Clean up invalid subscriptions
    const invalidEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          invalidEndpoints.push(subscriptions[index].endpoint);
        }
      }
    });

    if (invalidEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: invalidEndpoints } },
      });
      this.logger.log(`Cleaned up ${invalidEndpoints.length} invalid subscriptions`);
    }

    return {
      notification,
      sent: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  // Send push notification to multiple users
  async sendToUsers(userIds: string[], payload: NotificationPayload) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload)),
    );

    return {
      total: userIds.length,
      success: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  // Send push notification to all users with a specific role
  async sendToRole(role: 'PARTICIPANT' | 'INSTRUCTOR' | 'ADMIN', payload: NotificationPayload) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: { id: true },
    });

    return this.sendToUsers(
      users.map((u: { id: string }) => u.id),
      payload,
    );
  }

  // Get user's notifications
  async getUserNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { read: false } : {}),
      },
      orderBy: { sentAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  // Helper method to send push notification
  private async sendPush(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: NotificationPayload,
  ) {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      data: payload.data,
      actions: payload.actions,
    });

    return webPush.sendNotification(pushSubscription, notificationPayload);
  }

  // === Predefined notification templates ===

  async notifyCourseEnrollment(userId: string, courseName: string) {
    return this.sendToUser(userId, {
      title: 'Välkommen till kursen!',
      body: `Du har blivit inskriven i ${courseName}`,
      data: { type: 'enrollment', action: 'open_course' },
      actions: [{ action: 'open_course', title: 'Öppna kurs' }],
    });
  }

  async notifyCertificateIssued(userId: string, courseName: string, certificateId: string) {
    return this.sendToUser(userId, {
      title: 'Certifikat utfärdat!',
      body: `Grattis! Ditt certifikat för ${courseName} är klart`,
      data: { type: 'certificate', certificateId, action: 'view_certificate' },
      actions: [{ action: 'view_certificate', title: 'Visa certifikat' }],
    });
  }

  async notifyOsceScheduled(userId: string, date: Date, location?: string) {
    const dateStr = date.toLocaleDateString('sv-SE');
    return this.sendToUser(userId, {
      title: 'OSCE-examination bokad',
      body: `Din OSCE-examination är schemalagd till ${dateStr}${location ? ` på ${location}` : ''}`,
      data: { type: 'osce', date: date.toISOString(), action: 'view_schedule' },
    });
  }

  async notifyOsceResult(userId: string, passed: boolean, score?: number) {
    return this.sendToUser(userId, {
      title: passed ? 'OSCE godkänd!' : 'OSCE-resultat',
      body: passed
        ? `Grattis! Du har godkänts på OSCE-examinationen${score ? ` med ${score}%` : ''}`
        : `Tyvärr blev du inte godkänd denna gång${score ? ` (${score}%)` : ''}. Du kan boka en ny tid.`,
      data: { type: 'osce_result', passed, score },
    });
  }

  async notifyProgressReminder(userId: string, courseName: string, progress: number) {
    return this.sendToUser(userId, {
      title: 'Fortsätt din utbildning',
      body: `Du har kommit ${progress}% i ${courseName}. Fortsätt för att slutföra kursen!`,
      data: { type: 'reminder', progress, action: 'continue_course' },
      actions: [{ action: 'continue_course', title: 'Fortsätt' }],
    });
  }

  async notifyNewCohort(userIds: string[], cohortName: string, startDate: Date) {
    const dateStr = startDate.toLocaleDateString('sv-SE');
    return this.sendToUsers(userIds, {
      title: 'Ny kursomgång tillgänglig',
      body: `${cohortName} startar ${dateStr}. Anmäl dig nu!`,
      data: { type: 'new_cohort', startDate: startDate.toISOString() },
    });
  }
}
