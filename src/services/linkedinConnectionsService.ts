import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// LinkedIn-style Connection Request data model
export interface LinkedInConnectionRequest {
  id?: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  message?: string;
}

// Notification data model for connection requests
export interface ConnectionNotification {
  id?: string;
  type: 'connection_request';
  fromUserId: string;
  toUserId: string;
  connectionId: string;
  read: boolean;
  createdAt: Timestamp;
  message?: string;
}

// Contact entry for accepted connections
export interface Contact {
  id?: string;
  userId1: string;
  userId2: string;
  connectionId: string;
  createdAt: Timestamp;
}

export class LinkedInConnectionsService {
  private static CONNECTIONS_COLLECTION = 'connections';
  private static NOTIFICATIONS_COLLECTION = 'notifications';
  private static CONTACTS_COLLECTION = 'contacts';

  /**
   * Send a LinkedIn-style connection request
   */
  static async sendConnectionRequest(data: {
    currentUserId: string;
    targetUserId: string;
    message?: string;
  }): Promise<string> {
    try {
      console.log('🔗 Sending LinkedIn-style connection request:', data);

      // Validate input
      if (!data.currentUserId || !data.targetUserId) {
        throw new Error('Both currentUserId and targetUserId are required');
      }

      if (data.currentUserId === data.targetUserId) {
        throw new Error('Cannot send connection request to yourself');
      }

      // Check if connection already exists
      const existingConnection = await this.checkExistingConnection(
        data.currentUserId, 
        data.targetUserId
      );

      if (existingConnection) {
        if (existingConnection.status === 'pending') {
          throw new Error('Connection request already sent');
        }
        if (existingConnection.status === 'accepted') {
          throw new Error('Already connected with this user');
        }
      }

      // Create connection request document
      const connectionData: Omit<LinkedInConnectionRequest, 'id'> = {
        senderId: data.currentUserId,
        receiverId: data.targetUserId,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        message: data.message || ''
      };

      // Use deterministic ID to prevent duplicates
      const connectionId = this.generateConnectionId(data.currentUserId, data.targetUserId);
      const connectionRef = doc(db, this.CONNECTIONS_COLLECTION, connectionId);

      console.log('📤 Creating connection document:', connectionData);
      
      // Create the connection request
      await setDoc(connectionRef, connectionData);
      console.log('✅ Connection request created with ID:', connectionId);

      // Create notification for the target user
      try {
        await this.createConnectionNotification({
          fromUserId: data.currentUserId,
          toUserId: data.targetUserId,
          connectionId: connectionId
        });
        console.log('✅ Notification created for target user');
      } catch (notificationError) {
        console.error('⚠️ Failed to create notification (connection still created):', notificationError);
      }

      return connectionId;

    } catch (error: any) {
      console.error('❌ Error sending connection request:', {
        error,
        code: error?.code,
        message: error?.message,
        data
      });

      // Provide user-friendly error messages
      if (error?.code === 'permission-denied') {
        throw new Error('You do not have permission to send connection requests. Please ensure you are logged in.');
      }

      // Re-throw with original message if it's already user-friendly
      if (error?.message && !error?.message.includes('Firebase') && !error?.message.includes('firestore')) {
        throw error;
      }

      throw new Error(`Failed to send connection request: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Accept or reject a connection request
   */
  static async respondToConnectionRequest(data: {
    connectionId: string;
    currentUserId: string;
    response: 'accepted' | 'rejected';
  }): Promise<void> {
    try {
      console.log('🔄 Responding to connection request:', data);

      const connectionRef = doc(db, this.CONNECTIONS_COLLECTION, data.connectionId);
      const connectionDoc = await getDoc(connectionRef);

      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }

      const connectionData = connectionDoc.data() as LinkedInConnectionRequest;

      // Verify user is the receiver
      if (connectionData.receiverId !== data.currentUserId) {
        throw new Error('You can only respond to connection requests sent to you');
      }

      // Verify request is still pending
      if (connectionData.status !== 'pending') {
        throw new Error(`Connection request is already ${connectionData.status}`);
      }

      // Update connection status
      await updateDoc(connectionRef, {
        status: data.response,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Connection status updated to:', data.response);

      // If accepted, create contact entries for both users
      if (data.response === 'accepted') {
        try {
          await this.createContactEntry({
            userId1: connectionData.senderId,
            userId2: connectionData.receiverId,
            connectionId: data.connectionId
          });
          console.log('✅ Contact entries created');
        } catch (contactError) {
          console.error('⚠️ Failed to create contact entries:', contactError);
          // Don't throw here - the connection was still accepted
        }
      }

      // Create response notification for the original sender
      try {
        await this.createResponseNotification({
          fromUserId: data.currentUserId,
          toUserId: connectionData.senderId,
          connectionId: data.connectionId,
          response: data.response
        });
        console.log('✅ Response notification sent');
      } catch (notificationError) {
        console.error('⚠️ Failed to send response notification:', notificationError);
      }

    } catch (error: any) {
      console.error('❌ Error responding to connection request:', {
        error,
        code: error?.code,
        message: error?.message,
        data
      });

      if (error?.code === 'permission-denied') {
        throw new Error('You do not have permission to respond to this connection request.');
      }

      if (error?.message && !error?.message.includes('Firebase') && !error?.message.includes('firestore')) {
        throw error;
      }

      throw new Error(`Failed to respond to connection request: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get connection requests for a user (sent and received)
   */
  static async getUserConnections(userId: string): Promise<{
    sent: LinkedInConnectionRequest[];
    received: LinkedInConnectionRequest[];
  }> {
    try {
      console.log('📊 Getting connections for user:', userId);

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('senderId', '==', userId),
          orderBy('createdAt', 'desc')
        )),
        getDocs(query(
          collection(db, this.CONNECTIONS_COLLECTION),
          where('receiverId', '==', userId),
          orderBy('createdAt', 'desc')
        ))
      ]);

      const sent = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LinkedInConnectionRequest[];

      const received = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LinkedInConnectionRequest[];

      console.log('✅ Retrieved connections:', { sent: sent.length, received: received.length });
      return { sent, received };

    } catch (error: any) {
      console.error('❌ Error getting user connections:', error);
      throw new Error(`Failed to get connections: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to real-time connection updates
   */
  static subscribeToConnections(
    userId: string,
    callback: (connections: { sent: LinkedInConnectionRequest[]; received: LinkedInConnectionRequest[] }) => void
  ): () => void {
    console.log('🔔 Setting up connection subscription for user:', userId);

    let sent: LinkedInConnectionRequest[] = [];
    let received: LinkedInConnectionRequest[] = [];

    const updateCallback = () => {
      callback({ sent, received });
    };

    // Subscribe to sent requests
    const unsubscribeSent = onSnapshot(
      query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        sent = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LinkedInConnectionRequest[];
        console.log('📨 Sent connections updated:', sent.length);
        updateCallback();
      },
      (error) => {
        console.error('❌ Error in sent connections subscription:', error);
      }
    );

    // Subscribe to received requests
    const unsubscribeReceived = onSnapshot(
      query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('receiverId', '==', userId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        received = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LinkedInConnectionRequest[];
        console.log('📥 Received connections updated:', received.length);
        updateCallback();
      },
      (error) => {
        console.error('❌ Error in received connections subscription:', error);
      }
    );

    // Return cleanup function
    return () => {
      console.log('🔌 Cleaning up connection subscriptions');
      unsubscribeSent();
      unsubscribeReceived();
    };
  }

  /**
   * Subscribe to connection notifications
   */
  static subscribeToConnectionNotifications(
    userId: string,
    callback: (notifications: ConnectionNotification[]) => void
  ): () => void {
    console.log('🔔 Setting up notification subscription for user:', userId);

    return onSnapshot(
      query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('toUserId', '==', userId),
        where('type', '==', 'connection_request'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConnectionNotification[];
        
        console.log('📢 Connection notifications updated:', notifications.length);
        callback(notifications);
      },
      (error) => {
        console.error('❌ Error in notifications subscription:', error);
      }
    );
  }

  // Helper methods
  private static generateConnectionId(userId1: string, userId2: string): string {
    // Create deterministic ID by sorting user IDs
    const [minId, maxId] = [userId1, userId2].sort();
    return `${minId}_${maxId}`;
  }

  private static async checkExistingConnection(
    userId1: string, 
    userId2: string
  ): Promise<LinkedInConnectionRequest | null> {
    const connectionId = this.generateConnectionId(userId1, userId2);
    const connectionDoc = await getDoc(doc(db, this.CONNECTIONS_COLLECTION, connectionId));
    
    if (connectionDoc.exists()) {
      return { id: connectionDoc.id, ...connectionDoc.data() } as LinkedInConnectionRequest;
    }
    
    return null;
  }

  private static async createConnectionNotification(data: {
    fromUserId: string;
    toUserId: string;
    connectionId: string;
  }): Promise<void> {
    const notificationData: Omit<ConnectionNotification, 'id'> = {
      type: 'connection_request',
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      connectionId: data.connectionId,
      read: false,
      createdAt: serverTimestamp() as Timestamp
    };

    await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), notificationData);
  }

  private static async createResponseNotification(data: {
    fromUserId: string;
    toUserId: string;
    connectionId: string;
    response: 'accepted' | 'rejected';
  }): Promise<void> {
    const notificationData = {
      type: 'connection_response',
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      connectionId: data.connectionId,
      response: data.response,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), notificationData);
  }

  private static async createContactEntry(data: {
    userId1: string;
    userId2: string;
    connectionId: string;
  }): Promise<void> {
    const contactData: Omit<Contact, 'id'> = {
      userId1: data.userId1 < data.userId2 ? data.userId1 : data.userId2, // Consistent ordering
      userId2: data.userId1 < data.userId2 ? data.userId2 : data.userId1,
      connectionId: data.connectionId,
      createdAt: serverTimestamp() as Timestamp
    };

    await addDoc(collection(db, this.CONTACTS_COLLECTION), contactData);
  }
}
