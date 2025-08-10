import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SupabaseMessageService } from '@/lib/supabaseMessageService'

export interface SupabaseConversationItem {
  conversationId: string
  otherUserId: string
  lastMessageAt: string
}

export const useSupabaseConversations = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<SupabaseConversationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Feature flag: opt-in only when explicitly enabled
    if (import.meta.env.VITE_USE_SUPABASE_CHAT !== 'true') {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    if (!user?.uid) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = SupabaseMessageService.subscribeToUserConversations(
      user.uid,
      (conversations) => {
        const mapped = (conversations || []).map((c: any) => {
          const otherUserId = c.user1_id === user.uid ? c.user2_id : c.user1_id
          return {
            conversationId: c.id,
            otherUserId,
            lastMessageAt: c.last_message_at,
          } as SupabaseConversationItem
        })
        setItems(mapped)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [user?.uid])

  const sorted = useMemo(
    () => items.slice().sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1)),
    [items]
  )

  return { conversations: sorted, loading, error }
}


