import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  writeBatch,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Message interface for Firebase Firestore
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  conversationId?: string;
  createdAt?: Timestamp; // Firebase serverTimestamp
}

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate chatId from sorted user IDs
  const chatId = user && otherUserId ? [user.uid, otherUserId].sort().join('_') : '';

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('useMessages effect triggered:', { user: user?.uid, otherUserId, chatId });
    }
    
    if (!user || !otherUserId || !chatId) {
      if (import.meta.env.DEV) {
        console.log('Missing user, otherUserId, or chatId, clearing messages');
      }
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      if (import.meta.env.DEV) {
        console.log('Setting up Firebase message subscription for chatId:', chatId);
      }
      
      // Reference to the messages collection for this chat
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      // Subscribe to real-time updates
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messageData: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messageData.push({
              id: doc.id,
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              createdAt: data.createdAt,
              timestamp: data.createdAt?.toDate() || new Date(),
              isRead: data.isRead || false,
              conversationId: chatId,
            });
          });
          
          if (import.meta.env.DEV) {
            console.log('Received Firebase messages update:', messageData.length);
          }
          setMessages(messageData);
          setLoading(false);
        },
        (err) => {
          console.error('Error in Firebase messages subscription:', err);
          setError('Failed to load messages');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up messages subscription:', err);
      setError('Failed to load messages');
      setLoading(false);
    }

    return () => {
      if (import.meta.env.DEV) {
        console.log('Cleaning up Firebase message subscription');
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, otherUserId, chatId]);

  const sendMessage = async (content: string) => {
    if (!user || !otherUserId || !chatId) {
      throw new Error('User must be authenticated and recipient must be specified');
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Sending Firebase message:', {
          senderId: user.uid,
          receiverId: otherUserId,
          content,
          chatId
        });
      }
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const docRef = await addDoc(messagesRef, {
        senderId: user.uid,
        receiverId: otherUserId,
        content: content.trim(),
        createdAt: serverTimestamp(),
        isRead: false,
      });

      if (import.meta.env.DEV) {
        console.log('Firebase message sent successfully, ID:', docRef.id);
      }
      
      return docRef.id;
    } catch (err) {
      console.error('Error sending Firebase message:', err);
      throw new Error('Failed to send message');
    }
  };

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!chatId) return;
    
    try {
      const batch = writeBatch(db);
      messageIds.forEach(messageId => {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        batch.update(messageRef, { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking messages as read:', err);
      throw new Error('Failed to mark messages as read');
    }
  };

  const getUnreadMessages = () => {
    return messages.filter(msg => !msg.isRead && msg.senderId !== user?.uid);
  };

  const getLatestMessage = () => {
    return messages.length > 0 ? messages[messages.length - 1] : null;
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    getUnreadMessages,
    getLatestMessage,
  };
};
