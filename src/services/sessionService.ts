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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationsService } from './notificationsService';
import { UserService } from '@/lib/database';

// Session Request data model
export interface SessionRequest {
  id?: string;
  requesterId: string;
  hostId: string;
  skillId?: string;
  skillName: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  sessionType: 'video' | 'phone' | 'in-person';
  preferredDate?: Timestamp;
  duration?: number; // in minutes
  message?: string;
  requesterName?: string;
  requesterPhotoURL?: string;
  hostName?: string;
  location?: string; // for in-person sessions
}

// Event data model (created when session request is approved)
export interface SessionEvent {
  id?: string;
  sessionRequestId: string;
  organizerId: string;
  participantId: string;
  skillName: string;
  sessionType: 'video' | 'phone' | 'in-person';
  scheduledDate: Timestamp;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export class SessionService {
  private static SESSION_REQUESTS_COLLECTION = 'sessionRequests';
  private static EVENTS_COLLECTION = 'events';

  /**
   * Create a new session request
   */
  static async createSessionRequest(data: {
    hostId: string;
    requesterId: string;
    skillId?: string;
    skillName: string;
    sessionType: 'video' | 'phone' | 'in-person';
    preferredDate?: Timestamp;
    duration?: number;
    message?: string;
    location?: string;
  }): Promise<string> {
    try {
      // Get requester and host profiles
      const [requesterProfile, hostProfile] = await Promise.all([
        UserService.getUserProfile(data.requesterId),
        UserService.getUserProfile(data.hostId)
      ]);

      if (!requesterProfile || !hostProfile) {
        throw new Error('User profile not found');
      }

      const sessionRequestData: Omit<SessionRequest, 'id'> = {
        requesterId: data.requesterId,
        hostId: data.hostId,
        skillId: data.skillId,
        skillName: data.skillName,
        status: 'pending',
        sessionType: data.sessionType,
        preferredDate: data.preferredDate,
        duration: data.duration || 60,
        message: data.message,
        location: data.location,
        createdAt: serverTimestamp() as Timestamp,
        requesterName: requesterProfile.displayName,
        requesterPhotoURL: requesterProfile.photoURL,
        hostName: hostProfile.displayName,
      };

      const docRef = await addDoc(collection(db, this.SESSION_REQUESTS_COLLECTION), sessionRequestData);

      // Create notification for host
      await NotificationsService.createSessionRequestNotification(
        data.hostId,
        data.requesterId,
        requesterProfile.displayName,
        data.skillName,
        docRef.id,
        requesterProfile.photoURL
      );

      console.log('Session request created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating session request:', error);
      throw new Error('Failed to create session request');
    }
  }

  /**
   * Update session request status
   */
  static async updateSessionRequestStatus(
    sessionRequestId: string,
    status: 'approved' | 'declined',
    eventData?: {
      scheduledDate: Timestamp;
      meetingLink?: string;
      notes?: string;
    }
  ): Promise<string | null> {
    try {
      const sessionRequestRef = doc(db, this.SESSION_REQUESTS_COLLECTION, sessionRequestId);
      const sessionRequestDoc = await getDoc(sessionRequestRef);
      
      if (!sessionRequestDoc.exists()) {
        throw new Error('Session request not found');
      }

      const sessionRequestData = sessionRequestDoc.data() as SessionRequest;

      // Update session request status
      await updateDoc(sessionRequestRef, {
        status,
        updatedAt: serverTimestamp()
      });

      let eventId: string | null = null;

      // If approved, create an event with meeting link and send emails
      if (status === 'approved' && eventData) {
        // Generate meeting link if video session and none provided
        let meetingLink = eventData.meetingLink;
        if (sessionRequestData.sessionType === 'video' && !meetingLink) {
          try {
            const { MeetingService } = await import('@/lib/meetingService');
            const meetingRoom = await MeetingService.generateMeetingLink(
              sessionRequestId,
              sessionRequestData.hostId,
              sessionRequestData.requesterId,
              'jitsi' // Default to Jitsi for reliability
            );
            meetingLink = meetingRoom.meetingUrl;
          } catch (meetingError) {
            console.error('Failed to generate meeting link:', meetingError);
            // Continue without meeting link
          }
        }

        eventId = await this.createSessionEvent({
          sessionRequestId,
          organizerId: sessionRequestData.hostId,
          participantId: sessionRequestData.requesterId,
          skillName: sessionRequestData.skillName,
          sessionType: sessionRequestData.sessionType,
          scheduledDate: eventData.scheduledDate,
          duration: sessionRequestData.duration || 60,
          meetingLink,
          location: sessionRequestData.location,
          notes: eventData.notes,
        });

        // Send email notifications to both users
        try {
          const { EmailService } = await import('@/lib/emailService');
          const [hostProfile, requesterProfile] = await Promise.all([
            UserService.getUserProfile(sessionRequestData.hostId),
            UserService.getUserProfile(sessionRequestData.requesterId)
          ]);

          if (hostProfile?.email && requesterProfile?.email) {
            const sessionEvent = {
              id: eventId,
              skillName: sessionRequestData.skillName,
              sessionType: sessionRequestData.sessionType,
              scheduledDate: eventData.scheduledDate,
              duration: sessionRequestData.duration || 60,
              meetingLink,
              location: sessionRequestData.location,
              notes: eventData.notes,
              organizerId: sessionRequestData.hostId,
              organizerName: sessionRequestData.hostName,
              participantId: sessionRequestData.requesterId,
              participantName: sessionRequestData.requesterName,
            };

            // Send confirmation emails to both parties
            await Promise.all([
              EmailService.sendSessionConfirmationEmail(
                sessionEvent as any,
                hostProfile.email,
                hostProfile.displayName || 'User',
                true // isOrganizer
              ),
              EmailService.sendSessionConfirmationEmail(
                sessionEvent as any,
                requesterProfile.email,
                requesterProfile.displayName || 'User',
                false // isOrganizer
              )
            ]);
          }
        } catch (emailError) {
          console.error('Failed to send confirmation emails:', emailError);
          // Continue without emails - don't fail the session creation
        }

        // Create notification for requester about approval
        await NotificationsService.createNotification({
          recipientId: sessionRequestData.requesterId,
          senderId: sessionRequestData.hostId,
          senderName: sessionRequestData.hostName,
          type: 'session_request',
          status: 'accepted',
          message: `${sessionRequestData.hostName} approved your session request for ${sessionRequestData.skillName}. ${meetingLink ? 'Meeting link has been sent to your email.' : ''}`,
          sessionId: eventId,
          skillName: sessionRequestData.skillName,
          additionalData: {
            meetingLink,
            scheduledDate: eventData.scheduledDate,
            sessionType: sessionRequestData.sessionType
          }
        });
      } else if (status === 'declined') {
        // Create notification for requester about decline
        await NotificationsService.createNotification({
          recipientId: sessionRequestData.requesterId,
          senderId: sessionRequestData.hostId,
          senderName: sessionRequestData.hostName,
          type: 'session_request',
          status: 'rejected',
          message: `${sessionRequestData.hostName} declined your session request for ${sessionRequestData.skillName}`,
          skillName: sessionRequestData.skillName
        });
      }

      console.log('Session request status updated:', sessionRequestId, status);
      return eventId;
    } catch (error) {
      console.error('Error updating session request status:', error);
      throw new Error('Failed to update session request status');
    }
  }

  /**
   * Create a session event (when request is approved)
   */
  private static async createSessionEvent(data: {
    sessionRequestId: string;
    organizerId: string;
    participantId: string;
    skillName: string;
    sessionType: 'video' | 'phone' | 'in-person';
    scheduledDate: Timestamp;
    duration: number;
    meetingLink?: string;
    location?: string;
    notes?: string;
  }): Promise<string> {
    try {
      const eventData: Omit<SessionEvent, 'id'> = {
        sessionRequestId: data.sessionRequestId,
        organizerId: data.organizerId,
        participantId: data.participantId,
        skillName: data.skillName,
        sessionType: data.sessionType,
        scheduledDate: data.scheduledDate,
        duration: data.duration,
        status: 'scheduled',
        meetingLink: data.meetingLink,
        location: data.location,
        notes: data.notes,
        createdAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, this.EVENTS_COLLECTION), eventData);
      console.log('Session event created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating session event:', error);
      throw new Error('Failed to create session event');
    }
  }

  /**
   * Get user's session requests (sent and received)
   */
  static async getUserSessionRequests(userId: string): Promise<SessionRequest[]> {
    try {
      // Get sent requests
      const sentQuery = query(
        collection(db, this.SESSION_REQUESTS_COLLECTION),
        where('requesterId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Get received requests
      const receivedQuery = query(
        collection(db, this.SESSION_REQUESTS_COLLECTION),
        where('hostId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const sentRequests = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionRequest[];

      const receivedRequests = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionRequest[];

      return [...sentRequests, ...receivedRequests].sort((a, b) => 
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
    } catch (error) {
      console.error('Error getting user session requests:', error);
      throw new Error('Failed to get session requests');
    }
  }

  /**
   * Get pending session requests for user (received only)
   */
  static async getPendingSessionRequests(userId: string): Promise<SessionRequest[]> {
    try {
      const q = query(
        collection(db, this.SESSION_REQUESTS_COLLECTION),
        where('hostId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionRequest[];
    } catch (error) {
      console.error('Error getting pending session requests:', error);
      throw new Error('Failed to get pending session requests');
    }
  }

  /**
   * Get user's events
   */
  static async getUserEvents(userId: string): Promise<SessionEvent[]> {
    try {
      const organizerQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('organizerId', '==', userId),
        orderBy('scheduledDate', 'desc')
      );

      const participantQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('participantId', '==', userId),
        orderBy('scheduledDate', 'desc')
      );

      const [organizerSnapshot, participantSnapshot] = await Promise.all([
        getDocs(organizerQuery),
        getDocs(participantQuery)
      ]);

      const organizerEvents = organizerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionEvent[];

      const participantEvents = participantSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionEvent[];

      // Combine and deduplicate events
      const allEvents = [...organizerEvents, ...participantEvents];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      return uniqueEvents.sort((a, b) => 
        b.scheduledDate.toDate().getTime() - a.scheduledDate.toDate().getTime()
      );
    } catch (error) {
      console.error('Error getting user events:', error);
      throw new Error('Failed to get user events');
    }
  }

  /**
   * Get session event by ID
   */
  static async getSessionEvent(eventId: string): Promise<SessionEvent | null> {
    try {
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        return {
          id: eventDoc.id,
          ...eventDoc.data()
        } as SessionEvent;
      }
      return null;
    } catch (error) {
      console.error('Error getting session event:', error);
      throw new Error('Failed to get session event');
    }
  }

  /**
   * Update event status
   */
  static async updateEventStatus(
    eventId: string,
    status: SessionEvent['status']
  ): Promise<void> {
    try {
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        status,
        updatedAt: serverTimestamp()
      });
      console.log('Event status updated:', eventId, status);
    } catch (error) {
      console.error('Error updating event status:', error);
      throw new Error('Failed to update event status');
    }
  }

  /**
   * Subscribe to session requests in real-time
   */
  static subscribeToSessionRequests(
    userId: string,
    callback: (requests: SessionRequest[]) => void
  ) {
    console.log('Setting up session requests subscription for user:', userId);

    // Subscribe to sent requests
    const sentQuery = query(
      collection(db, this.SESSION_REQUESTS_COLLECTION),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Subscribe to received requests
    const receivedQuery = query(
      collection(db, this.SESSION_REQUESTS_COLLECTION),
      where('hostId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    let sentRequests: SessionRequest[] = [];
    let receivedRequests: SessionRequest[] = [];

    const updateRequests = () => {
      const allRequests = [...sentRequests, ...receivedRequests].sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
      callback(allRequests);
    };

    const unsubscribeSent = onSnapshot(sentQuery, (querySnapshot) => {
      sentRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionRequest[];
      updateRequests();
    });

    const unsubscribeReceived = onSnapshot(receivedQuery, (querySnapshot) => {
      receivedRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionRequest[];
      updateRequests();
    });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }

  /**
   * Subscribe to user events in real-time
   */
  static subscribeToUserEvents(
    userId: string,
    callback: (events: SessionEvent[]) => void
  ) {
    const organizerQuery = query(
      collection(db, this.EVENTS_COLLECTION),
      where('organizerId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );

    const participantQuery = query(
      collection(db, this.EVENTS_COLLECTION),
      where('participantId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );

    let organizerEvents: SessionEvent[] = [];
    let participantEvents: SessionEvent[] = [];

    const updateEvents = () => {
      const allEvents = [...organizerEvents, ...participantEvents];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      const sortedEvents = uniqueEvents.sort((a, b) => 
        b.scheduledDate.toDate().getTime() - a.scheduledDate.toDate().getTime()
      );
      callback(sortedEvents);
    };

    const unsubscribeOrganizer = onSnapshot(organizerQuery, (querySnapshot) => {
      organizerEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionEvent[];
      updateEvents();
    });

    const unsubscribeParticipant = onSnapshot(participantQuery, (querySnapshot) => {
      participantEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionEvent[];
      updateEvents();
    });

    return () => {
      unsubscribeOrganizer();
      unsubscribeParticipant();
    };
  }

  /**
   * Delete session request
   */
  static async deleteSessionRequest(sessionRequestId: string): Promise<void> {
    try {
      const sessionRequestRef = doc(db, this.SESSION_REQUESTS_COLLECTION, sessionRequestId);
      await updateDoc(sessionRequestRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
      console.log('Session request deleted:', sessionRequestId);
    } catch (error) {
      console.error('Error deleting session request:', error);
      throw new Error('Failed to delete session request');
    }
  }
}
