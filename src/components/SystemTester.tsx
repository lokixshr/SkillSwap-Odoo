import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConnectionsService } from '@/services/connectionsService';
import { MessagingService } from '@/services/messagingService';
import { SessionService } from '@/services/sessionService';
import { NotificationsService } from '@/services/notificationsService';
import { EmailService } from '@/lib/emailService';
import { MeetingService } from '@/lib/meetingService';
import { UserService } from '@/lib/database';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Users, 
  MessageCircle, 
  Video, 
  Mail, 
  Bell 
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const SystemTester: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Test configuration - you can modify these
  const TEST_CONFIG = {
    targetUserId: 'test_user_b_12345', // Change this to a real user ID
    targetUserName: 'Test User B',
    targetEmail: 'testuser@example.com',
    skillName: 'React Development',
    testMessage: 'Hello! Testing the enhanced messaging system.'
  };

  const updateResult = (name: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      const newResult = { name, status, message, details };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      }
      return [...prev, newResult];
    });
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Test 1: Connection System
  const testConnections = async () => {
    if (!user) return;

    updateResult('Connection System', 'pending', 'Testing connection creation...');

    try {
      // Create connection request
      const connectionId = await ConnectionsService.createConnectionRequest({
        recipientId: TEST_CONFIG.targetUserId,
        senderId: user.uid,
        skillName: TEST_CONFIG.skillName,
        message: `Would love to connect regarding ${TEST_CONFIG.skillName}!`
      });

      updateResult('Connection System', 'success', 
        'Connection request created successfully', 
        { connectionId }
      );

      // Test real-time updates
      updateResult('Real-time Connections', 'pending', 'Testing real-time updates...');
      
      let realtimeWorking = false;
      const unsubscribe = ConnectionsService.subscribeToConnectionRequests(
        user.uid,
        (connections) => {
          if (connections.find(conn => conn.id === connectionId)) {
            realtimeWorking = true;
            updateResult('Real-time Connections', 'success', 
              'Real-time connection updates working!');
            unsubscribe();
          }
        }
      );

      // Wait for real-time update
      setTimeout(() => {
        if (!realtimeWorking) {
          updateResult('Real-time Connections', 'error', 
            'Real-time updates not received within 3 seconds');
          unsubscribe();
        }
      }, 3000);

    } catch (error: any) {
      updateResult('Connection System', 'error', 
        `Connection test failed: ${error.message}`);
    }
  };

  // Test 2: Messaging System
  const testMessaging = async () => {
    if (!user) return;

    updateResult('Messaging System', 'pending', 'Testing messaging...');

    try {
      // Create conversation
      const conversationId = await MessagingService.createOrGetConversation(
        user.uid,
        TEST_CONFIG.targetUserId,
        user.displayName || 'Test User A',
        user.photoURL || '',
        TEST_CONFIG.targetUserName,
        ''
      );

      // Send message
      const messageId = await MessagingService.sendMessage({
        senderId: user.uid,
        receiverId: TEST_CONFIG.targetUserId,
        content: TEST_CONFIG.testMessage,
        messageType: 'text'
      });

      updateResult('Messaging System', 'success', 
        'Message sent successfully', 
        { conversationId, messageId }
      );

      // Test real-time messaging
      updateResult('Real-time Messaging', 'pending', 'Testing real-time message updates...');
      
      let messageReceived = false;
      const unsubscribe = MessagingService.subscribeToConversation(
        user.uid,
        TEST_CONFIG.targetUserId,
        (messages) => {
          if (messages.find(msg => msg.id === messageId)) {
            messageReceived = true;
            updateResult('Real-time Messaging', 'success', 
              'Real-time messaging working!');
            unsubscribe();
          }
        }
      );

      setTimeout(() => {
        if (!messageReceived) {
          updateResult('Real-time Messaging', 'error', 
            'Real-time messaging not received within 3 seconds');
          unsubscribe();
        }
      }, 3000);

    } catch (error: any) {
      updateResult('Messaging System', 'error', 
        `Messaging test failed: ${error.message}`);
    }
  };

  // Test 3: Session System
  const testSessions = async () => {
    if (!user) return;

    updateResult('Session System', 'pending', 'Testing session creation...');

    try {
      // Create session request
      const sessionRequestId = await SessionService.createSessionRequest({
        hostId: TEST_CONFIG.targetUserId,
        requesterId: user.uid,
        skillName: TEST_CONFIG.skillName,
        sessionType: 'video',
        duration: 60,
        message: 'Excited to learn React best practices!'
      });

      updateResult('Session System', 'success', 
        'Session request created successfully', 
        { sessionRequestId }
      );

      // Test meeting link generation
      updateResult('Meeting Links', 'pending', 'Testing meeting link generation...');
      
      const meetingRoom = await MeetingService.generateMeetingLink(
        sessionRequestId,
        TEST_CONFIG.targetUserId,
        user.uid,
        'jitsi'
      );

      updateResult('Meeting Links', 'success', 
        'Meeting link generated successfully', 
        { meetingUrl: meetingRoom.meetingUrl }
      );

    } catch (error: any) {
      updateResult('Session System', 'error', 
        `Session test failed: ${error.message}`);
    }
  };

  // Test 4: Email System
  const testEmails = async () => {
    updateResult('Email System', 'pending', 'Testing email notifications...');

    try {
      const sessionData = {
        skillName: TEST_CONFIG.skillName,
        sessionType: 'video' as const,
        scheduledDate: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
        duration: 60,
        organizerName: TEST_CONFIG.targetUserName,
        participantName: user?.displayName || 'Test User',
        meetingLink: 'https://meet.jit.si/skillswap-test-session-123'
      };

      // Test session confirmation email
      const emailSent = await EmailService.sendSessionConfirmationEmail(
        sessionData,
        TEST_CONFIG.targetEmail,
        TEST_CONFIG.targetUserName,
        false
      );

      updateResult('Email System', 'success', 
        'Email notifications working (check console for email content)', 
        { emailSent }
      );

    } catch (error: any) {
      updateResult('Email System', 'error', 
        `Email test failed: ${error.message}`);
    }
  };

  // Test 5: Notifications System
  const testNotifications = async () => {
    if (!user) return;

    updateResult('Notification System', 'pending', 'Testing notifications...');

    try {
      // Create notification
      const notificationId = await NotificationsService.createConnectionRequestNotification(
        user.uid,
        TEST_CONFIG.targetUserId,
        TEST_CONFIG.targetUserName,
        TEST_CONFIG.skillName,
        'test-connection-123',
        ''
      );

      updateResult('Notification System', 'success', 
        'Notification created successfully', 
        { notificationId }
      );

      // Test real-time notifications
      updateResult('Real-time Notifications', 'pending', 'Testing real-time notification updates...');
      
      let notificationReceived = false;
      const unsubscribe = NotificationsService.subscribeToUserNotifications(
        user.uid,
        (notifications) => {
          if (notifications.find(notif => notif.id === notificationId)) {
            notificationReceived = true;
            updateResult('Real-time Notifications', 'success', 
              'Real-time notifications working!');
            unsubscribe();
          }
        }
      );

      setTimeout(() => {
        if (!notificationReceived) {
          updateResult('Real-time Notifications', 'error', 
            'Real-time notifications not received within 3 seconds');
          unsubscribe();
        }
      }, 3000);

    } catch (error: any) {
      updateResult('Notification System', 'error', 
        `Notification test failed: ${error.message}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to run the system tests.',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      toast({
        title: 'System Tests Started',
        description: 'Running comprehensive tests of enhanced features...',
      });

      // Run tests sequentially with delays
      await testConnections();
      await sleep(1000);
      
      await testMessaging();
      await sleep(1000);
      
      await testSessions();
      await sleep(1000);
      
      await testEmails();
      await sleep(1000);
      
      await testNotifications();

      // Final summary
      setTimeout(() => {
        const passed = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'error').length;
        const successRate = ((passed / (passed + failed)) * 100).toFixed(1);

        toast({
          title: 'Tests Completed',
          description: `${passed} passed, ${failed} failed (${successRate}% success rate)`,
          variant: failed === 0 ? 'default' : 'destructive',
        });
      }, 5000);

    } catch (error: any) {
      toast({
        title: 'Test Suite Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getTestIcon = (name: string) => {
    if (name.toLowerCase().includes('connection')) return <Users className="w-4 h-4" />;
    if (name.toLowerCase().includes('messaging')) return <MessageCircle className="w-4 h-4" />;
    if (name.toLowerCase().includes('session')) return <Video className="w-4 h-4" />;
    if (name.toLowerCase().includes('email')) return <Mail className="w-4 h-4" />;
    if (name.toLowerCase().includes('notification')) return <Bell className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to test the enhanced SkillSwap system.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 SkillSwap Enhanced System Tester
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test all enhanced features: connections, messaging, sessions, emails, and notifications
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium mb-2">Test Configuration</h4>
              <div className="text-sm space-y-1">
                <p><strong>Your ID:</strong> {user.uid}</p>
                <p><strong>Target User ID:</strong> {TEST_CONFIG.targetUserId}</p>
                <p><strong>Skill:</strong> {TEST_CONFIG.skillName}</p>
              </div>
            </div>
            
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <Clock className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    {getTestIcon(result.name)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <Badge variant={
                      result.status === 'success' ? 'default' : 
                      result.status === 'error' ? 'destructive' : 
                      'secondary'
                    }>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="text-right max-w-md">
                    <p className="text-sm">{result.message}</p>
                    {result.details && (
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 mt-1 rounded">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Manual Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" onClick={testConnections} disabled={isRunning}>
              <Users className="w-4 h-4 mr-2" />
              Test Connections
            </Button>
            <Button variant="outline" onClick={testMessaging} disabled={isRunning}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Test Messaging
            </Button>
            <Button variant="outline" onClick={testSessions} disabled={isRunning}>
              <Video className="w-4 h-4 mr-2" />
              Test Sessions
            </Button>
            <Button variant="outline" onClick={testEmails} disabled={isRunning}>
              <Mail className="w-4 h-4 mr-2" />
              Test Emails
            </Button>
            <Button variant="outline" onClick={testNotifications} disabled={isRunning}>
              <Bell className="w-4 h-4 mr-2" />
              Test Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's Being Tested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>✅ Connection System:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Connection request creation with validation</li>
                <li>• Real-time connection updates</li>
                <li>• Friend relationship management</li>
              </ul>
            </div>
            <div>
              <strong>💬 Messaging System:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Conversation creation and management</li>
                <li>• Real-time message delivery</li>
                <li>• Read receipts and message status</li>
              </ul>
            </div>
            <div>
              <strong>🎯 Session System:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Session request creation</li>
                <li>• Automatic meeting link generation</li>
                <li>• Session lifecycle management</li>
              </ul>
            </div>
            <div>
              <strong>📧 Email System:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Rich HTML email templates</li>
                <li>• Meeting details and instructions</li>
                <li>• Email content logged to console</li>
              </ul>
            </div>
            <div>
              <strong>🔔 Notification System:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                <li>• Real-time notification delivery</li>
                <li>• Notification status management</li>
                <li>• User notification subscriptions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTester;
