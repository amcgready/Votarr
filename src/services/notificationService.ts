// File: src/services/notificationService.ts

import { WebSocketService } from './websocketService';
import { UserService } from './userService';
import { SessionService } from './sessionService';
import { VoteService } from './voteService';
import { Notification, NotificationType } from '@/types/notification';

class NotificationService {
  private webSocketService: WebSocketService;
  private userService: UserService;
  private sessionService: SessionService;
  private voteService: VoteService;

  constructor(
    webSocketService: WebSocketService,
    userService: UserService,
    sessionService: SessionService,
    voteService: VoteService
  ) {
    this.webSocketService = webSocketService;
    this.userService = userService;
    this.sessionService = sessionService;
    this.voteService = voteService;
  }

  pushNotification(notification: Notification) {
    this.webSocketService.broadcastToUsers(notification.targetUserIds, {
      type: 'notification',
      payload: notification
    });
  }

  async notifyNewSession(sessionId: string) {
    const session = await this.sessionService.getSessionById(sessionId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.NewSession,
      title: 'New Session Created',
      message: `A new session '${session.name}' has been created.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }

  async notifyUserJoinedSession(sessionId: string, userId: string) {
    const session = await this.sessionService.getSessionById(sessionId);
    const user = await this.userService.getUserById(userId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.UserJoinedSession,
      title: 'User Joined Session',
      message: `${user.name} has joined the session '${session.name}'.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }

  async notifyUserLeftSession(sessionId: string, userId: string) {
    const session = await this.sessionService.getSessionById(sessionId);
    const user = await this.userService.getUserById(userId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.UserLeftSession,
      title: 'User Left Session',
      message: `${user.name} has left the session '${session.name}'.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }

  async notifyRoundStarted(sessionId: string, roundNumber: number) {
    const session = await this.sessionService.getSessionById(sessionId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.RoundStarted,
      title: 'New Round Started',
      message: `Round ${roundNumber} has started for the session '${session.name}'.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }

  async notifyRoundCompleted(sessionId: string, roundNumber: number) {
    const session = await this.sessionService.getSessionById(sessionId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.RoundCompleted,
      title: 'Round Completed',
      message: `Round ${roundNumber} has completed for the session '${session.name}'.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }

  async notifyVoteSubmitted(sessionId: string, userId: string) {
    const session = await this.sessionService.getSessionById(sessionId);
    const user = await this.userService.getUserById(userId);
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: NotificationType.VoteSubmitted,
      title: 'Vote Submitted',
      message: `${user.name} has submitted a vote for the session '${session.name}'.`,
      targetUserIds: await this.userService.getUserIdsInSession(sessionId)
    };

    this.pushNotification(notification);
  }
}

export { NotificationService };
