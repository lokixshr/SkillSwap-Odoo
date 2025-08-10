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
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationsService } from './notificationsService';
import { UserService } from '@/lib/database';
import { handleFirebaseOperation, createUserErrorMessage, isPermissionError, logFirebaseError } from '@/lib/firebaseErrorHandler';

// Connection Request data model
export interface ConnectionRequest {
  id?: string;
  senderId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  skillName?: string;
  message?: string;
  senderName?: string;
  senderPhotoURL?: string;
  recipientName?: string;
}

// Friends relationship model
export interface Friend {
  id?: string;
  userId1: string;
  userId2: string;
  createdAt: Timestamp;
  connectionRequestId: string;
}

export class ConnectionsService {
  private static CONNECTIONS_COLLECTION = 'connections';
  private static FRIENDS_COLLECTION = 'friends';

  /**
   * Create a new connection request (LinkedIn-like functionality)
   */
  static async createConnectionRequest(data: {
    recipientId: string;
    senderId: string;
    skillName?: string;
    message?: string;
  }): Promise<string> {
    try {
      console.log('Creating connection request:', data);
      
      // Validate input data
      if (!data.recipientId || !data.senderId) {
        throw new Error('Sender and recipient IDs are required');
      }

      if (data.senderId === data.recipientId) {
        throw new Error('Cannot connect to yourself');
      }

      // Check if connection already exists (both directions)
      const existingConnection = await this.getExistingConnection(data.senderId, data.recipientId);
      if (existingConnection) {
        if (existingConnection.status === 'pending') {
          throw new Error('Connection request already exists');
        } else if (existingConnection.status === 'accepted') {
          throw new Error('You are already connected with this user');
        }
      }

      // Get sender and recipient profiles with retry logic
      let senderProfile, recipientProfile;
      let retries = 3;
      
      while (retries > 0) {
        try {
          [senderProfile, recipientProfile] = await Promise.all([
            UserService.getUserProfile(data.senderId),
            UserService.getUserProfile(data.recipientId)
          ]);
          break;
        } catch (profileError) {
          retries--;
          console.warn(`Profile fetch attempt failed, ${retries} retries left:`, profileError);
          if (retries === 0) throw new Error('Failed to load user profiles');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!senderProfile || !recipientProfile) {
        throw new Error('User profiles not found');
      }

      const connectionData: Omit<ConnectionRequest, 'id'> & { userA: string; userB: string } & { userId: string; connectedUserId: string } = {
        // Existing fields retained for backward compatibility with current UI/queries
        senderId: data.senderId,
        recipientId: data.recipientId,
        // New participant fields to satisfy updated Firestore rules
        userA: data.senderId, // current user
        userB: data.recipientId, // target user
        status: 'pending',
        createdAt: new Date() as any,
        skillName: data.skillName || 'general connection',
        message: data.message || '',
        senderName: senderProfile.displayName || 'Unknown User',
        senderPhotoURL: senderProfile.photoURL || '',
        recipientName: recipientProfile.displayName || 'Unknown User',
        // Backward-compatible fields for stricter rulesets
        userId: data.senderId,
        connectedUserId: data.recipientId,
      };

      // Deterministic document ID to satisfy rules and prevent duplicates
      const [minId, maxId] = [data.senderId, data.recipientId].sort();
      const connectionId = `${minId}_${maxId}`;
      
      console.log('🔑 Connection ID generation:', {
        senderId: data.senderId,
        recipientId: data.recipientId,
        minId,
        maxId,
        connectionId,
        expectedFormat: `${minId}_${maxId}`
      });

      // Check if an existing pending/accepted/rejected connection already exists (defensive)
      const docRef = doc(db, this.CONNECTIONS_COLLECTION, connectionId);
      console.log('🔍 Checking for existing document at path:', docRef.path);
      const existingDoc = await getDoc(docRef);
      if (existingDoc.exists()) {
        const existing = existingDoc.data() as ConnectionRequest;
        if (existing.status === 'pending') {
          throw new Error('A pending connection already exists between these users');
        } else if (existing.status === 'accepted') {
          throw new Error('Users are already connected');
        } else if (existing.status === 'rejected') {
          // Re-open previously rejected request by updating the document (per rules)
          await updateDoc(docRef, {
            senderId: data.senderId,
            recipientId: data.recipientId,
            userA: data.senderId,
            userB: data.recipientId,
            userId: data.senderId,
            connectedUserId: data.recipientId,
            status: 'pending',
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
            skillName: data.skillName,
            message: data.message,
            senderName: senderProfile.displayName,
            senderPhotoURL: senderProfile.photoURL,
            recipientName: recipientProfile.displayName
          } as any);

          // Create notification for recipient with error handling
          try {
            await NotificationsService.createConnectionRequestNotification(
              data.recipientId,
              data.senderId,
              senderProfile.displayName,
              data.skillName || 'general connection',
              docRef.id,
              senderProfile.photoURL
            );
          } catch (notificationError) {
            console.error('Failed to create notification (reopen), but connection was updated:', notificationError);
          }

          console.log('Re-opened previously rejected connection with ID:', docRef.id);
          return docRef.id;
        }
      }

      // Log the data being sent to Firestore for debugging
      console.log('📤 Final connection data being sent to Firestore:', {
        ...connectionData,
        docId: connectionId,
        path: docRef.path
      });

      // Direct set (ID is deterministic and single write)
      try {
        await setDoc(docRef, connectionData);
        console.log('✅ Document created successfully via setDoc');
      } catch (batchError) {
        console.error('❌ Batch write failed:', {
          error: batchError,
          errorCode: batchError.code,
          errorMessage: batchError.message,
          connectionData,
          docId: connectionId,
          path: docRef.path
        });
        
        // Check if it's a permission error
        if (batchError.code === 'permission-denied') {
          throw new Error(`Permission denied: Cannot create connection. Check Firestore rules. Data: senderId=${data.senderId}, recipientId=${data.recipientId}`);
        }
        
        throw batchError;
      }

      // Create notification for recipient with error handling
      try {
        await NotificationsService.createConnectionRequestNotification(
          data.recipientId,
          data.senderId,
          senderProfile.displayName,
          data.skillName || 'general connection',
          docRef.id,
          senderProfile.photoURL
        );
      } catch (notificationError) {
        console.error('Failed to create notification, but connection was created:', notificationError);
        // Continue since the connection was created successfully
      }

      console.log('✅ Connection request created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating connection request:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        inputData: data
      });
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error(`Permission denied: Missing or insufficient permissions to create connection request. Please check authentication and Firestore rules.`);
      }
      
      throw new Error(`Failed to create connection request: ${error.message}`);
    }
  }

  /**
   * Check if connection already exists between two users
   */
  static async getExistingConnection(userId1: string, userId2: string): Promise<ConnectionRequest | null> {
    try {
      const q = query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('senderId', '==', userId1),
        where('recipientId', '==', userId2)
      );

      const q2 = query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('senderId', '==', userId2),
        where('recipientId', '==', userId1)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q), getDocs(q2)]);
      
      if (!snapshot1.empty) {
        return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } as ConnectionRequest;
      }
      if (!snapshot2.empty) {
        return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as ConnectionRequest;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing connection:', error);
      return null;
    }
  }

  /**
   * Update connection request status
   */
  static async updateConnectionStatus(
    connectionId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    return handleFirebaseOperation(async () => {
      const connectionRef = doc(db, this.CONNECTIONS_COLLECTION, connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }

      const connectionData = connectionDoc.data() as ConnectionRequest;

      // Update connection status
      await updateDoc(connectionRef, {
        status,
        updatedAt: new Date() as any
      });

      // If accepted, add users to friends collection and ensure a conversation exists
      if (status === 'accepted') {
        await this.addToFriends(connectionData.senderId, connectionData.recipientId, connectionId);
        try {
          await this.ensureConversation(
            connectionData.senderId,
            connectionData.recipientId,
            connectionData.senderName,
            connectionData.senderPhotoURL,
            connectionData.recipientName
          );
        } catch (convErr) {
          console.error('Failed to ensure conversation after accepting connection (will not block acceptance):', convErr);
        }
      }

      // Notify original sender about the response
      try {
        await NotificationsService.createConnectionResponseNotification(
          connectionData.senderId, // recipient of the update notification
          connectionData.recipientId, // responder
          connectionData.recipientName || 'User',
          connectionId,
          status
        );
      } catch (notifyErr) {
        console.error('Failed to create connection response notification:', notifyErr);
      }

      console.log('Connection status updated:', connectionId, status);
    }, 'update connection status', { connectionId, status });
  }

  /**
   * Add users to friends collection
   */
  private static async addToFriends(userId1: string, userId2: string, connectionRequestId: string): Promise<void> {
    try {
      const friendData: Omit<Friend, 'id'> = {
        userId1: userId1 < userId2 ? userId1 : userId2, // Consistent ordering
        userId2: userId1 < userId2 ? userId2 : userId1,
        createdAt: new Date() as any,
        connectionRequestId
      };

      await addDoc(collection(db, this.FRIENDS_COLLECTION), friendData);
      console.log('Users added to friends collection:', userId1, userId2);
    } catch (error) {
      console.error('Error adding to friends:', error);
      throw new Error('Failed to add to friends');
    }
  }

  /**
   * Ensure a conversation document exists for two users (created if missing)
   */
  private static async ensureConversation(
    userId1: string,
    userId2: string,
    user1Name?: string,
    user1Photo?: string,
    user2Name?: string,
    user2Photo?: string
  ): Promise<string> {
    try {
      const [minId, maxId] = [userId1, userId2].sort();
      const conversationId = `${minId}_${maxId}`;
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        const conversationData = {
          participants: [userId1, userId2],
          participantNames: {
            [userId1]: user1Name || 'User',
            [userId2]: user2Name || 'User',
          },
          participantPhotos: {
            [userId1]: user1Photo || '',
            [userId2]: user2Photo || '',
          },
          unreadCounts: {
            [userId1]: 0,
            [userId2]: 0,
          },
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          isActive: true,
        } as any;
        await setDoc(conversationRef, conversationData);
        console.log('Created conversation for connected users:', conversationId);
      }

      return conversationId;
    } catch (error) {
      console.error('Error ensuring conversation for users:', { userId1, userId2, error });
      throw error;
    }
  }

  /**
   * Get user's connection requests (sent and received)
   */
  static async getUserConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      // Get sent requests
      const sentQuery = query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Get received requests
      const receivedQuery = query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const sentRequests = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];

      const receivedRequests = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];

      return [...sentRequests, ...receivedRequests].sort((a, b) => 
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
    } catch (error) {
      console.error('Error getting user connection requests:', error);
      throw new Error('Failed to get connection requests');
    }
  }

  /**
   * Get pending connection requests for user (received only)
   */
  static async getPendingConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    try {
      const q = query(
        collection(db, this.CONNECTIONS_COLLECTION),
        where('recipientId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];
    } catch (error) {
      console.error('Error getting pending connection requests:', error);
      throw new Error('Failed to get pending connection requests');
    }
  }

  /**
   * Get user's friends
   */
  static async getUserFriends(userId: string): Promise<Friend[]> {
    try {
      const q = query(
        collection(db, this.FRIENDS_COLLECTION),
        where('userId1', '==', userId)
      );

      const q2 = query(
        collection(db, this.FRIENDS_COLLECTION),
        where('userId2', '==', userId)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q), getDocs(q2)]);

      const friends1 = snapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friend[];

      const friends2 = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friend[];

      return [...friends1, ...friends2];
    } catch (error) {
      console.error('Error getting user friends:', error);
      throw new Error('Failed to get user friends');
    }
  }

  /**
   * Subscribe to connection requests in real-time
   */
  static subscribeToConnectionRequests(
    userId: string,
    callback: (connections: ConnectionRequest[]) => void
  ) {
    console.log('Setting up connection requests subscription for user:', userId);

    // Subscribe to sent requests
    const sentQuery = query(
      collection(db, this.CONNECTIONS_COLLECTION),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Subscribe to received requests
    const receivedQuery = query(
      collection(db, this.CONNECTIONS_COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    let sentConnections: ConnectionRequest[] = [];
    let receivedConnections: ConnectionRequest[] = [];

    const updateConnections = () => {
      const allConnections = [...sentConnections, ...receivedConnections].sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
      callback(allConnections);
    };

    const unsubscribeSent = onSnapshot(sentQuery, (querySnapshot) => {
      sentConnections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];
      updateConnections();
    });

    const unsubscribeReceived = onSnapshot(receivedQuery, (querySnapshot) => {
      receivedConnections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConnectionRequest[];
      updateConnections();
    });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }

  /**
   * Subscribe to user's friends in real-time
   */
  static subscribeToUserFriends(
    userId: string,
    callback: (friends: Friend[]) => void
  ) {
    const q1 = query(
      collection(db, this.FRIENDS_COLLECTION),
      where('userId1', '==', userId)
    );

    const q2 = query(
      collection(db, this.FRIENDS_COLLECTION),
      where('userId2', '==', userId)
    );

    let friends1: Friend[] = [];
    let friends2: Friend[] = [];

    const updateFriends = () => {
      callback([...friends1, ...friends2]);
    };

    const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
      friends1 = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friend[];
      updateFriends();
    });

    const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
      friends2 = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friend[];
      updateFriends();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }

  /**
   * Check if users are friends
   */
  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const [smallerId, largerId] = [userId1, userId2].sort();
      const q = query(
        collection(db, this.FRIENDS_COLLECTION),
        where('userId1', '==', smallerId),
        where('userId2', '==', largerId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  }

  /**
   * Delete connection request
   */
  static async deleteConnectionRequest(connectionId: string): Promise<void> {
    try {
      const connectionRef = doc(db, this.CONNECTIONS_COLLECTION, connectionId);
      await updateDoc(connectionRef, {
        status: 'rejected',
        updatedAt: new Date() as any
      });
      console.log('Connection request deleted:', connectionId);
    } catch (error) {
      console.error('Error deleting connection request:', error);
      throw new Error('Failed to delete connection request');
    }
  }
}
