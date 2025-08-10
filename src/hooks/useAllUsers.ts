import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface BasicUserProfile {
  uid: string
  displayName?: string
  photoURL?: string
}

export const useAllUsers = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<BasicUserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setUsers([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(collection(db, 'users'), orderBy('displayName'))
    const un = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ uid: (d.data() as any).uid ?? d.id, ...(d.data() as any) }))
        .filter((u) => u.uid && u.uid !== user.uid)
      setUsers(list as BasicUserProfile[])
      setLoading(false)
    })
    return () => un()
  }, [user?.uid])

  const byName = useMemo(() => users, [users])
  return { users: byName, loading }
}


