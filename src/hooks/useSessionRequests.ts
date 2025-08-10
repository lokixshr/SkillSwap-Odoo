import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService, SessionRequest, SessionEvent } from '@/services/sessionService';
import { Timestamp } from 'firebase/firestore';

export const useSessionRequests = () => {
  const { user } = useAuth();
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setSessionRequests([]);
      setSessionEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribeRequests: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;

    try {
      // Subscribe to real-time session requests
      unsubscribeRequests = SessionService.subscribeToSessionRequests(user.uid, (requests) => {
        setSessionRequests(requests);
        setLoading(false);
      });

      // Subscribe to real-time session events
      unsubscribeEvents = SessionService.subscribeToUserEvents(user.uid, (events) => {
        setSessionEvents(events);
      });
    } catch (err) {
      console.error('Error setting up session subscriptions:', err);
      setError('Failed to load session requests');
      setLoading(false);
    }

    return () => {
      if (unsubscribeRequests) {
        unsubscribeRequests();
      }
      if (unsubscribeEvents) {
        unsubscribeEvents();
      }
    };
  }, [user?.uid]);

  const createSessionRequest = async (data: {
    hostId: string;
    skillId?: string;
    skillName: string;
    sessionType: 'video' | 'phone' | 'in-person';
    preferredDate?: Timestamp;
    duration?: number;
    message?: string;
    location?: string;
  }) => {
    if (!user?.uid) {
      throw new Error('User must be authenticated to create session requests');
    }

    try {
      const requestId = await SessionService.createSessionRequest({
        ...data,
        requesterId: user.uid,
      });
      return requestId;
    } catch (err) {
      console.error('Error creating session request:', err);
      throw new Error('Failed to create session request');
    }
  };

  const updateSessionRequestStatus = async (
    sessionRequestId: string, 
    status: 'approved' | 'declined',
    eventData?: {
      scheduledDate: Timestamp;
      meetingLink?: string;
      notes?: string;
    }
  ) => {
    try {
      const eventId = await SessionService.updateSessionRequestStatus(sessionRequestId, status, eventData);
      return eventId;
    } catch (err) {
      console.error('Error updating session request status:', err);
      throw new Error('Failed to update session request status');
    }
  };

  const updateEventStatus = async (eventId: string, status: SessionEvent['status']) => {
    try {
      await SessionService.updateEventStatus(eventId, status);
    } catch (err) {
      console.error('Error updating event status:', err);
      throw new Error('Failed to update event status');
    }
  };

  const deleteSessionRequest = async (sessionRequestId: string) => {
    try {
      await SessionService.deleteSessionRequest(sessionRequestId);
    } catch (err) {
      console.error('Error deleting session request:', err);
      throw new Error('Failed to delete session request');
    }
  };

  // Helper functions to filter session requests
  const getSentRequests = () => {
    return sessionRequests.filter(req => req.requesterId === user?.uid);
  };

  const getReceivedRequests = () => {
    return sessionRequests.filter(req => req.hostId === user?.uid);
  };

  const getPendingRequests = () => {
    return sessionRequests.filter(req => req.status === 'pending');
  };

  const getPendingReceivedRequests = () => {
    return sessionRequests.filter(req => 
      req.hostId === user?.uid && req.status === 'pending'
    );
  };

  const getApprovedRequests = () => {
    return sessionRequests.filter(req => req.status === 'approved');
  };

  const getDeclinedRequests = () => {
    return sessionRequests.filter(req => req.status === 'declined');
  };

  const getCompletedRequests = () => {
    return sessionRequests.filter(req => req.status === 'completed');
  };

  // Helper functions to filter session events
  const getUpcomingEvents = () => {
    const now = new Date();
    return sessionEvents.filter(event => 
      event.status === 'scheduled' && 
      event.scheduledDate.toDate() > now
    ).sort((a, b) => a.scheduledDate.toDate().getTime() - b.scheduledDate.toDate().getTime());
  };

  const getPastEvents = () => {
    const now = new Date();
    return sessionEvents.filter(event => 
      event.scheduledDate.toDate() <= now
    ).sort((a, b) => b.scheduledDate.toDate().getTime() - a.scheduledDate.toDate().getTime());
  };

  const getCompletedEvents = () => {
    return sessionEvents.filter(event => event.status === 'completed');
  };

  const getCancelledEvents = () => {
    return sessionEvents.filter(event => event.status === 'cancelled');
  };

  const getEventsByStatus = (status: SessionEvent['status']) => {
    return sessionEvents.filter(event => event.status === status);
  };

  // Get events where user is organizer
  const getOrganizedEvents = () => {
    return sessionEvents.filter(event => event.organizerId === user?.uid);
  };

  // Get events where user is participant
  const getParticipatingEvents = () => {
    return sessionEvents.filter(event => event.participantId === user?.uid);
  };

  return {
    sessionRequests,
    sessionEvents,
    loading,
    error,
    createSessionRequest,
    updateSessionRequestStatus,
    updateEventStatus,
    deleteSessionRequest,
    // Request filters
    getSentRequests,
    getReceivedRequests,
    getPendingRequests,
    getPendingReceivedRequests,
    getApprovedRequests,
    getDeclinedRequests,
    getCompletedRequests,
    // Event filters
    getUpcomingEvents,
    getPastEvents,
    getCompletedEvents,
    getCancelledEvents,
    getEventsByStatus,
    getOrganizedEvents,
    getParticipatingEvents,
  };
};
