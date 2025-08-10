import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConnectionsService } from '@/services/connectionsService';
import { UserPlus, Check, X, Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConnectButtonProps {
  targetUserId: string;
  targetUserName: string;
  skillName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  targetUserId,
  targetUserName,
  skillName = '',
  size = 'md',
  variant = 'default',
  className = '',
  showText = true
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [customSkillName, setCustomSkillName] = useState(skillName);

  useEffect(() => {
    checkConnectionStatus();
  }, [user?.uid, targetUserId]);

  const checkConnectionStatus = async () => {
    if (!user?.uid || user.uid === targetUserId) return;

    try {
      // Check if users are already friends
      const areFriends = await ConnectionsService.areFriends(user.uid, targetUserId);
      if (areFriends) {
        setConnectionStatus('connected');
        return;
      }

      // Check for pending connection requests
      const userConnections = await ConnectionsService.getUserConnectionRequests(user.uid);
      const existingConnection = userConnections.find(conn => 
        (conn.senderId === user.uid && conn.recipientId === targetUserId) ||
        (conn.senderId === targetUserId && conn.recipientId === user.uid)
      );

      if (existingConnection && existingConnection.status === 'pending') {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

const handleConnect = async () => {
    // Enhanced validation
    if (!user?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to send connection requests',
        variant: 'destructive'
      });
      return;
    }

    if (!targetUserId || targetUserId.trim() === '') {
      toast({
        title: 'Invalid Target',
        description: 'Cannot send connection request to invalid user',
        variant: 'destructive'
      });
      return;
    }

    if (user.uid === targetUserId) {
      toast({
        title: 'Error',
        description: 'Cannot send connection request to yourself',
        variant: 'destructive'
      });
      return;
    }

    // Log the attempt for debugging
    console.log('🔄 Attempting connection request:', {
      senderId: user.uid,
      recipientId: targetUserId,
      senderIdType: typeof user.uid,
      recipientIdType: typeof targetUserId,
      skillName: customSkillName || skillName
    });

    setLoading(true);
    try {
      const connectionData = {
        recipientId: targetUserId,
        senderId: user.uid,
        skillName: customSkillName || skillName,
        message: message.trim() || undefined
      };

      // Final validation log
      console.log('📤 Final connection data being sent:', connectionData);

      await ConnectionsService.createConnectionRequest(connectionData);

      setConnectionStatus('pending');
      setDialogOpen(false);
      setMessage('');

      toast({
        title: 'Connection request sent!',
        description: `Your connection request has been sent to ${targetUserName}`,
      });
    } catch (error) {
      console.error('❌ Connection creation error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to send connection request. Please try again.';
      
      if (error.message.includes('Sender and recipient IDs are required')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('Cannot connect to yourself')) {
        errorMessage = 'Cannot send connection request to yourself.';
      } else if (error.message.includes('Connection request already exists')) {
        errorMessage = 'You already have a pending connection request with this user.';
      } else if (error.message.includes('already connected')) {
        errorMessage = 'You are already connected with this user.';
      }
      
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for self
  if (!user?.uid || user.uid === targetUserId) {
    return null;
  }

  const getButtonContent = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <>
            <Check className="w-4 h-4" />
            {showText && <span>Connected</span>}
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4" />
            {showText && <span>Pending</span>}
          </>
        );
      default:
        return (
          <>
            <UserPlus className="w-4 h-4" />
            {showText && <span>Connect</span>}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'outline' as const;
      case 'pending':
        return 'ghost' as const;
      default:
        return variant;
    }
  };

  if (connectionStatus === 'connected' || connectionStatus === 'pending') {
    return (
      <Button
        variant={getButtonVariant()}
        size={size}
        className={`${className} ${connectionStatus === 'connected' ? 'text-green-600 border-green-300' : ''}`}
        disabled
      >
        {getButtonContent()}
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          {getButtonContent()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Connection Request</DialogTitle>
          <DialogDescription>
            Send a connection request to {targetUserName}. You can include a personal message.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="skill">Skill (optional)</Label>
            <Input
              id="skill"
              placeholder="What skill would you like to learn/teach?"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="message">Personal Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={`Hi ${targetUserName}, I'd like to connect with you...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectButton;
