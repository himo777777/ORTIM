import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../types/prisma-types';
import { NotificationsService } from './notifications.service';

interface AuthRequest extends Request {
  user: { userId: string; role: UserRole };
}

interface SubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SendNotificationDto {
  userIds?: string[];
  role?: 'PARTICIPANT' | 'INSTRUCTOR' | 'ADMIN';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // === Public endpoints (for authenticated users) ===

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  getVapidPublicKey() {
    const key = this.notificationsService.getVapidPublicKey();
    return { vapidPublicKey: key };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        keys: {
          type: 'object',
          properties: {
            p256dh: { type: 'string' },
            auth: { type: 'string' },
          },
        },
      },
    },
  })
  async subscribe(@Req() req: AuthRequest, @Body() subscription: SubscriptionDto) {
    const userAgent = req.headers?.['user-agent'] as string | undefined;
    await this.notificationsService.subscribe(
      req.user.userId,
      subscription,
      userAgent,
    );
    return { success: true, message: 'Prenumeration sparad' };
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.notificationsService.unsubscribe(endpoint);
    return { success: true, message: 'Prenumeration borttagen' };
  }

  @Delete('unsubscribe-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe all devices' })
  async unsubscribeAll(@Req() req: AuthRequest) {
    await this.notificationsService.unsubscribeAll(req.user.userId);
    return { success: true, message: 'Alla prenumerationer borttagna' };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(@Req() req: AuthRequest) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  async getUnreadNotifications(@Req() req: AuthRequest) {
    return this.notificationsService.getUserNotifications(req.user.userId, {
      unreadOnly: true,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: AuthRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: AuthRequest) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  // === Admin endpoints ===

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Send notification to users (Admin/Instructor only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string' } },
        role: { type: 'string', enum: ['PARTICIPANT', 'INSTRUCTOR', 'ADMIN'] },
        title: { type: 'string' },
        body: { type: 'string' },
        data: { type: 'object' },
      },
      required: ['title', 'body'],
    },
  })
  async sendNotification(@Body() dto: SendNotificationDto) {
    if (dto.role) {
      return this.notificationsService.sendToRole(dto.role, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });
    }

    if (dto.userIds && dto.userIds.length > 0) {
      return this.notificationsService.sendToUsers(dto.userIds, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });
    }

    return { error: 'Ange antingen userIds eller role' };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification to yourself' })
  async sendTestNotification(@Req() req: AuthRequest) {
    return this.notificationsService.sendToUser(req.user.userId, {
      title: 'Testnotifikation',
      body: 'Detta är en testnotifikation från ORTAC',
      data: { type: 'test', timestamp: new Date().toISOString() },
    });
  }
}
