import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsService, NotificationData } from '@/services/notificationsService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      // Subscribe to real-time notifications
      unsubscribe = NotificationsService.subscribeToUserNotifications(user.uid, (updatedNotifications) => {
        setNotifications(updatedNotifications);
        
        // Calculate unread count (check both 'read' field and 'status' field for compatibility)
        const unread = updatedNotifications.filter(n => {
          // Support both legacy 'read' field and new 'status' field
          if ('read' in n && typeof n.read === 'boolean') {
            return !n.read;
          }
          return n.status === 'unread' || (!n.status && !n.read);
        }).length;
        
        setUnreadCount(unread);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up notifications subscription:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationsService.markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw new Error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) {
      throw new Error('User must be authenticated');
    }

    try {
      await NotificationsService.markAllAsRead(user.uid);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw new Error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationsService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw new Error('Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    if (!user?.uid) {
      throw new Error('User must be authenticated');
    }

    try {
      await NotificationsService.deleteAllUserNotifications(user.uid);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      throw new Error('Failed to delete all notifications');
    }
  };

  const updateNotificationStatus = async (notificationId: string, status: 'accepted' | 'rejected') => {
    try {
      await NotificationsService.updateNotificationStatus(notificationId, status);
    } catch (err) {
      console.error('Error updating notification status:', err);
      throw new Error('Failed to update notification status');
    }
  };

  // Helper functions to filter notifications
  const getUnreadNotifications = () => {
    return notifications.filter(n => {
      if ('read' in n && typeof n.read === 'boolean') {
        return !n.read;
      }
      return n.status === 'unread' || (!n.status && !n.read);
    });
  };

  const getReadNotifications = () => {
    return notifications.filter(n => {
      if ('read' in n && typeof n.read === 'boolean') {
        return n.read;
      }
      return n.status === 'read';
    });
  };

  const getNotificationsByType = (type: 'session_request' | 'connection_request') => {
    return notifications.filter(n => n.type === type);
  };

  const getConnectionRequestNotifications = () => {
    return notifications.filter(n => n.type === 'connection_request');
  };

  const getSessionRequestNotifications = () => {
    return notifications.filter(n => n.type === 'session_request');
  };

  const getPendingNotifications = () => {
    return notifications.filter(n => 
      n.status === 'pending' || 
      (!n.status && !n.read) // Legacy support
    );
  };

  const getRecentNotifications = (limit: number = 10) => {
    return notifications.slice(0, limit);
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updateNotificationStatus,
    getUnreadNotifications,
    getReadNotifications,
    getNotificationsByType,
    getConnectionRequestNotifications,
    getSessionRequestNotifications,
    getPendingNotifications,
    getRecentNotifications,
  };
};
