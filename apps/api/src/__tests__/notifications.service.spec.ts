import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../common/prisma/prisma.service';

// Mock web-push
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    pushSubscription: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Set env vars
    process.env.VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVapidPublicKey', () => {
    it('should return VAPID public key from env', () => {
      process.env.VAPID_PUBLIC_KEY = 'my-vapid-key';
      expect(service.getVapidPublicKey()).toBe('my-vapid-key');
    });
  });

  describe('subscribe', () => {
    it('should create push subscription', async () => {
      const subscription = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'key2' },
      };

      mockPrismaService.pushSubscription.upsert.mockResolvedValue({
        id: '1',
        userId: 'user-1',
        ...subscription,
      });

      const result = await service.subscribe('user-1', subscription, 'Mozilla/5.0');

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: subscription.endpoint },
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', body: 'Body 1', read: false },
        { id: '2', title: 'Test 2', body: 'Body 2', read: true },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getUserNotifications('user-1');

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });

    it('should filter unread only when specified', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.getUserNotifications('user-1', { unreadOnly: true });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', read: false },
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('notification-1', 'user-1');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notification-1', userId: 'user-1' },
        data: expect.objectContaining({ read: true }),
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  describe('sendToUser', () => {
    it('should send notification to user subscriptions', async () => {
      const subscriptions = [
        { endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ];

      mockPrismaService.pushSubscription.findMany.mockResolvedValue(subscriptions);
      mockPrismaService.notification.create.mockResolvedValue({
        id: '1',
        title: 'Test',
        body: 'Test body',
      });

      const result = await service.sendToUser('user-1', {
        title: 'Test',
        body: 'Test body',
      });

      expect(result).toHaveProperty('notification');
      expect(result).toHaveProperty('sent');
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });
});
