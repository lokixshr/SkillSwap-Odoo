import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User } from 'firebase/auth';

// Type definitions for our data models
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  skillsToTeach: string[];
  skillsToLearn: string[];
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rating?: number;
  totalConnections?: number;
  totalHours?: number;
}

export interface SkillPost {
  id?: string;
  ownerId: string; // Required for security rules
  userId: string; // Keep for backward compatibility
  userDisplayName: string;
  userPhotoURL?: string;
  skillName: string;
  description: string;
  type: 'learn' | 'teach';
  level: 'beginner' | 'intermediate' | 'advanced';
  timestamp: Timestamp;
  createdAt: Date; // Required for security rules
  isActive: boolean;
  tags?: string[];
}

export interface Connection {
  id?: string;
  senderId: string; // Required for security rules
  recipientId: string; // Required for security rules
  userId?: string; // Backward compatibility (optional)
  connectedUserId?: string; // Backward compatibility (optional)
  skillName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timestamp: Timestamp;
  createdAt: Date; // Required for security rules
  message?: string;
  senderName?: string;
  senderPhotoURL?: string;
  recipientName?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
  conversationId?: string; // Added conversationId
}

// Session Scheduling Interfaces
export interface Session {
  id?: string;
  organizerId: string; // User who created the session
  participantId: string; // User who will join the session
  organizerName: string;
  participantName: string;
  organizerPhotoURL?: string;
  participantPhotoURL?: string;
  skillName: string;
  description?: string;
  sessionType: 'video' | 'phone' | 'in-person';
  scheduledDate: Timestamp;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  meetingLink?: string; // Generated meeting link for video/phone calls
  meetingId?: string; // Meeting room ID
  location?: string; // For in-person sessions
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Notification System
export interface Notification {
  id?: string;
  senderId: string; // Required for security rules
  recipientId: string; // Required for security rules
  userId: string; // Keep for backward compatibility
  receiverId?: string; // Keep for backward compatibility
  type: 'session_request' | 'session_confirmed' | 'session_reminder' | 'call_invitation' | 'general';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean; // Required for security rules
  isRead: boolean; // Keep for backward compatibility
  priority: 'low' | 'medium' | 'high';
  relatedSessionId?: string;
  relatedUserId?: string;
  createdAt: Date; // Required for security rules
  expiresAt?: Timestamp;
}

// Meeting Link Generation
export interface MeetingRoom {
  id?: string;
  sessionId: string;
  roomId: string;
  meetingUrl: string;
  provider: 'jitsi' | 'daily' | 'google_meet' | 'zoom';
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  hostUserId: string;
  guestUserId: string;
}

/**
 * User Profile Management
 */
export class UserService {
  private static COLLECTION = 'users';

  /**
   * Create or update user profile
   */
  static async createOrUpdateUser(user: User, profileData?: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, user.uid);
      const userDoc = await getDoc(userRef);

      const userData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        skillsToTeach: [],
        skillsToLearn: [],
        isPublic: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        ...profileData
      };

             if (userDoc.exists()) {
         // Update existing user
         await updateDoc(userRef, {
           ...userData,
           updatedAt: new Date() as any
         });
       } else {
         // Create new user
         await setDoc(userRef, userData);
       }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user profile');
    }
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, this.COLLECTION, uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Update user skills
   */
  static async updateUserSkills(uid: string, skillsToTeach: string[], skillsToLearn: string[]): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, uid);
      await updateDoc(userRef, {
        skillsToTeach,
        skillsToLearn,
        updatedAt: new Date() as any
      });
    } catch (error) {
      console.error('Error updating user skills:', error);
      throw new Error('Failed to update user skills');
    }
  }

  /**
   * Listen to user profile changes in real-time
   */
  static subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const userRef = doc(db, this.COLLECTION, uid);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Search users by displayName or email (prefix match, case-insensitive)
   */
  static async searchUsers(queryStr: string, limitCount = 10): Promise<UserProfile[]> {
    if (!queryStr.trim()) return [];
    const q = query(
      collection(db, this.COLLECTION),
      // Firestore does not support case-insensitive search, so we use lower-case fields in production
      // For now, we do prefix match on displayName and email
      // This will only match from the start of the string
      // For more advanced search, use Algolia or similar
      // Here, we do two queries and merge results
      // 1. displayName >= queryStr && displayName < queryStr + \uf8ff
      // 2. email >= queryStr && email < queryStr + \uf8ff
      // We'll just do displayName for now for performance
      orderBy('displayName'),
      // Firestore does not support OR queries, so for demo, just do displayName
      // For production, use a search index
      // For now, do prefix match
      // For case-insensitive, store displayName_lower in user doc
      // where('displayName', '>=', queryStr),
      // where('displayName', '<=', queryStr + '\uf8ff'),
      // For now, just get all users and filter in JS (not scalable, but works for demo)
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => doc.data() as UserProfile)
      .filter(user =>
        user.displayName?.toLowerCase().startsWith(queryStr.toLowerCase()) ||
        user.email?.toLowerCase().startsWith(queryStr.toLowerCase())
      );
  }
}

/**
 * Helper functions for creating posts with required fields
 */
export class SecureWriteHelpers {
  /**
   * Create a learn post with all required security fields
   */
  static async createLearnPost(data: {
    skillName: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    userDisplayName: string;
    userPhotoURL?: string;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a skill post');
    }

    return SkillPostService.createSkillPost({
      ...data,
      type: 'learn',
      userId: currentUser.uid, // Will be overridden in createSkillPost but needed for type compatibility
      isActive: true // Will be set in createSkillPost but needed for type compatibility
    });
  }

  /**
   * Create a teach post with all required security fields
   */
  static async createTeachPost(data: {
    skillName: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    userDisplayName: string;
    userPhotoURL?: string;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a skill post');
    }

    return SkillPostService.createSkillPost({
      ...data,
      type: 'teach',
      userId: currentUser.uid, // Will be overridden in createSkillPost but needed for type compatibility
      isActive: true // Will be set in createSkillPost but needed for type compatibility
    });
  }

  /**
   * Create a connection with all required security fields
   */
  static async createConnection(data: {
    recipientId: string;
    skillName: string;
    message?: string;
    senderName?: string;
    senderPhotoURL?: string;
    recipientName?: string;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a connection');
    }

    return ConnectionService.createConnection({
      ...data,
      userId: currentUser.uid, // For backward compatibility
      connectedUserId: data.recipientId, // For backward compatibility
      status: 'pending' as const // Will be set in createConnection but needed for type compatibility
    });
  }

  /**
   * Create a notification with all required security fields
   */
  static async createNotification(data: {
    recipientId: string;
    message: string;
    type: 'session_request' | 'session_confirmed' | 'session_reminder' | 'call_invitation' | 'general';
    title: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high';
    relatedSessionId?: string;
    relatedUserId?: string;
    expiresAt?: Timestamp;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a notification');
    }

    return NotificationService.createNotification({
      ...data,
      userId: data.recipientId, // For backward compatibility
      receiverId: data.recipientId, // For backward compatibility
      isRead: false, // For backward compatibility
      priority: data.priority || 'medium'
    });
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    return NotificationService.markAsRead(notificationId);
  }
}

/**
 * Skill Posts Management
 */
export class SkillPostService {
  private static COLLECTION = 'skill_posts';

  /**
   * Create a new skill post
   */
  static async createSkillPost(postData: Omit<SkillPost, 'id' | 'timestamp' | 'ownerId' | 'createdAt'>): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to create a skill post');
      }

      const postRef = await addDoc(collection(db, this.COLLECTION), {
        ...postData,
        ownerId: currentUser.uid,
        userId: currentUser.uid, // Keep for backward compatibility
        timestamp: serverTimestamp(),
        createdAt: new Date(),
        isActive: true
      });

      // Update user's skills arrays - check if user exists first
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        if (postData.type === 'teach') {
          await updateDoc(userRef, {
            skillsToTeach: arrayUnion(postData.skillName),
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, {
            skillsToLearn: arrayUnion(postData.skillName),
            updatedAt: serverTimestamp()
          });
        }
      } else {
        console.warn(`User profile not found for userId: ${currentUser.uid}. Skill post created but user skills not updated.`);
      }

      return postRef.id;
    } catch (error) {
      console.error('Error creating skill post:', error);
      throw new Error('Failed to create skill post');
    }
  }

  /**
   * Get all active skill posts
   */
  static async getActiveSkillPosts(): Promise<SkillPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillPost[];
    } catch (error) {
      console.error('Error getting skill posts:', error);
      throw new Error('Failed to get skill posts');
    }
  }

  /**
   * Get skill posts by type (learn/teach)
   */
  static async getSkillPostsByType(type: 'learn' | 'teach'): Promise<SkillPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('type', '==', type),
        where('isActive', '==', true),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillPost[];
    } catch (error) {
      console.error('Error getting skill posts by type:', error);
      throw new Error('Failed to get skill posts by type');
    }
  }

  /**
   * Get skill posts by user
   */
  static async getUserSkillPosts(userId: string): Promise<SkillPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillPost[];
    } catch (error) {
      console.error('Error getting user skill posts:', error);
      throw new Error('Failed to get user skill posts');
    }
  }

  /**
   * Update skill post
   */
  static async updateSkillPost(postId: string, updates: Partial<SkillPost>): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      await updateDoc(postRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating skill post:', error);
      throw new Error('Failed to update skill post');
    }
  }

  /**
   * Delete skill post
   */
  static async deleteSkillPost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION, postId);
      await updateDoc(postRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting skill post:', error);
      throw new Error('Failed to delete skill post');
    }
  }

  /**
   * Listen to skill posts in real-time
   */
  static subscribeToSkillPosts(callback: (posts: SkillPost[]) => void) {
    console.log('Setting up subscription for all skill posts');
    
    const q = query(
      collection(db, this.COLLECTION),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      console.log(`Received ${querySnapshot.docs.length} total posts`);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillPost[];
      callback(posts);
    }, (error) => {
      console.error('Error in skill posts subscription:', error);
    });
  }

  /**
   * Listen to skill posts by type in real-time
   */
  static subscribeToSkillPostsByType(type: 'learn' | 'teach', callback: (posts: SkillPost[]) => void) {
    console.log(`Setting up subscription for ${type} posts`);
    
    const q = query(
      collection(db, this.COLLECTION),
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      console.log(`Received ${querySnapshot.docs.length} ${type} posts`);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SkillPost[];
      callback(posts);
    }, (error) => {
      console.error(`Error in ${type} posts subscription:`, error);
    });
  }
}

/**
 * Connections Management
 */
export class ConnectionService {
  private static COLLECTION = 'connections';

  /**
   * Compute canonical pair ID minUid_maxUid to satisfy security rules
   */
  private static canonicalPair(u1: string, u2: string) {
    return (u1 < u2 ? u1 : u2) + '_' + (u1 < u2 ? u2 : u1);
  }

  /**
   * Create or re-open a connection request (compliant with security rules)
   */
  static async createConnection(connectionData: Omit<Connection, 'id' | 'timestamp' | 'senderId' | 'createdAt'> & { recipientId: string }): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to create a connection');
      }

      const { recipientId, status, userId, connectedUserId, ...rest } = connectionData;
      const senderId = currentUser.uid;
      
      if (!recipientId) {
        throw new Error('recipientId is required');
      }

      // Deterministic document ID is required by rules
      const docId = this.canonicalPair(senderId, recipientId);
      const connectionRef = doc(db, this.COLLECTION, docId);

      // Check if a connection already exists between these users
      const existingSnap = await getDoc(connectionRef);

      if (!existingSnap.exists()) {
        // Fresh create allowed if ID matches canonicalPair and sender is auth user (enforced by rules)
        await setDoc(connectionRef, {
          senderId,
          recipientId,
          status: 'pending', // Always start as pending
          createdAt: new Date(),
          timestamp: serverTimestamp(), // Keep for backward compatibility
          updatedAt: serverTimestamp(),
          ...rest,
        });
        return docId;
      } else {
        const existing = existingSnap.data() as any;
        // If previously rejected and current user is sender, allow re-opening to pending with limited fields
        if (existing.status === 'rejected' && existing.senderId === senderId) {
          await updateDoc(connectionRef, {
            senderId: existing.senderId,
            recipientId: existing.recipientId,
            status: 'pending',
            updatedAt: serverTimestamp(),
            // Optional context fields permitted by the rules when re-opening
            ...(rest.message ? { message: rest.message } : {}),
            ...(rest.skillName ? { skillName: rest.skillName } : {}),
            ...(rest.senderName ? { senderName: rest.senderName } : {}),
            ...(rest.senderPhotoURL ? { senderPhotoURL: rest.senderPhotoURL } : {}),
            ...(rest.recipientName ? { recipientName: rest.recipientName } : {}),
          } as any);
          return docId;
        }
        // If there's already a pending/accepted connection, surface a friendly error
        throw new Error(
          existing.status === 'accepted'
            ? 'You are already connected with this user.'
            : 'A pending connection request already exists.'
        );
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      throw new Error('Failed to create connection');
    }
  }

  /**
   * Update connection status
   */
static async updateConnectionStatus(connectionId: string, status: Connection['status']): Promise<void> {
    try {
      const connectionRef = doc(db, this.COLLECTION, connectionId);
      // Only update fields allowed by security rules for recipient (or sender re-open via createConnection)
      await updateDoc(connectionRef, {
        senderId: (await getDoc(connectionRef)).data()?.senderId,
        recipientId: (await getDoc(connectionRef)).data()?.recipientId,
        status,
        updatedAt: serverTimestamp()
      } as any);
    } catch (error) {
      console.error('Error updating connection status:', error);
      throw new Error('Failed to update connection status');
    }
  }

  /**
   * Get user connections
   */
  static async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      // Fetch connections where the user is sender OR recipient, then merge
      const sentQuery = query(
        collection(db, this.COLLECTION),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const receivedQuery = query(
        collection(db, this.COLLECTION),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const legacyUserQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const legacyConnectedQuery = query(
        collection(db, this.COLLECTION),
        where('connectedUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const [sentSnap, recvSnap, legacyUserSnap, legacyConnectedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery),
        getDocs(legacyUserQuery),
        getDocs(legacyConnectedQuery)
      ]);

      const sent = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];
      const received = recvSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];
      const legacyUser = legacyUserSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];
      const legacyConnected = legacyConnectedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];

      return [...sent, ...received, ...legacyUser, ...legacyConnected].sort((a: any, b: any) => {
        const at = (a.createdAt?.toDate?.() ?? a.createdAt ?? 0).valueOf?.() ?? 0;
        const bt = (b.createdAt?.toDate?.() ?? b.createdAt ?? 0).valueOf?.() ?? 0;
        return bt - at;
      });
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw new Error('Failed to get user connections');
    }
  }

  /**
   * Listen to user connections in real-time
   */
  static subscribeToUserConnections(userId: string, callback: (connections: Connection[]) => void) {
    const sentQuery = query(
      collection(db, this.COLLECTION),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const receivedQuery = query(
      collection(db, this.COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const legacyUserQuery = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const legacyConnectedQuery = query(
      collection(db, this.COLLECTION),
      where('connectedUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    let sentConns: Connection[] = [];
    let recvConns: Connection[] = [];
    let legacyUserConns: Connection[] = [];
    let legacyConnectedConns: Connection[] = [];

    const emit = () => {
      const merged = [...sentConns, ...recvConns, ...legacyUserConns, ...legacyConnectedConns].sort((a: any, b: any) => {
        const at = (a.createdAt?.toDate?.() ?? a.createdAt ?? 0).valueOf?.() ?? 0;
        const bt = (b.createdAt?.toDate?.() ?? b.createdAt ?? 0).valueOf?.() ?? 0;
        return bt - at;
      });
      callback(merged);
    };

    const un1 = onSnapshot(sentQuery, (qs) => {
      sentConns = qs.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
        // normalize optional fields
        userId: (d.data() as any).userId ?? (d.data() as any).senderId,
        connectedUserId: (d.data() as any).connectedUserId ?? (d.data() as any).recipientId,
      })) as Connection[];
      emit();
    });
    const un2 = onSnapshot(receivedQuery, (qs) => {
      recvConns = qs.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
        userId: (d.data() as any).userId ?? (d.data() as any).recipientId,
        connectedUserId: (d.data() as any).connectedUserId ?? (d.data() as any).senderId,
      })) as Connection[];
      emit();
    });

    const un3 = onSnapshot(legacyUserQuery, (qs) => {
      legacyUserConns = qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Connection[];
      emit();
    });
    const un4 = onSnapshot(legacyConnectedQuery, (qs) => {
      legacyConnectedConns = qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Connection[];
      emit();
    });

    return () => { un1(); un2(); un3(); un4(); };
  }
}

/**
 * Messages Management
 */
export class MessageService {
  private static COLLECTION = 'messages';

  /**
   * Send a message (with conversationId)
   */
  static async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'conversationId'>): Promise<string> {
    try {
      const conversationId = [messageData.senderId, messageData.receiverId].sort().join('_');
      
      if (import.meta.env.DEV) {
        console.log('Sending message:', { ...messageData, conversationId });
      }
      
      const messageRef = await addDoc(collection(db, this.COLLECTION), {
        ...messageData,
        conversationId,
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      if (import.meta.env.DEV) {
        console.log('Message sent successfully, ID:', messageRef.id);
      }
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const conversationId = [userId1, userId2].sort().join('_');
      const q = query(
        collection(db, this.COLLECTION),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get conversation messages');
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      messageIds.forEach(messageId => {
        const messageRef = doc(db, this.COLLECTION, messageId);
        batch.update(messageRef, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Listen to conversation messages in real-time (by conversationId)
   */
  static subscribeToConversation(userId1: string, userId2: string, callback: (messages: Message[]) => void) {
    const conversationId = [userId1, userId2].sort().join('_');
    
    if (import.meta.env.DEV) {
      console.log('Setting up message subscription for conversation:', conversationId);
    }
    
    const q = query(
      collection(db, this.COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      if (import.meta.env.DEV) {
        console.log(`Received ${querySnapshot.docs.length} messages for conversation ${conversationId}`);
      }
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      if (import.meta.env.DEV) {
        console.log('Parsed messages:', messages);
      }
      callback(messages);
    }, (error) => {
      console.error('Error in messages subscription:', error);
    });
  }
}

/**
 * Session Scheduling Management
 */
export class SessionService {
  private static COLLECTION = 'sessions';

  /**
   * Create a new session
   */
  static async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const sessionRef = await addDoc(collection(db, this.COLLECTION), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create notification for participant
      console.log('Creating session notification for participant:', sessionData.participantId);
      await NotificationService.createNotification({
        recipientId: sessionData.participantId,
        userId: sessionData.participantId, // For backward compatibility
        receiverId: sessionData.participantId, // For backward compatibility
        type: 'session_request',
        title: 'New Session Request',
        message: `${sessionData.organizerName} has requested a ${sessionData.sessionType} session for ${sessionData.skillName}`,
        actionUrl: `/sessions/${sessionRef.id}`,
        isRead: false,
        priority: 'high',
        relatedSessionId: sessionRef.id,
        relatedUserId: sessionData.organizerId
      });
      console.log('Session notification created successfully');

      console.log('Session created successfully:', sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(sessionId: string, status: Session['status'], updateData?: Partial<Session>): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const updatePayload = {
        status,
        updatedAt: serverTimestamp(),
        ...updateData
      };

      await updateDoc(sessionRef, updatePayload);

      // Get session details for notifications
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const session = sessionDoc.data() as Session;
        
        // Send notification based on status change
        if (status === 'confirmed') {
          await NotificationService.createNotification({
            recipientId: session.organizerId,
            userId: session.organizerId, // For backward compatibility
            type: 'session_confirmed',
            title: 'Session Confirmed',
            message: `${session.participantName} has confirmed your session for ${session.skillName}`,
            actionUrl: `/sessions/${sessionId}`,
            isRead: false,
            priority: 'high',
            relatedSessionId: sessionId,
            relatedUserId: session.participantId
          });
        }
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      throw new Error('Failed to update session status');
    }
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const organizerQuery = query(
        collection(db, this.COLLECTION),
        where('organizerId', '==', userId),
        orderBy('scheduledDate', 'desc')
      );
      
      const participantQuery = query(
        collection(db, this.COLLECTION),
        where('participantId', '==', userId),
        orderBy('scheduledDate', 'desc')
      );

      const [organizerSnapshot, participantSnapshot] = await Promise.all([
        getDocs(organizerQuery),
        getDocs(participantQuery)
      ]);

      const organizerSessions = organizerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];

      const participantSessions = participantSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];

      // Combine and deduplicate sessions
      const allSessions = [...organizerSessions, ...participantSessions];
      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      return uniqueSessions.sort((a, b) => 
        b.scheduledDate.toDate().getTime() - a.scheduledDate.toDate().getTime()
      );
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error('Failed to get user sessions');
    }
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        return {
          id: sessionDoc.id,
          ...sessionDoc.data()
        } as Session;
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to get session');
    }
  }

  /**
   * Subscribe to user sessions in real-time
   */
  static subscribeToUserSessions(userId: string, callback: (sessions: Session[]) => void) {
    // Subscribe to sessions where user is organizer
    const organizerQuery = query(
      collection(db, this.COLLECTION),
      where('organizerId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );
    
    // Subscribe to sessions where user is participant
    const participantQuery = query(
      collection(db, this.COLLECTION),
      where('participantId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );

    const unsubscribeOrganizer = onSnapshot(organizerQuery, () => {
      this.getUserSessions(userId).then(callback);
    });

    const unsubscribeParticipant = onSnapshot(participantQuery, () => {
      this.getUserSessions(userId).then(callback);
    });

    // Return cleanup function
    return () => {
      unsubscribeOrganizer();
      unsubscribeParticipant();
    };
  }
}

/**
 * Notification Management
 */
export class NotificationService {
  private static COLLECTION = 'notifications';

  /**
   * Create a new notification
   */
  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'senderId' | 'read'> & { recipientId: string; message: string }): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated to create a notification');
      }

      const notificationRef = await addDoc(collection(db, this.COLLECTION), {
        ...notificationData,
        senderId: currentUser.uid,
        userId: notificationData.recipientId, // Keep for backward compatibility
        read: false,
        isRead: false, // Keep for backward compatibility
        createdAt: new Date()
      });

      console.log('Notification created:', notificationRef.id);
      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to recent notifications
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        isRead: true // Keep for backward compatibility
      });
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
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Subscribe to user notifications in real-time
   */
  static subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
    });
  }

  /**
   * Delete expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.COLLECTION),
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${querySnapshot.docs.length} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
  
  // Fix naming for consistency with other services
  static subscribeToNotifications = this.subscribeToUserNotifications;
}

// Export automation services for external use
export { SessionAutomationService, RealTimeIntegration } from './sessionAutomation';
export { EmailService } from './emailService';
export { MeetingService } from './meetingService';
