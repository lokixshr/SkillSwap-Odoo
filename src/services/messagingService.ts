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
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConnectionsService } from './connectionsService';

// Message data model
export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file' | 'system';
  senderName?: string;
  senderPhotoURL?: string;
  editedAt?: Timestamp;
  replyTo?: string; // ID of message being replied to
  metadata?: Record<string, any>;
}

// Conversation data model
export interface Conversation {
  id?: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCounts: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export class MessagingService {
  private static MESSAGES_COLLECTION = 'messages';
  private static CONVERSATIONS_COLLECTION = 'conversations';

  /**
   * Generate conversation ID consistently for two users
   */
  private static generateConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Create or get existing conversation between two users
   */
  static async createOrGetConversation(
    userId1: string, 
    userId2: string,
    user1Name?: string,
    user1Photo?: string,
    user2Name?: string,
    user2Photo?: string
  ): Promise<string> {
    try {
      const conversationId = this.generateConversationId(userId1, userId2);
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        // Create new conversation
        const conversationData: Omit<Conversation, 'id'> = {
          participants: [userId1, userId2],
          participantNames: {
            [userId1]: user1Name || 'User',
            [userId2]: user2Name || 'User'
          },
          participantPhotos: {
            [userId1]: user1Photo || '',
            [userId2]: user2Photo || ''
          },
          unreadCounts: {
            [userId1]: 0,
            [userId2]: 0
          },
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          isActive: true
        };

        await setDoc(conversationRef, conversationData);
        console.log('New conversation created:', conversationId);
      }

      return conversationId;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw new Error('Failed to create or get conversation');
    }
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(data: {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    replyTo?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      // Validate input
      if (!data.senderId || !data.receiverId || !data.content.trim()) {
        throw new Error('Invalid message data');
      }

      if (data.senderId === data.receiverId) {
        throw new Error('Cannot send message to yourself');
      }

      // Check if users are connected (optional - can be removed if you want open messaging)
      const areConnected = await ConnectionsService.areFriends(data.senderId, data.receiverId);
      if (!areConnected) {
        console.warn('Users are not connected, but allowing message');
      }

      const conversationId = this.generateConversationId(data.senderId, data.receiverId);

      // Ensure conversation exists
      await this.createOrGetConversation(data.senderId, data.receiverId);

      const messageData: Omit<Message, 'id'> = {
        conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content.trim(),
        timestamp: serverTimestamp() as Timestamp,
        isRead: false,
        messageType: data.messageType || 'text',
        replyTo: data.replyTo,
        metadata: data.metadata
      };

      // Use batch write for atomicity
      const batch = writeBatch(db);
      
      // Add message
      const messageRef = doc(collection(db, this.MESSAGES_COLLECTION));
      batch.set(messageRef, messageData);

      // Update conversation with last message info
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      batch.update(conversationRef, {
        lastMessage: data.content.substring(0, 100), // First 100 chars
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCounts.${data.receiverId}`]: (await getDoc(conversationRef)).data()?.unreadCounts?.[data.receiverId] + 1 || 1
      });

      await batch.commit();

      console.log('Message sent successfully:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  static async getConversationMessages(
    userId1: string, 
    userId2: string,
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{messages: Message[], lastDoc?: QueryDocumentSnapshot<DocumentData>}> {
    try {
      const conversationId = this.generateConversationId(userId1, userId2);
      
      let q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, this.MESSAGES_COLLECTION),
          where('conversationId', '==', conversationId),
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Sort messages chronologically (oldest first for display)
      const sortedMessages = messages.reverse();

      return {
        messages: sortedMessages,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get conversation messages');
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    try {
      const conversationId = this.generateConversationId(userId, otherUserId);
      
      // Get unread messages
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;

      // Use batch to mark messages as read
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      // Reset unread count in conversation
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      batch.update(conversationRef, {
        [`unreadCounts.${userId}`]: 0
      });

      await batch.commit();
      
      console.log(`Marked ${querySnapshot.docs.length} messages as read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Subscribe to conversation messages in real-time
   */
  static subscribeToConversation(
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const conversationId = this.generateConversationId(userId1, userId2);
    
    console.log('Setting up message subscription for conversation:', conversationId);
    
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'),
      limit(100) // Limit to prevent loading too many messages
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      console.log(`Received ${messages.length} messages for conversation ${conversationId}`);
      callback(messages);
    }, (error) => {
      console.error('Error in messages subscription:', error);
      if (errorCallback) {
        errorCallback(new Error('Failed to subscribe to messages'));
      }
    });
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.CONVERSATIONS_COLLECTION),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get conversations');
    }
  }

  /**
   * Subscribe to user's conversations
   */
  static subscribeToUserConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const q = query(
      collection(db, this.CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      callback(conversations);
    });
  }

  /**
   * Delete a message (mark as deleted, don't actually remove)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data() as Message;
      if (messageData.senderId !== userId) {
        throw new Error('Not authorized to delete this message');
      }

      await updateDoc(messageRef, {
        content: 'Message deleted',
        messageType: 'system',
        metadata: {
          ...messageData.metadata,
          deleted: true,
          deletedAt: serverTimestamp()
        }
      });

      console.log('Message deleted:', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, userId: string, newContent: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data() as Message;
      if (messageData.senderId !== userId) {
        throw new Error('Not authorized to edit this message');
      }

      await updateDoc(messageRef, {
        content: newContent.trim(),
        editedAt: serverTimestamp(),
        metadata: {
          ...messageData.metadata,
          edited: true
        }
      });

      console.log('Message edited:', messageId);
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Block a user (prevent messaging)
   */
  static async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const conversationId = this.generateConversationId(blockerId, blockedUserId);
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);

      await updateDoc(conversationRef, {
        isActive: false,
        [`blockedBy.${blockerId}`]: true,
        updatedAt: serverTimestamp()
      });

      console.log('User blocked:', blockedUserId);
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error('Failed to block user');
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const conversationId = this.generateConversationId(blockerId, blockedUserId);
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);

      await updateDoc(conversationRef, {
        isActive: true,
        [`blockedBy.${blockerId}`]: null,
        updatedAt: serverTimestamp()
      });

      console.log('User unblocked:', blockedUserId);
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new Error('Failed to unblock user');
    }
  }
}
