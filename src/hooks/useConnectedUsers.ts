import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ConnectedContact {
  id: string
  connectedUserId: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt?: Timestamp
}

export const useConnectedUsers = () => {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<ConnectedContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setContacts([])
      setLoading(false)
      return
    }

    setLoading(true)

    const connsCol = collection(db, 'connections')
    const qSender = query(connsCol, where('senderId', '==', user.uid), orderBy('createdAt', 'desc'))
    const qRecipient = query(connsCol, where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'))
    const qLegacyUser = query(connsCol, where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
    const qLegacyConnected = query(connsCol, where('connectedUserId', '==', user.uid), orderBy('createdAt', 'desc'))

    const contactsMap = new Map<string, ConnectedContact>()

    const upsertFromDocs = (docs: any[], direction: 'sender' | 'recipient' | 'legacyUser' | 'legacyConnected') => {
      docs.forEach((d) => {
        const data = d.data()
        const otherId =
          direction === 'sender'
            ? data.recipientId
            : direction === 'recipient'
            ? data.senderId
            : direction === 'legacyUser'
            ? data.connectedUserId
            : data.userId

        // Skip invalid or self references
        if (!otherId || otherId === user?.uid) return

        const existing = contactsMap.get(otherId)
        const createdAt = data.createdAt || data.timestamp
        const next: ConnectedContact = {
          id: d.id,
          connectedUserId: otherId,
          status: (data.status as any) || 'accepted',
          createdAt,
        }

        if (!existing) {
          contactsMap.set(otherId, next)
        } else {
          // Prefer accepted over pending
          if (existing.status !== 'accepted' && next.status === 'accepted') {
            contactsMap.set(otherId, next)
          }
        }
      })
    }

    const un1 = onSnapshot(qSender, (snap) => {
      upsertFromDocs(snap.docs, 'sender')
      setContacts(Array.from(contactsMap.values()))
      setLoading(false)
    })
    const un2 = onSnapshot(qRecipient, (snap) => {
      upsertFromDocs(snap.docs, 'recipient')
      setContacts(Array.from(contactsMap.values()))
      setLoading(false)
    })
    const un3 = onSnapshot(qLegacyUser, (snap) => {
      upsertFromDocs(snap.docs, 'legacyUser')
      setContacts(Array.from(contactsMap.values()))
      setLoading(false)
    })
    const un4 = onSnapshot(qLegacyConnected, (snap) => {
      upsertFromDocs(snap.docs, 'legacyConnected')
      setContacts(Array.from(contactsMap.values()))
      setLoading(false)
    })

    return () => {
      un1()
      un2()
      un3()
      un4()
    }
  }, [user?.uid])

  const sorted = useMemo(() => {
    return contacts
      .filter((c) => c.status !== 'rejected')
      .sort((a, b) => {
        const at = (a.createdAt?.toDate?.() ?? 0).valueOf?.() ?? 0
        const bt = (b.createdAt?.toDate?.() ?? 0).valueOf?.() ?? 0
        return bt - at
      })
  }, [contacts])

  return { contacts: sorted, loading }
}


