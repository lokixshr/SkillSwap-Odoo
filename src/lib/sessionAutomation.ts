import { SessionService, NotificationService, UserService } from './database';
import { EmailService } from './emailService';
import { MeetingService } from './meetingService';
import type { Session } from './database';
import { Timestamp } from 'firebase/firestore';

/**
 * Session automation functions for handling session lifecycle events
 * Integrates notifications, emails, and meeting management
 */
export class SessionAutomationService {
  
  /**
   * Handle new session creation - send notifications and emails
   */
  static async handleSessionCreated(session: Session): Promise<void> {
    try {
      console.log('Processing session creation:', session.id);
      
      // Get participant profile for email
      const participantProfile = await UserService.getUserProfile(session.participantId);
      if (!participantProfile) {
        console.error('Participant profile not found:', session.participantId);
        return;
      }

      // Create notification for participant
      await NotificationService.createNotification({
        userId: session.participantId,
        type: 'session_request',
        title: 'New Session Request',
        message: `${session.organizerName} wants to schedule a ${session.sessionType} session with you for ${session.skillName}`,
        data: {
          sessionId: session.id,
          organizerId: session.organizerId,
          skillName: session.skillName,
          sessionType: session.sessionType
        }
      });

      // Send email notification to participant
      if (participantProfile.email) {
        await EmailService.sendSessionRequestEmail(
          session,
          participantProfile.email,
          participantProfile.displayName || 'User'
        );
      }

      console.log('Session creation notifications sent successfully');
    } catch (error) {
      console.error('Error handling session creation:', error);
    }
  }

  /**
   * Handle session confirmation - send notifications, emails, and setup meeting
   */
  static async handleSessionConfirmed(session: Session): Promise<void> {
    try {
      console.log('Processing session confirmation:', session.id);
      
      // Get both user profiles
      const [organizerProfile, participantProfile] = await Promise.all([
        UserService.getUserProfile(session.organizerId),
        UserService.getUserProfile(session.participantId)
      ]);

      if (!organizerProfile || !participantProfile) {
        console.error('User profiles not found');
        return;
      }

      // Create notifications for both users
      await Promise.all([
        NotificationService.createNotification({
          userId: session.organizerId,
          type: 'session_confirmed',
          title: 'Session Confirmed',
          message: `${participantProfile.displayName} accepted your session request for ${session.skillName}`,
          data: {
            sessionId: session.id,
            participantId: session.participantId,
            skillName: session.skillName
          }
        }),
        NotificationService.createNotification({
          userId: session.participantId,
          type: 'session_confirmed',
          title: 'Session Confirmed',
          message: `Your session with ${organizerProfile.displayName} for ${session.skillName} is confirmed`,
          data: {
            sessionId: session.id,
            organizerId: session.organizerId,
            skillName: session.skillName
          }
        })
      ]);

      // Send confirmation emails to both users
      await Promise.all([
        organizerProfile.email ? EmailService.sendSessionConfirmationEmail(
          session,
          organizerProfile.email,
          organizerProfile.displayName || 'User',
          true // isOrganizer
        ) : Promise.resolve(),
        participantProfile.email ? EmailService.sendSessionConfirmationEmail(
          session,
          participantProfile.email,
          participantProfile.displayName || 'User',
          false // isOrganizer
        ) : Promise.resolve()
      ]);

      // Schedule session reminders
      await this.scheduleSessionReminders(session, organizerProfile, participantProfile);

      console.log('Session confirmation notifications sent successfully');
    } catch (error) {
      console.error('Error handling session confirmation:', error);
    }
  }

  /**
   * Handle session cancellation - send notifications and emails
   */
  static async handleSessionCancelled(session: Session, cancelledBy: string): Promise<void> {
    try {
      console.log('Processing session cancellation:', session.id);
      
      // Get both user profiles
      const [organizerProfile, participantProfile] = await Promise.all([
        UserService.getUserProfile(session.organizerId),
        UserService.getUserProfile(session.participantId)
      ]);

      if (!organizerProfile || !participantProfile) {
        console.error('User profiles not found');
        return;
      }

      const cancellerName = cancelledBy === session.organizerId 
        ? organizerProfile.displayName 
        : participantProfile.displayName;
      
      const otherUserId = cancelledBy === session.organizerId 
        ? session.participantId 
        : session.organizerId;
      
      const otherUserProfile = cancelledBy === session.organizerId 
        ? participantProfile 
        : organizerProfile;

      // Create notification for the other user
      await NotificationService.createNotification({
        userId: otherUserId,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: `${cancellerName} cancelled the session for ${session.skillName}`,
        data: {
          sessionId: session.id,
          cancelledBy,
          skillName: session.skillName
        }
      });

      // Send cancellation email to the other user
      if (otherUserProfile.email) {
        await EmailService.sendSessionCancellationEmail(
          session,
          otherUserProfile.email,
          otherUserProfile.displayName || 'User',
          cancellerName || 'Someone'
        );
      }

      // Deactivate meeting room if it exists
      if (session.meetingId) {
        try {
          await MeetingService.deactivateMeetingRoom(session.meetingId);
        } catch (error) {
          console.error('Error deactivating meeting room:', error);
        }
      }

      console.log('Session cancellation notifications sent successfully');
    } catch (error) {
      console.error('Error handling session cancellation:', error);
    }
  }

  /**
   * Handle session completion - cleanup and notifications
   */
  static async handleSessionCompleted(session: Session): Promise<void> {
    try {
      console.log('Processing session completion:', session.id);
      
      // Get both user profiles
      const [organizerProfile, participantProfile] = await Promise.all([
        UserService.getUserProfile(session.organizerId),
        UserService.getUserProfile(session.participantId)
      ]);

      if (!organizerProfile || !participantProfile) {
        console.error('User profiles not found');
        return;
      }

      // Create completion notifications
      await Promise.all([
        NotificationService.createNotification({
          userId: session.organizerId,
          type: 'session_completed',
          title: 'Session Completed',
          message: `Your session with ${participantProfile.displayName} for ${session.skillName} has been completed`,
          data: {
            sessionId: session.id,
            skillName: session.skillName
          }
        }),
        NotificationService.createNotification({
          userId: session.participantId,
          type: 'session_completed',
          title: 'Session Completed',
          message: `Your session with ${organizerProfile.displayName} for ${session.skillName} has been completed`,
          data: {
            sessionId: session.id,
            skillName: session.skillName
          }
        })
      ]);

      // Deactivate meeting room if it exists
      if (session.meetingId) {
        try {
          await MeetingService.deactivateMeetingRoom(session.meetingId);
        } catch (error) {
          console.error('Error deactivating meeting room:', error);
        }
      }

      // Clean up old notifications (optional)
      await this.cleanupSessionNotifications(session.id);

      console.log('Session completion processed successfully');
    } catch (error) {
      console.error('Error handling session completion:', error);
    }
  }

  /**
   * Send session reminders based on timing
   */
  static async sendSessionReminder(session: Session, timingType: '24h' | '1h'): Promise<void> {
    try {
      console.log(`Sending ${timingType} reminder for session:`, session.id);
      
      // Get both user profiles
      const [organizerProfile, participantProfile] = await Promise.all([
        UserService.getUserProfile(session.organizerId),
        UserService.getUserProfile(session.participantId)
      ]);

      if (!organizerProfile || !participantProfile) {
        console.error('User profiles not found');
        return;
      }

      const reminderTitle = timingType === '24h' 
        ? 'Session Tomorrow' 
        : 'Session Starting Soon';
      
      const reminderMessage = timingType === '24h'
        ? `Your ${session.sessionType} session for ${session.skillName} is tomorrow`
        : `Your ${session.sessionType} session for ${session.skillName} starts in 1 hour`;

      // Create reminder notifications for both users
      await Promise.all([
        NotificationService.createNotification({
          userId: session.organizerId,
          type: 'session_reminder',
          title: reminderTitle,
          message: `${reminderMessage} with ${participantProfile.displayName}`,
          data: {
            sessionId: session.id,
            skillName: session.skillName,
            timing: timingType
          }
        }),
        NotificationService.createNotification({
          userId: session.participantId,
          type: 'session_reminder',
          title: reminderTitle,
          message: `${reminderMessage} with ${organizerProfile.displayName}`,
          data: {
            sessionId: session.id,
            skillName: session.skillName,
            timing: timingType
          }
        })
      ]);

      // Send reminder emails
      await Promise.all([
        organizerProfile.email ? EmailService.sendSessionReminderEmail(
          session,
          organizerProfile.email,
          organizerProfile.displayName || 'User',
          true // isOrganizer
        ) : Promise.resolve(),
        participantProfile.email ? EmailService.sendSessionReminderEmail(
          session,
          participantProfile.email,
          participantProfile.displayName || 'User',
          false // isOrganizer
        ) : Promise.resolve()
      ]);

      console.log(`${timingType} reminder sent successfully`);
    } catch (error) {
      console.error(`Error sending ${timingType} reminder:`, error);
    }
  }

  /**
   * Schedule session reminders (would be called by a scheduler/cron job)
   */
  private static async scheduleSessionReminders(
    session: Session,
    organizerProfile: any,
    participantProfile: any
  ): Promise<void> {
    try {
      const sessionDate = session.scheduledDate.toDate();
      const now = new Date();
      
      // Calculate time differences
      const timeDiff = sessionDate.getTime() - now.getTime();
      const hoursUntil = timeDiff / (1000 * 60 * 60);
      
      // If session is more than 24 hours away, we could schedule a 24h reminder
      // This would typically be handled by a background job scheduler
      // For now, we'll just log the scheduling intent
      
      if (hoursUntil > 24) {
        console.log(`Would schedule 24h reminder for session ${session.id}`);
        // In a real implementation, you'd schedule a job for 24h before
      }
      
      if (hoursUntil > 1) {
        console.log(`Would schedule 1h reminder for session ${session.id}`);
        // In a real implementation, you'd schedule a job for 1h before
      }
      
      // For demonstration, if session is within reminder windows, send immediately
      if (hoursUntil <= 24 && hoursUntil > 1) {
        // Could send 24h reminder now if appropriate
        console.log('Session is within 24h window');
      }
      
      if (hoursUntil <= 1 && hoursUntil > 0) {
        // Send 1h reminder now
        await this.sendSessionReminder(session, '1h');
      }
      
    } catch (error) {
      console.error('Error scheduling session reminders:', error);
    }
  }

  /**
   * Clean up old notifications related to a session
   */
  private static async cleanupSessionNotifications(sessionId: string): Promise<void> {
    try {
      // This would clean up old notifications related to the session
      // Implementation depends on your cleanup strategy
      console.log(`Would clean up notifications for session ${sessionId}`);
    } catch (error) {
      console.error('Error cleaning up session notifications:', error);
    }
  }

  /**
   * Auto-start sessions when time arrives (would be called by scheduler)
   */
  static async autoStartSessions(): Promise<void> {
    try {
      const now = new Date();
      
      // Get sessions that should be starting now (within 5-minute window)
      // This would be called by a scheduled job every few minutes
      console.log('Checking for sessions to auto-start...');
      
      // In a real implementation, you'd:
      // 1. Query confirmed sessions where scheduledDate is within the next 5 minutes
      // 2. Update their status to 'in-progress'
      // 3. Send start notifications
      
    } catch (error) {
      console.error('Error auto-starting sessions:', error);
    }
  }

  /**
   * Auto-complete sessions after they end (would be called by scheduler)
   */
  static async autoCompleteSessions(): Promise<void> {
    try {
      const now = new Date();
      
      // Get in-progress sessions that should be completed
      // (scheduledDate + duration has passed)
      console.log('Checking for sessions to auto-complete...');
      
      // In a real implementation, you'd:
      // 1. Query in-progress sessions where scheduledDate + duration < now
      // 2. Update their status to 'completed'
      // 3. Clean up resources
      
    } catch (error) {
      console.error('Error auto-completing sessions:', error);
    }
  }

  /**
   * Main session event handler - routes events to appropriate handlers
   */
  static async handleSessionEvent(
    sessionId: string,
    eventType: 'created' | 'confirmed' | 'cancelled' | 'completed',
    eventData?: any
  ): Promise<void> {
    try {
      const session = await SessionService.getSession(sessionId);
      if (!session) {
        console.error('Session not found:', sessionId);
        return;
      }

      switch (eventType) {
        case 'created':
          await this.handleSessionCreated(session);
          break;
        case 'confirmed':
          await this.handleSessionConfirmed(session);
          break;
        case 'cancelled':
          await this.handleSessionCancelled(session, eventData?.cancelledBy);
          break;
        case 'completed':
          await this.handleSessionCompleted(session);
          break;
        default:
          console.error('Unknown session event type:', eventType);
      }
    } catch (error) {
      console.error(`Error handling session event ${eventType}:`, error);
    }
  }
}

/**
 * Integration helpers for real-time features
 */
export class RealTimeIntegration {
  
  /**
   * Initialize real-time session monitoring
   */
  static initializeSessionMonitoring(userId: string, callback: (sessions: Session[]) => void): () => void {
    console.log('Initializing real-time session monitoring for user:', userId);
    
    // Subscribe to user's sessions
    return SessionService.subscribeToUserSessions(userId, (sessions) => {
      callback(sessions);
      
      // Check for sessions that need immediate attention
      sessions.forEach(session => {
        const now = new Date();
        const sessionTime = session.scheduledDate.toDate();
        const timeDiff = sessionTime.getTime() - now.getTime();
        const minutesUntil = timeDiff / (1000 * 60);
        
        // If session starts in 15 minutes and user hasn't been notified
        if (minutesUntil <= 15 && minutesUntil > 0 && session.status === 'confirmed') {
          console.log('Session starting soon, could trigger immediate notification');
        }
      });
    });
  }

  /**
   * Initialize real-time notification monitoring
   */
  static initializeNotificationMonitoring(
    userId: string, 
    callback: (notifications: any[]) => void
  ): () => void {
    console.log('Initializing real-time notification monitoring for user:', userId);
    
    return NotificationService.subscribeToNotifications(userId, (notifications) => {
      callback(notifications);
      
      // Handle new notifications (could trigger browser notifications)
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount > 0) {
        console.log(`User has ${unreadCount} unread notifications`);
        // Could trigger browser notification here
      }
    });
  }

  /**
   * Send browser/push notification
   */
  static async sendBrowserNotification(title: string, message: string, data?: any): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data
        });

        notification.onclick = () => {
          window.focus();
          if (data?.url) {
            window.location.href = data.url;
          }
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  }

  /**
   * Request notification permissions
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}
