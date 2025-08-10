import { supabase, type SupabaseMessage, type SupabaseConversation } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Supabase Message Service
 * Handles all messaging functionality using Supabase instead of Firebase
 */
export class SupabaseMessageService {
  private static subscriptions = new Map<string, RealtimeChannel>()

  /**
   * Generate conversation ID from two user IDs
   */
  private static getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_')
  }

  /**
   * Send a message using Firebase auth token for authorization
   */
  static async sendMessage(params: {
    senderId: string
    receiverId: string
    content: string
    firebaseToken?: string // Firebase JWT token for auth
  }): Promise<string> {
    try {
      const conversationId = this.getConversationId(params.senderId, params.receiverId)
      
      if (import.meta.env.DEV) {
        console.log('Sending Supabase message:', { 
          ...params, 
          conversationId,
          firebaseToken: params.firebaseToken ? 'present' : 'missing'
        })
      }

      // Set Firebase token as custom header if available
      const headers: Record<string, string> = {}
      if (params.firebaseToken) {
        headers['firebase-token'] = params.firebaseToken
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: params.senderId,
            receiver_id: params.receiverId,
            content: params.content,
            conversation_id: conversationId,
          }
        ])
        .select('id')
        .single()

      if (error) {
        console.error('Error sending Supabase message:', error)
        throw new Error(`Failed to send message: ${error.message}`)
      }

      if (import.meta.env.DEV) {
        console.log('Supabase message sent successfully, ID:', data.id)
      }

      return data.id
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(userId1: string, userId2: string): Promise<SupabaseMessage[]> {
    try {
      const conversationId = this.getConversationId(userId1, userId2)
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting conversation messages:', error)
        throw new Error(`Failed to get messages: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      throw error
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in('id', messageIds)

      if (error) {
        console.error('Error marking messages as read:', error)
        throw new Error(`Failed to mark messages as read: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error)
      throw error
    }
  }

  /**
   * Mark all messages in a conversation as read for a specific user
   */
  static async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking conversation as read:', error)
        throw new Error(`Failed to mark conversation as read: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in markConversationAsRead:', error)
      throw error
    }
  }

  /**
   * Subscribe to conversation messages in real-time
   */
  static subscribeToConversation(
    userId1: string,
    userId2: string,
    callback: (messages: SupabaseMessage[]) => void
  ): () => void {
    const conversationId = this.getConversationId(userId1, userId2)
    const subscriptionKey = `conversation_${conversationId}`

    if (import.meta.env.DEV) {
      console.log('Setting up Supabase subscription for conversation:', conversationId)
    }

    // Clean up existing subscription if any
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }

    // Initial fetch
    this.getConversationMessages(userId1, userId2)
      .then(messages => {
        if (import.meta.env.DEV) {
          console.log(`Initial fetch: ${messages.length} messages for conversation ${conversationId}`)
        }
        callback(messages)
      })
      .catch(error => {
        console.error('Error in initial message fetch:', error)
      })

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('Received real-time message update:', payload)
          }

          // Refetch all messages to ensure consistency
          this.getConversationMessages(userId1, userId2)
            .then(messages => {
              callback(messages)
            })
            .catch(error => {
              console.error('Error refetching messages after real-time update:', error)
            })
        }
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, channel)

    // Return unsubscribe function
    return () => {
      if (import.meta.env.DEV) {
        console.log('Cleaning up Supabase message subscription for:', conversationId)
      }
      channel.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<SupabaseConversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error getting user conversations:', error)
        throw new Error(`Failed to get conversations: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserConversations:', error)
      throw error
    }
  }

  /**
   * Subscribe to user conversations in real-time
   */
  static subscribeToUserConversations(
    userId: string,
    callback: (conversations: SupabaseConversation[]) => void
  ): () => void {
    const subscriptionKey = `user_conversations_${userId}`

    if (import.meta.env.DEV) {
      console.log('Setting up Supabase subscription for user conversations:', userId)
    }

    // Clean up existing subscription if any
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }

    // Initial fetch
    this.getUserConversations(userId)
      .then(conversations => {
        if (import.meta.env.DEV) {
          console.log(`Initial fetch: ${conversations.length} conversations for user ${userId}`)
        }
        callback(conversations)
      })
      .catch(error => {
        console.error('Error in initial conversations fetch:', error)
      })

    // Set up real-time subscription
    const channel = supabase
      .channel(`conversations:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          // Check if this conversation involves the current user
          const conversation = payload.new as SupabaseConversation
          if (conversation && (conversation.user1_id === userId || conversation.user2_id === userId)) {
            if (import.meta.env.DEV) {
              console.log('Received real-time conversation update:', payload)
            }

            // Refetch all conversations
            this.getUserConversations(userId)
              .then(conversations => {
                callback(conversations)
              })
              .catch(error => {
                console.error('Error refetching conversations after real-time update:', error)
              })
          }
        }
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, channel)

    // Return unsubscribe function
    return () => {
      if (import.meta.env.DEV) {
        console.log('Cleaning up Supabase conversations subscription for:', userId)
      }
      channel.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Clean up all subscriptions
   */
  static cleanup(): void {
    if (import.meta.env.DEV) {
      console.log('Cleaning up all Supabase subscriptions')
    }
    
    this.subscriptions.forEach(channel => {
      channel.unsubscribe()
    })
    this.subscriptions.clear()
  }
}

// Helper function to convert Supabase message to Firebase message format
export function supabaseToFirebaseMessage(supabaseMessage: SupabaseMessage) {
  return {
    id: supabaseMessage.id,
    senderId: supabaseMessage.sender_id,
    receiverId: supabaseMessage.receiver_id,
    content: supabaseMessage.content,
    conversationId: supabaseMessage.conversation_id,
    timestamp: new Date(supabaseMessage.created_at),
    isRead: supabaseMessage.is_read,
  }
}

// Export for debugging in development
if (import.meta.env.DEV) {
  (window as any).SupabaseMessageService = SupabaseMessageService
}
