import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionsService, ConnectionRequest } from '@/services/connectionsService';

export const useConnectionRequests = () => {
  const { user } = useAuth();
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setConnectionRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      // Subscribe to real-time connection requests
      unsubscribe = ConnectionsService.subscribeToConnectionRequests(user.uid, (requests) => {
        setConnectionRequests(requests);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up connection requests subscription:', err);
      setError('Failed to load connection requests');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const createConnectionRequest = async (data: {
    recipientId: string;
    skillName?: string;
    message?: string;
  }) => {
    if (!user?.uid) {
      throw new Error('User must be authenticated to create connection requests');
    }

    try {
      const requestId = await ConnectionsService.createConnectionRequest({
        ...data,
        senderId: user.uid,
      });
      return requestId;
    } catch (err) {
      console.error('Error creating connection request:', err);
      throw new Error('Failed to create connection request');
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await ConnectionsService.updateConnectionStatus(connectionId, status);
    } catch (err) {
      console.error('Error updating connection status:', err);
      throw new Error('Failed to update connection status');
    }
  };

  const deleteConnectionRequest = async (connectionId: string) => {
    try {
      await ConnectionsService.deleteConnectionRequest(connectionId);
    } catch (err) {
      console.error('Error deleting connection request:', err);
      throw new Error('Failed to delete connection request');
    }
  };

  // Helper functions to filter requests
  const getSentRequests = () => {
    return connectionRequests.filter(req => req.senderId === user?.uid);
  };

  const getReceivedRequests = () => {
    return connectionRequests.filter(req => req.recipientId === user?.uid);
  };

  const getPendingRequests = () => {
    return connectionRequests.filter(req => req.status === 'pending');
  };

  const getPendingReceivedRequests = () => {
    return connectionRequests.filter(req => 
      req.recipientId === user?.uid && req.status === 'pending'
    );
  };

  const getAcceptedRequests = () => {
    return connectionRequests.filter(req => req.status === 'accepted');
  };

  const getRejectedRequests = () => {
    return connectionRequests.filter(req => req.status === 'rejected');
  };

  return {
    connectionRequests,
    loading,
    error,
    createConnectionRequest,
    updateConnectionStatus,
    deleteConnectionRequest,
    getSentRequests,
    getReceivedRequests,
    getPendingRequests,
    getPendingReceivedRequests,
    getAcceptedRequests,
    getRejectedRequests,
  };
};
