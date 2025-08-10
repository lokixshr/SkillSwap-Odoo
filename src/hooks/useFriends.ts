import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface FriendEdge {
  id: string
  userId1: string
  userId2: string
  createdAt?: Timestamp
}

export interface FriendViewItem {
  id: string
  connectedUserId: string
  createdAt?: Timestamp
}

export const useFriends = () => {
  const { user } = useAuth()
  const [edges, setEdges] = useState<FriendEdge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setEdges([])
      setLoading(false)
      return
    }

    setLoading(true)
    const friendsCol = collection(db, 'friends')
    const q1 = query(friendsCol, where('userId1', '==', user.uid))
    const q2 = query(friendsCol, where('userId2', '==', user.uid))

    let e1: FriendEdge[] = []
    let e2: FriendEdge[] = []

    const emit = () => {
      setEdges([...e1, ...e2])
      setLoading(false)
    }

    const un1 = onSnapshot(q1, (snap) => {
      e1 = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FriendEdge[]
      emit()
    })
    const un2 = onSnapshot(q2, (snap) => {
      e2 = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FriendEdge[]
      emit()
    })

    return () => {
      un1()
      un2()
    }
  }, [user?.uid])

  const friends: FriendViewItem[] = useMemo(() => {
    if (!user?.uid) return []
    return edges.map((e) => ({
      id: e.id,
      connectedUserId: e.userId1 === user.uid ? e.userId2 : e.userId1,
      createdAt: e.createdAt,
    }))
  }, [edges, user?.uid])

  return { friends, loading }
}


