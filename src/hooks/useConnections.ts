import { useState, useEffect } from 'react';
import { ConnectionService, Connection } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConnections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      // Subscribe to user connections
      unsubscribe = ConnectionService.subscribeToUserConnections(user.uid, (newConnections) => {
        setConnections(newConnections);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up connections subscription:', err);
      setError('Failed to load connections');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const createConnection = async (connectionData: Omit<Connection, 'id' | 'timestamp'>) => {
    if (!user) {
      throw new Error('User must be authenticated to create connections');
    }

    try {
      const connectionId = await ConnectionService.createConnection(connectionData);
      return connectionId;
    } catch (err) {
      console.error('Error creating connection:', err);
      throw new Error('Failed to create connection');
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: Connection['status']) => {
    try {
      await ConnectionService.updateConnectionStatus(connectionId, status);
    } catch (err) {
      console.error('Error updating connection status:', err);
      throw new Error('Failed to update connection status');
    }
  };

  const getPendingConnections = () => {
    return connections.filter(conn => conn.status === 'pending');
  };

  const getAcceptedConnections = () => {
    return connections.filter(conn => conn.status === 'accepted');
  };

  const getCompletedConnections = () => {
    return connections.filter(conn => conn.status === 'completed');
  };

  return {
    connections,
    loading,
    error,
    createConnection,
    updateConnectionStatus,
    getPendingConnections,
    getAcceptedConnections,
    getCompletedConnections,
  };
}; 