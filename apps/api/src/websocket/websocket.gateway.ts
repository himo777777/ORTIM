import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface NotificationPayload {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without authentication`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Track user's socket connections
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)?.add(client.id);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Join role-based room
      client.join(`role:${client.userRole}`);

      this.logger.log(`Client ${client.id} connected as user ${client.userId}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} failed authentication: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      userSocketSet?.delete(client.id);

      if (userSocketSet?.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // Subscribe to course updates
  @SubscribeMessage('subscribe:course')
  handleSubscribeCourse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { courseId: string }
  ) {
    if (client.userId) {
      client.join(`course:${data.courseId}`);
      this.logger.log(`User ${client.userId} subscribed to course ${data.courseId}`);
      return { success: true, message: 'Subscribed to course updates' };
    }
    return { success: false, message: 'Not authenticated' };
  }

  // Subscribe to cohort updates (for instructors)
  @SubscribeMessage('subscribe:cohort')
  handleSubscribeCohort(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { cohortId: string }
  ) {
    if (client.userId && (client.userRole === 'INSTRUCTOR' || client.userRole === 'ADMIN')) {
      client.join(`cohort:${data.cohortId}`);
      this.logger.log(`Instructor ${client.userId} subscribed to cohort ${data.cohortId}`);
      return { success: true, message: 'Subscribed to cohort updates' };
    }
    return { success: false, message: 'Not authorized' };
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // Send notification to all users with a specific role
  sendToRole(role: string, event: string, payload: unknown) {
    this.server.to(`role:${role}`).emit(event, payload);
  }

  // Send update to all subscribers of a course
  sendToCourse(courseId: string, event: string, payload: unknown) {
    this.server.to(`course:${courseId}`).emit(event, payload);
  }

  // Send update to all subscribers of a cohort
  sendToCohort(cohortId: string, event: string, payload: unknown) {
    this.server.to(`cohort:${cohortId}`).emit(event, payload);
  }

  // Broadcast notification
  broadcastNotification(payload: NotificationPayload) {
    this.server.emit('notification', payload);
  }

  // Notify about progress update
  notifyProgressUpdate(userId: string, chapterId: string, progress: number) {
    this.sendToUser(userId, 'progress:updated', { chapterId, progress });
  }

  // Notify instructor about participant activity
  notifyInstructorActivity(cohortId: string, activity: {
    userId: string;
    userName: string;
    type: 'quiz_completed' | 'chapter_completed' | 'login' | 'osce_scheduled';
    details?: Record<string, unknown>;
  }) {
    this.sendToCohort(cohortId, 'participant:activity', activity);
  }

  // Notify about OSCE assessment
  notifyOsceAssessment(userId: string, assessment: {
    stationNumber: number;
    stationName: string;
    passed: boolean;
    score?: number;
  }) {
    this.sendToUser(userId, 'osce:assessed', assessment);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
