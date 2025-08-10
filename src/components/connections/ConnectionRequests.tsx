import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  MessageSquare,
  Users,
  Loader2,
  InboxIcon
} from 'lucide-react';
import { useLinkedInConnections } from '@/hooks/useLinkedInConnections';
import { format } from 'date-fns';

interface ConnectionRequestsProps {
  className?: string;
}

export const ConnectionRequests: React.FC<ConnectionRequestsProps> = ({ className }) => {
  const {
    connections,
    loading,
    acceptConnection,
    rejectConnection,
    getPendingRequests,
    getStats
  } = useLinkedInConnections();

  const pendingRequests = getPendingRequests();
  const stats = getStats();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading connections...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
            {stats.pendingRequests > 0 && (
              <Badge variant="default" className="ml-2">
                {stats.pendingRequests}
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Manage your pending connection requests
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">No pending connection requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request, index) => (
              <ConnectionRequestCard 
                key={request.id || index}
                request={request}
                onAccept={() => request.id && acceptConnection(request.id)}
                onReject={() => request.id && rejectConnection(request.id)}
              />
            ))}
          </div>
        )}

        {(connections.sent.length > 0 || connections.received.length > 0) && (
          <>
            <Separator />
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Total connections:</span>
                <span className="font-medium">{stats.totalConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Sent requests:</span>
                <span className="font-medium">{stats.sentRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending requests:</span>
                <span className="font-medium">{stats.pendingRequests}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface ConnectionRequestCardProps {
  request: any;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({
  request,
  onAccept,
  onReject
}) => {
  const [isLoading, setIsLoading] = React.useState<'accept' | 'reject' | null>(null);

  const handleAccept = async () => {
    try {
      setIsLoading('accept');
      await onAccept();
    } catch (error) {
      console.error('Failed to accept connection:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading('reject');
      await onReject();
    } catch (error) {
      console.error('Failed to reject connection:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      if (timestamp?.toDate) {
        return format(timestamp.toDate(), 'MMM d, yyyy');
      }
      if (timestamp?.seconds) {
        return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy');
      }
      return 'Recently';
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback>
              {request.senderId?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">
              Connection Request
            </h4>
            <p className="text-xs text-gray-600">
              From: {request.senderId}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(request.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      </div>

      {request.message && (
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">{request.message}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isLoading !== null}
          className="flex-1"
        >
          {isLoading === 'accept' ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Accepting...
            </>
          ) : (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Accept
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={isLoading !== null}
          className="flex-1"
        >
          {isLoading === 'reject' ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Declining...
            </>
          ) : (
            <>
              <UserX className="h-3 w-3 mr-1" />
              Decline
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConnectionRequests;
