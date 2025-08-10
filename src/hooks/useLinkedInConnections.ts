import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LinkedInConnectionsService, 
  LinkedInConnectionRequest, 
  ConnectionNotification 
} from '@/services/linkedinConnectionsService';
import { toast } from 'sonner';

export interface ConnectionsState {
  sent: LinkedInConnectionRequest[];
  received: LinkedInConnectionRequest[];
  notifications: ConnectionNotification[];
}

export const useLinkedInConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionsState>({
    sent: [],
    received: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.uid) {
      setConnections({ sent: [], received: [], notifications: [] });
      setLoading(false);
      return;
    }

    console.log('🔗 Setting up LinkedIn connections for user:', user.uid);
    setLoading(true);
    setError(null);

    // Subscribe to connection requests
    const unsubscribeConnections = LinkedInConnectionsService.subscribeToConnections(
      user.uid,
      (connectionData) => {
        console.log('🔄 Connections updated:', connectionData);
        setConnections(prev => ({
          ...prev,
          sent: connectionData.sent,
          received: connectionData.received
        }));
        setLoading(false);
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications = LinkedInConnectionsService.subscribeToConnectionNotifications(
      user.uid,
      (notificationData) => {
        console.log('🔔 Notifications updated:', notificationData);
        setConnections(prev => ({
          ...prev,
          notifications: notificationData
        }));
        
        // Show toast for new connection requests
        const unreadNotifications = notificationData.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
          const latestNotification = unreadNotifications[0];
          if (latestNotification.type === 'connection_request') {
            toast.info('New connection request received!');
          }
        }
      }
    );

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up LinkedIn connections subscriptions');
      unsubscribeConnections();
      unsubscribeNotifications();
    };
  }, [user?.uid]);

  // Send connection request
  const sendConnectionRequest = useCallback(async (data: {
    targetUserId: string;
    message?: string;
  }) => {
    if (!user?.uid) {
      throw new Error('You must be logged in to send connection requests');
    }

    try {
      console.log('🚀 Sending connection request:', data);
      
      const connectionId = await LinkedInConnectionsService.sendConnectionRequest({
        currentUserId: user.uid,
        targetUserId: data.targetUserId,
        message: data.message
      });

      console.log('✅ Connection request sent:', connectionId);
      toast.success('Connection request sent successfully!');
      
      return connectionId;
    } catch (error: any) {
      console.error('❌ Failed to send connection request:', error);
      
      const errorMessage = error?.message || 'Failed to send connection request';
      setError(errorMessage);
      toast.error(errorMessage);
      
      throw error;
    }
  }, [user?.uid]);

  // Respond to connection request
  const respondToConnectionRequest = useCallback(async (data: {
    connectionId: string;
    response: 'accepted' | 'rejected';
  }) => {
    if (!user?.uid) {
      throw new Error('You must be logged in to respond to connection requests');
    }

    try {
      console.log('🔄 Responding to connection request:', data);
      
      await LinkedInConnectionsService.respondToConnectionRequest({
        connectionId: data.connectionId,
        currentUserId: user.uid,
        response: data.response
      });

      const message = data.response === 'accepted' 
        ? 'Connection request accepted!' 
        : 'Connection request declined';
      
      console.log('✅ Response sent:', data.response);
      toast.success(message);
      
    } catch (error: any) {
      console.error('❌ Failed to respond to connection request:', error);
      
      const errorMessage = error?.message || 'Failed to respond to connection request';
      setError(errorMessage);
      toast.error(errorMessage);
      
      throw error;
    }
  }, [user?.uid]);

  // Accept connection request
  const acceptConnection = useCallback(async (connectionId: string) => {
    return respondToConnectionRequest({
      connectionId,
      response: 'accepted'
    });
  }, [respondToConnectionRequest]);

  // Reject connection request
  const rejectConnection = useCallback(async (connectionId: string) => {
    return respondToConnectionRequest({
      connectionId,
      response: 'rejected'
    });
  }, [respondToConnectionRequest]);

  // Get pending received requests
  const getPendingRequests = useCallback(() => {
    return connections.received.filter(connection => connection.status === 'pending');
  }, [connections.received]);

  // Get accepted connections
  const getAcceptedConnections = useCallback(() => {
    return [...connections.sent, ...connections.received].filter(
      connection => connection.status === 'accepted'
    );
  }, [connections.sent, connections.received]);

  // Check if already connected with a user
  const isConnectedWith = useCallback((userId: string) => {
    const allConnections = [...connections.sent, ...connections.received];
    return allConnections.some(connection => 
      connection.status === 'accepted' && 
      (connection.senderId === userId || connection.receiverId === userId)
    );
  }, [connections.sent, connections.received]);

  // Check if there's a pending request (sent or received)
  const hasPendingRequestWith = useCallback((userId: string) => {
    const allConnections = [...connections.sent, ...connections.received];
    return allConnections.some(connection => 
      connection.status === 'pending' && 
      (connection.senderId === userId || connection.receiverId === userId)
    );
  }, [connections.sent, connections.received]);

  // Get connection status with a user
  const getConnectionStatus = useCallback((userId: string): {
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
    connection?: LinkedInConnectionRequest;
  } => {
    // Check sent requests
    const sentConnection = connections.sent.find(connection => 
      connection.receiverId === userId
    );
    
    if (sentConnection) {
      if (sentConnection.status === 'pending') {
        return { status: 'pending_sent', connection: sentConnection };
      }
      if (sentConnection.status === 'accepted') {
        return { status: 'connected', connection: sentConnection };
      }
    }

    // Check received requests
    const receivedConnection = connections.received.find(connection => 
      connection.senderId === userId
    );
    
    if (receivedConnection) {
      if (receivedConnection.status === 'pending') {
        return { status: 'pending_received', connection: receivedConnection };
      }
      if (receivedConnection.status === 'accepted') {
        return { status: 'connected', connection: receivedConnection };
      }
    }

    return { status: 'none' };
  }, [connections.sent, connections.received]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get unread notifications count
  const getUnreadNotificationsCount = useCallback(() => {
    return connections.notifications.filter(n => !n.read).length;
  }, [connections.notifications]);

  // Get connection stats
  const getStats = useCallback(() => {
    return {
      totalConnections: getAcceptedConnections().length,
      pendingRequests: getPendingRequests().length,
      sentRequests: connections.sent.filter(c => c.status === 'pending').length,
      unreadNotifications: getUnreadNotificationsCount()
    };
  }, [connections, getAcceptedConnections, getPendingRequests, getUnreadNotificationsCount]);

  return {
    // State
    connections,
    loading,
    error,

    // Actions
    sendConnectionRequest,
    respondToConnectionRequest,
    acceptConnection,
    rejectConnection,
    clearError,

    // Getters
    getPendingRequests,
    getAcceptedConnections,
    isConnectedWith,
    hasPendingRequestWith,
    getConnectionStatus,
    getUnreadNotificationsCount,
    getStats,

    // Utils
    isAuthenticated: !!user?.uid,
    currentUserId: user?.uid
  };
};

export default useLinkedInConnections;
