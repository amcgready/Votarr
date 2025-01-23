// src/__tests__/services/NotificationService.test.ts
import { NotificationService } from '../../services/NotificationService';
import { WebSocketService } from '../../services/WebSocketService';
import { PrismaClient } from '@prisma/client';
import { Notification, NotificationType } from '../../types';

// Mock dependencies
jest.mock('../../services/WebSocketService');
jest.mock('@prisma/client');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;

  const mockNotification: Notification = {
    id: 'notif123',
    userId: 'user123',
    type: NotificationType.SESSION_INVITE,
    message: 'You have been invited to a session',
    data: { sessionId: 'session123' },
    read: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      }
    } as unknown as jest.Mocked<PrismaClient>;

    mockWebSocketService = {
      notifyUser: jest.fn(),
    } as unknown as jest.Mocked<WebSocketService>;

    notificationService = new NotificationService(mockPrisma, mockWebSocketService);
  });

  describe('createNotification', () => {
    it('should create and send notification', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification({
        userId: 'user123',
        type: NotificationType.SESSION_INVITE,
        message: 'You have been invited to a session',
        data: { sessionId: 'session123' }
      });

      expect(result).toEqual(mockNotification);
      expect(mockWebSocketService.notifyUser).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          type: 'NOTIFICATION',
          data: mockNotification
        })
      );
    });

    it('should handle notification data validation', async () => {
      const invalidData = {
        userId: 'user123',
        type: 'INVALID_TYPE',
        message: 'Test message'
      };

      await expect(notificationService.createNotification(invalidData))
        .rejects.toThrow('Invalid notification type');
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [mockNotification];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications('user123');

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter by read status', async () => {
      const mockNotifications = [mockNotification];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications('user123', false);

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123', read: false },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = { ...mockNotification, read: true };
      mockPrisma.notification.update.mockResolvedValue(updatedNotification);

      const result = await notificationService.markNotificationRead('notif123', 'user123');

      expect(result).toEqual(updatedNotification);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif123', userId: 'user123' },
        data: { read: true }
      });
    });

    it('should throw error if notification not found', async () => {
      mockPrisma.notification.update.mockRejectedValue(new Error('Not found'));

      await expect(notificationService.markNotificationRead('invalid-id', 'user123'))
        .rejects.toThrow('Notification not found');
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await notificationService.markAllNotificationsRead('user123');

      expect(result).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user123', read: false
        // src/__tests__/services/NotificationService.test.ts
import { NotificationService } from '../../services/NotificationService';
import { WebSocketService } from '../../services/WebSocketService';
import { PrismaClient } from '@prisma/client';
import { Notification, NotificationType } from '../../types';

// [Previous mock setup and initial tests remain the same]

describe('NotificationService', () => {
  // [Previous test setup remains the same]

  describe('markAllNotificationsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await notificationService.markAllNotificationsRead('user123');

      expect(result).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user123', read: false },
        data: { read: true }
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      const result = await notificationService.deleteNotification('notif123', 'user123');

      expect(result).toEqual(mockNotification);
      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif123', userId: 'user123' }
      });
    });

    it('should throw error if notification not found', async () => {
      mockPrisma.notification.delete.mockRejectedValue(new Error('Not found'));

      await expect(notificationService.deleteNotification('invalid-id', 'user123'))
        .rejects.toThrow('Notification not found');
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all user notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 });

      const result = await notificationService.deleteAllNotifications('user123');

      expect(result).toBe(5);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await notificationService.getUnreadCount('user123');

      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user123', read: false }
      });
    });
  });

  describe('sendSessionInvite', () => {
    it('should create session invite notification', async () => {
      const inviteNotification = {
        ...mockNotification,
        type: NotificationType.SESSION_INVITE,
        message: 'User Test invited you to join a session',
        data: { sessionId: 'session123', inviterId: 'inviter123' }
      };

      mockPrisma.notification.create.mockResolvedValue(inviteNotification);

      const result = await notificationService.sendSessionInvite({
        userId: 'user123',
        sessionId: 'session123',
        inviterName: 'User Test',
        inviterId: 'inviter123'
      });

      expect(result).toEqual(inviteNotification);
      expect(mockWebSocketService.notifyUser).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          type: 'NOTIFICATION',
          data: inviteNotification
        })
      );
    });
  });

  describe('sendVoteNotification', () => {
    it('should create vote notification', async () => {
      const voteNotification = {
        ...mockNotification,
        type: NotificationType.VOTE_UPDATE,
        message: 'New vote in session Test Session',
        data: { sessionId: 'session123', round: 1 }
      };

      mockPrisma.notification.create.mockResolvedValue(voteNotification);

      const result = await notificationService.sendVoteNotification({
        userId: 'user123',
        sessionId: 'session123',
        sessionName: 'Test Session',
        round: 1
      });

      expect(result).toEqual(voteNotification);
      expect(mockWebSocketService.notifyUser).toHaveBeenCalled();
    });
  });

  describe('sendRoundStartNotification', () => {
    it('should create round start notification', async () => {
      const roundNotification = {
        ...mockNotification,
        type: NotificationType.ROUND_START,
        message: 'Round 2 has started in Test Session',
        data: { sessionId: 'session123', round: 2 }
      };

      mockPrisma.notification.create.mockResolvedValue(roundNotification);

      const result = await notificationService.sendRoundStartNotification({
        userId: 'user123',
        sessionId: 'session123',
        sessionName: 'Test Session',
        round: 2
      });

      expect(result).toEqual(roundNotification);
      expect(mockWebSocketService.notifyUser).toHaveBeenCalled();
    });
  });
});
