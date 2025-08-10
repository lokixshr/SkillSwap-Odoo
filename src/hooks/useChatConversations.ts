import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface ChatListItem {
  id: string // chatId
  otherUserId: string
  lastMessageAt?: any
}

export const useChatConversations = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<ChatListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
    const un = onSnapshot(q, (snap) => {
      const list: ChatListItem[] = snap.docs.map((d) => {
        const data = d.data() as any
        const otherUserId = (data.participants || []).find((p: string) => p !== user.uid)
        return { id: d.id, otherUserId, lastMessageAt: data.lastMessageAt }
      })
      setItems(list)
      setLoading(false)
    })
    return () => un()
  }, [user?.uid])

  const sorted = useMemo(() => {
    return items.slice().sort((a, b) => {
      const at = (a.lastMessageAt?.toDate?.() ?? 0).valueOf?.() ?? 0
      const bt = (b.lastMessageAt?.toDate?.() ?? 0).valueOf?.() ?? 0
      return bt - at
    })
  }, [items])

  return { chats: sorted, loading }
}


