import { MessageService } from '@/lib/database';
import { auth } from '@/lib/firebase';

export class MessageDebugger {
  /**
   * Test sending a message
   */
  static async testSendMessage(receiverId: string, content: string) {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return;
    }

    try {
      console.log('Testing message send...', { receiverId, content });
      const messageId = await MessageService.sendMessage({
        senderId: auth.currentUser.uid,
        receiverId,
        content,
      });
      console.log('Message sent successfully:', messageId);
      return messageId;
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw error;
    }
  }

  /**
   * Test getting conversation messages
   */
  static async testGetConversation(otherUserId: string) {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return;
    }

    try {
      console.log('Testing get conversation...', { otherUserId });
      const messages = await MessageService.getConversationMessages(
        auth.currentUser.uid,
        otherUserId
      );
      console.log('Retrieved messages:', messages);
      return messages;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      throw error;
    }
  }

  /**
   * Test real-time subscription
   */
  static testSubscription(otherUserId: string) {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return;
    }

    console.log('Testing subscription...', { otherUserId });
    const unsubscribe = MessageService.subscribeToConversation(
      auth.currentUser.uid,
      otherUserId,
      (messages) => {
        console.log('Subscription update:', messages);
      }
    );

    // Return cleanup function
    return unsubscribe;
  }
}

// Make it available globally for debugging
declare global {
  interface Window {
    MessageDebugger: typeof MessageDebugger;
  }
}

if (typeof window !== 'undefined') {
  window.MessageDebugger = MessageDebugger;
}
