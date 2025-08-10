import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationsService } from '@/services/notificationsService';
import { ConnectionService, SessionService, UserService } from '@/lib/database';

/**
 * Example integration showing how to trigger notifications
 * when users send session requests or connection requests
 */
const NotificationIntegration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Example: Send connection request with notification
  const handleSendConnectionRequest = async (
    targetUserId: string,
    skillName: string
  ) => {
    if (!user) return;

    try {
      // 1. Get current user profile for sender info
      const senderProfile = await UserService.getUserProfile(user.uid);
      if (!senderProfile) throw new Error('Sender profile not found');

      // 2. Create connection in database
      const connectionId = await ConnectionService.createConnection({
        userId: user.uid,
        connectedUserId: targetUserId,
        skillName,
        status: 'pending',
        message: `I'd like to connect with you for ${skillName}!`
      });

      // 3. Create notification for recipient
      await NotificationsService.createConnectionRequestNotification(
        targetUserId, // recipient
        user.uid, // sender
        senderProfile.displayName || 'Someone',
        skillName,
        connectionId,
        senderProfile.photoURL
      );

      toast({
        title: 'Connection request sent!',
        description: 'The user will be notified of your request.',
      });

    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive'
      });
    }
  };

  // Example: Send session request with notification
  const handleSendSessionRequest = async (
    targetUserId: string,
    skillName: string,
    sessionType: 'video' | 'phone' | 'in-person',
    scheduledDate: Date,
    description?: string
  ) => {
    if (!user) return;

    try {
      // 1. Get current user profile for sender info
      const senderProfile = await UserService.getUserProfile(user.uid);
      const targetProfile = await UserService.getUserProfile(targetUserId);
      
      if (!senderProfile || !targetProfile) {
        throw new Error('User profiles not found');
      }

      // 2. Create session in database
      const sessionId = await SessionService.createSession({
        organizerId: user.uid,
        participantId: targetUserId,
        organizerName: senderProfile.displayName || 'Unknown',
        participantName: targetProfile.displayName || 'Unknown',
        organizerPhotoURL: senderProfile.photoURL,
        participantPhotoURL: targetProfile.photoURL,
        skillName,
        description,
        sessionType,
        scheduledDate: scheduledDate as any, // Convert to Timestamp
        duration: 60, // default 60 minutes
        status: 'pending'
      });

      // 3. Create notification for participant
      await NotificationsService.createSessionRequestNotification(
        targetUserId, // recipient
        user.uid, // sender
        senderProfile.displayName || 'Someone',
        skillName,
        sessionId,
        senderProfile.photoURL
      );

      toast({
        title: 'Session request sent!',
        description: 'The user will be notified of your session request.',
      });

    } catch (error) {
      console.error('Error sending session request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send session request',
        variant: 'destructive'
      });
    }
  };

  // Example: Handle connection response (accept/reject)
  const handleConnectionResponse = async (
    connectionId: string,
    notificationId: string,
    response: 'accepted' | 'rejected'
  ) => {
    try {
      // 1. Update connection status
      await ConnectionService.updateConnectionStatus(connectionId, response);
      
      // 2. Update notification status
      await NotificationsService.updateNotificationStatus(notificationId, response);

      toast({
        title: `Connection ${response}`,
        description: `You have ${response} the connection request.`,
      });

    } catch (error) {
      console.error(`Error ${response} connection:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${response} connection`,
        variant: 'destructive'
      });
    }
  };

  // Demo functions for testing
  const sendTestConnectionRequest = () => {
    // Replace with actual target user ID and skill
    const targetUserId = 'demo-user-id';
    const skillName = 'React Development';
    handleSendConnectionRequest(targetUserId, skillName);
  };

  const sendTestSessionRequest = () => {
    // Replace with actual target user ID and skill
    const targetUserId = 'demo-user-id';
    const skillName = 'TypeScript';
    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    handleSendSessionRequest(targetUserId, skillName, 'video', scheduledDate, 'Let\'s learn TypeScript together!');
  };

  if (!user) {
    return <div>Please log in to test notifications.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Notification Integration Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Connection Request</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Send a connection request that triggers a notification to the recipient.
            </p>
            <Button onClick={sendTestConnectionRequest}>
              Send Test Connection Request
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Session Request</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Send a session request that triggers a notification to the participant.
            </p>
            <Button onClick={sendTestSessionRequest}>
              Send Test Session Request
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Integration Points:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Call <code>NotificationsService.createConnectionRequestNotification()</code> when creating connections</li>
              <li>Call <code>NotificationsService.createSessionRequestNotification()</code> when creating sessions</li>
              <li>Use <code>NotificationsService.updateNotificationStatus()</code> when handling responses</li>
              <li>Real-time updates happen automatically via Firestore listeners</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationIntegration;
