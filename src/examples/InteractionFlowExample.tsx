import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import our components and hooks
import ConnectButton from '@/components/ConnectButton';
import BookSessionButton from '@/components/BookSessionButton';
import NotificationBell from '@/components/NotificationBell';
import { useConnectionRequests } from '@/hooks/useConnectionRequests';
import { useSessionRequests } from '@/hooks/useSessionRequests';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import { 
  Users, 
  Calendar, 
  Bell, 
  Clock, 
  Check, 
  X, 
  UserPlus, 
  Video,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const InteractionFlowExample: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Our custom hooks
  const {
    connectionRequests,
    loading: connectionsLoading,
    getPendingReceivedRequests: getPendingConnectionRequests,
    updateConnectionStatus
  } = useConnectionRequests();

  const {
    sessionRequests,
    sessionEvents,
    loading: sessionsLoading,
    getPendingReceivedRequests: getPendingSessionRequests,
    getUpcomingEvents,
    updateSessionRequestStatus
  } = useSessionRequests();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    updateNotificationStatus
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('overview');

  // Mock user data for demonstration
  const mockUsers = [
    {
      id: 'user1',
      name: 'Alice Johnson',
      photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b25d2005?w=150',
      skills: ['React', 'TypeScript', 'Node.js']
    },
    {
      id: 'user2',
      name: 'Bob Smith',
      photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
      skills: ['Python', 'Django', 'PostgreSQL']
    },
    {
      id: 'user3',
      name: 'Carol Davis',
      photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite']
    }
  ];

  const mockSkills = [
    {
      id: 'skill1',
      name: 'Advanced React Patterns',
      teacherId: 'user1',
      teacherName: 'Alice Johnson',
      description: 'Learn advanced React patterns like render props, HOCs, and custom hooks'
    },
    {
      id: 'skill2',
      name: 'Python for Data Science',
      teacherId: 'user2',
      teacherName: 'Bob Smith',
      description: 'Master Python libraries for data analysis and machine learning'
    },
    {
      id: 'skill3',
      name: 'Modern UI Design',
      teacherId: 'user3',
      teacherName: 'Carol Davis',
      description: 'Create beautiful, user-friendly interfaces with modern design principles'
    }
  ];

  // Handle connection request actions
  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
    try {
      await updateConnectionStatus(connectionId, action === 'accept' ? 'accepted' : 'rejected');
      
      // Also update the notification
      const notification = notifications.find(n => n.connectionId === connectionId);
      if (notification?.id) {
        await updateNotificationStatus(notification.id, action === 'accept' ? 'accepted' : 'rejected');
      }

      toast({
        title: action === 'accept' ? 'Connection accepted!' : 'Connection rejected',
        description: `You have ${action === 'accept' ? 'accepted' : 'rejected'} the connection request.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update connection request',
        variant: 'destructive'
      });
    }
  };

  // Handle session request actions
  const handleSessionAction = async (sessionRequestId: string, action: 'approve' | 'decline') => {
    try {
      if (action === 'approve') {
        // For demo purposes, approve with current time + 1 day
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        scheduledDate.setHours(14, 0, 0, 0); // 2 PM tomorrow
        
        await updateSessionRequestStatus(sessionRequestId, 'approved', {
          scheduledDate: scheduledDate as any,
          meetingLink: 'https://meet.google.com/demo-link',
          notes: 'Looking forward to our session!'
        });
      } else {
        await updateSessionRequestStatus(sessionRequestId, 'declined');
      }

      toast({
        title: action === 'approve' ? 'Session approved!' : 'Session declined',
        description: `You have ${action === 'approve' ? 'approved' : 'declined'} the session request.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update session request',
        variant: 'destructive'
      });
    }
  };

  const formatNotificationTime = (createdAt: any) => {
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to see the interaction flow example.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interaction Flow Demo</h1>
          <p className="text-muted-foreground">
            Complete connection and session request system with real-time notifications
          </p>
        </div>
        <NotificationBell />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connections</CardTitle>
                <Users className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectionRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {getPendingConnectionRequests().length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <Calendar className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {getUpcomingEvents().length} upcoming
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Bell className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest connections and sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.senderPhotoURL} />
                      <AvatarFallback>
                        {notification.senderName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                    <Badge variant={notification.status === 'unread' ? 'default' : 'secondary'}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connect Tab */}
        <TabsContent value="connect" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect with Other Users</CardTitle>
              <CardDescription>Send connection requests to other users in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockUsers.map((mockUser) => (
                  <Card key={mockUser.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={mockUser.photoURL} />
                          <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <h3 className="font-semibold">{mockUser.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-2 justify-center">
                            {mockUser.skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ConnectButton
                          targetUserId={mockUser.id}
                          targetUserName={mockUser.name}
                          skillName={mockUser.skills[0]}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Learning Sessions</CardTitle>
              <CardDescription>Request sessions with skill experts in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockSkills.map((skill) => (
                  <Card key={skill.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{skill.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            by {skill.teacherName}
                          </p>
                          <p className="text-sm mt-2">{skill.description}</p>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          <BookSessionButton
                            hostUserId={skill.teacherId}
                            hostUserName={skill.teacherName}
                            skillId={skill.id}
                            skillName={skill.name}
                            size="sm"
                          />
                          <ConnectButton
                            targetUserId={skill.teacherId}
                            targetUserName={skill.teacherName}
                            skillName={skill.name}
                            size="sm"
                            variant="outline"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Connection Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Connection Requests
                  {getPendingConnectionRequests().length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {getPendingConnectionRequests().length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getPendingConnectionRequests().map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.senderPhotoURL} />
                          <AvatarFallback>
                            {request.senderName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.senderName}</p>
                          {request.skillName && (
                            <p className="text-sm text-muted-foreground">
                              Skill: {request.skillName}
                            </p>
                          )}
                          {request.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleConnectionAction(request.id!, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionAction(request.id!, 'reject')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getPendingConnectionRequests().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No pending connection requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Session Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Session Requests
                  {getPendingSessionRequests().length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {getPendingSessionRequests().length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getPendingSessionRequests().map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={request.requesterPhotoURL} />
                            <AvatarFallback>
                              {request.requesterName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.requesterName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.skillName} • {request.sessionType}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {request.preferredDate && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Preferred: {request.preferredDate.toDate().toLocaleDateString()} at {request.preferredDate.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      
                      {request.message && (
                        <p className="text-sm mb-3 p-2 bg-muted rounded">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleSessionAction(request.id!, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSessionAction(request.id!, 'decline')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getPendingSessionRequests().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No pending session requests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  All Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg transition-all ${
                      notification.status === 'unread' || (!notification.status && !notification.read)
                        ? 'border-l-4 border-l-blue-500 bg-blue-50/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.senderPhotoURL} />
                        <AvatarFallback>
                          {notification.senderName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{notification.senderName}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              notification.type === 'connection_request' ? 'default' : 'secondary'
                            }>
                              {notification.type.replace('_', ' ')}
                            </Badge>
                            {(notification.status === 'unread' || (!notification.status && !notification.read)) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id!)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No notifications yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteractionFlowExample;
