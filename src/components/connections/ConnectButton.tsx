import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  UserPlus, 
  UserCheck, 
  Clock, 
  MessageCircle,
  Loader2
} from 'lucide-react';
import { useLinkedInConnections } from '@/hooks/useLinkedInConnections';
import { toast } from 'sonner';

interface ConnectButtonProps {
  targetUserId: string;
  targetUserName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  targetUserId,
  targetUserName = 'this user',
  className,
  variant = 'default',
  size = 'default',
  showText = true
}) => {
  const {
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    getConnectionStatus,
    isAuthenticated,
    currentUserId,
    loading: connectionsLoading
  } = useLinkedInConnections();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Don't show button for own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const { status, connection } = getConnectionStatus(targetUserId);

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      await sendConnectionRequest({
        targetUserId,
        message: message.trim() || undefined
      });
      setIsDialogOpen(false);
      setMessage('');
    } catch (error) {
      // Error is handled in the hook with toast
      console.error('Failed to send connection request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connection?.id) return;
    try {
      setIsLoading(true);
      await acceptConnection(connection.id);
    } catch (error) {
      console.error('Failed to accept connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!connection?.id) return;
    try {
      setIsLoading(true);
      await rejectConnection(connection.id);
    } catch (error) {
      console.error('Failed to reject connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while connections are loading
  if (connectionsLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  // Connection status-based rendering
  switch (status) {
    case 'connected':
      return (
        <Button 
          variant="outline" 
          size={size} 
          className={className}
          disabled
        >
          <UserCheck className="h-4 w-4" />
          {showText && <span className="ml-2">Connected</span>}
        </Button>
      );

    case 'pending_sent':
      return (
        <Button 
          variant="outline" 
          size={size} 
          className={className}
          disabled
        >
          <Clock className="h-4 w-4" />
          {showText && <span className="ml-2">Request Sent</span>}
        </Button>
      );

    case 'pending_received':
      return (
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size={size} 
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            {showText && <span className="ml-2">Accept</span>}
          </Button>
          <Button 
            variant="outline" 
            size={size} 
            onClick={handleReject}
            disabled={isLoading}
          >
            {showText ? 'Decline' : '×'}
          </Button>
        </div>
      );

    case 'none':
    default:
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              className={className}
            >
              <UserPlus className="h-4 w-4" />
              {showText && <span className="ml-2">Connect</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Connection Request</DialogTitle>
              <DialogDescription>
                Send a connection request to {targetUserName}. You can include a personal message.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Personal Message (Optional)
                </label>
                <Textarea
                  id="message"
                  placeholder={`Hi ${targetUserName}, I'd like to connect with you on SkillSwap!`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setMessage('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendRequest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
  }
};

export default ConnectButton;
