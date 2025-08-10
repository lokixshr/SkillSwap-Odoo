import { createClient } from '@supabase/supabase-js'

// Get configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll use Firebase for auth
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit realtime events for performance
    }
  }
})

// Types for our Supabase database
export interface SupabaseMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  conversation_id: string
  created_at: string
  is_read: boolean
  updated_at: string
}

export interface SupabaseConversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_id?: string
  last_message_at: string
  created_at: string
  updated_at: string
}

export interface SupabaseMessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}
