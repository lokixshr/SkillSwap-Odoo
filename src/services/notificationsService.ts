import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Notification data model - Updated to match requirements
export interface NotificationData {
  id?: string;
  recipientId: string;
  senderId: string;
  senderName?: string;
  senderPhotoURL?: string;
  type: 'session_request' | 'connection_request' | 'connection_update';
  referenceId?: string; // ID of the related request/session
  status: 'unread' | 'read' | 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Timestamp;
  // Optional metadata for different notification types
  sessionId?: string;
  connectionId?: string;
  skillName?: string;
  additionalData?: Record<string, any>;
}

// Legacy support - keeping old interface for backwards compatibility
export interface LegacyNotificationData {
  id?: string;
  recipientId: string;
  senderId: string;
  senderName?: string;
  senderPhotoURL?: string;
  type: 'session_request' | 'connection_request';
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Timestamp;
  read: boolean;
  sessionId?: string;
  connectionId?: string;
  skillName?: string;
  additionalData?: Record<string, any>;
}

export class NotificationsService {
  private static COLLECTION = 'notifications';

  /**
   * Create a new notification
   */
  static async createNotification(
    notificationData: Omit<NotificationData, 'id' | 'createdAt'> & {status?: 'unread' | 'read' | 'pending' | 'accepted' | 'rejected', read?: boolean}
  ): Promise<string> {
    try {
      console.log('Creating notification:', notificationData);
      
      // Convert legacy format to new format if needed
      const cleanData = { ...notificationData } as Record<string, any>;
      if ('read' in cleanData) {
        cleanData.status = cleanData.read ? 'read' : 'unread';
        delete cleanData.read;
      }
      if (!cleanData.status) {
        cleanData.status = 'unread';
      }
      // Remove undefined values to avoid Firestore "Unsupported field value: undefined"
      const sanitizedData = Object.fromEntries(
        Object.entries(cleanData).filter(([, v]) => v !== undefined)
      );
      
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...sanitizedData,
        // Use client-side date for rule compatibility and to avoid sentinel validation issues
        createdAt: new Date() as any,
        read: sanitizedData.status === 'read' // Legacy compatibility
      });

      console.log('Notification created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create a session request notification
   */
  static async createSessionRequestNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    skillName: string,
    sessionId: string,
    senderPhotoURL?: string
  ): Promise<string> {
    const message = `${senderName} has requested a session for ${skillName}`;
    
    return this.createNotification({
      recipientId,
      senderId,
      senderName,
      senderPhotoURL,
      type: 'session_request',
      status: 'pending',
      message,
      sessionId,
      skillName
    });
  }

  /**
   * Create a connection request notification
   */
  static async createConnectionRequestNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    skillName: string,
    connectionId: string,
    senderPhotoURL?: string
  ): Promise<string> {
    const message = `${senderName} wants to connect with you for ${skillName}`;
    
    return this.createNotification({
      recipientId,
      senderId,
      senderName,
      senderPhotoURL,
      type: 'connection_request',
      status: 'pending',
      message,
      connectionId,
      skillName
    });
  }

  /**
   * Create a connection response (accepted/rejected) notification to the original sender
   */
  static async createConnectionResponseNotification(
    recipientId: string, // original sender who should receive this update
    responderId: string,
    responderName: string,
    connectionId: string,
    response: 'accepted' | 'rejected',
    responderPhotoURL?: string
  ): Promise<string> {
    const verb = response === 'accepted' ? 'accepted' : 'declined';
    const message = `${responderName} has ${verb} your connection request`;

    return this.createNotification({
      recipientId,
      senderId: responderId,
      senderName: responderName,
      senderPhotoURL: responderPhotoURL,
      type: 'connection_update',
      status: response,
      message,
      connectionId
    });
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: NotificationData[]) => void
  ) {
    console.log('Setting up notification subscription for user:', userId);
    
    const q = query(
      collection(db, this.COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];
      
      console.log(`Received ${notifications.length} notifications for user ${userId}`);
      callback(notifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
    });
  }

  /**
   * Subscribe to unread notifications only
   */
  static subscribeToUnreadNotifications(
    userId: string,
    callback: (notifications: NotificationData[]) => void
  ) {
    const q = query(
      collection(db, this.COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];
      
      callback(notifications);
    }, (error) => {
      console.error('Error in unread notifications subscription:', error);
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
      console.log(`Marked ${querySnapshot.docs.length} notifications as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Update notification status (accept/reject)
   */
  static async updateNotificationStatus(
    notificationId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        status,
        read: true // Mark as read when status is updated
      });
      console.log('Notification status updated:', notificationId, status);
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await deleteDoc(notificationRef);
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllUserNotifications(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${querySnapshot.docs.length} notifications for user ${userId}`);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw new Error('Failed to delete all notifications');
    }
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(
    userId: string,
    type: 'session_request' | 'connection_request' | 'connection_update'
  ): Promise<NotificationData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw new Error('Failed to get notifications by type');
    }
  }
}
