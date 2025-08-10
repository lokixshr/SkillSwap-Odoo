import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  Calendar,
  User,
  Eye,
  Trash2,
  MoreVertical,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationsService, NotificationData } from '@/services/notificationsService';
import { ConnectionService, SessionService } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'unread' | 'session_request' | 'connection_request';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Real-time subscription to notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = NotificationsService.subscribeToUserNotifications(
      user.uid,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'session_request':
        return notification.type === 'session_request';
      case 'connection_request':
        return notification.type === 'connection_request';
      default:
        return true;
    }
  });

  // Get counts for each filter
  const getFilterCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      session_request: notifications.filter(n => n.type === 'session_request').length,
      connection_request: notifications.filter(n => n.type === 'connection_request').length,
    };
  };

  const counts = getFilterCounts();

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationsService.markAsRead(notificationId);
      toast({
        title: 'Marked as read',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await NotificationsService.markAllAsRead(user.uid);
      toast({
        title: 'All notifications marked as read',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  };

  // Handle accepting connection request
  const handleAcceptConnection = async (notification: NotificationData) => {
    if (!notification.connectionId || !notification.id) return;

    try {
      await ConnectionService.updateConnectionStatus(notification.connectionId, 'accepted');
      await NotificationsService.updateNotificationStatus(notification.id, 'accepted');

      toast({
        title: 'Connection accepted',
        description: `You are now connected with ${notification.senderName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept connection',
        variant: 'destructive'
      });
    }
  };

  // Handle rejecting connection request
  const handleRejectConnection = async (notification: NotificationData) => {
    if (!notification.connectionId || !notification.id) return;

    try {
      await ConnectionService.updateConnectionStatus(notification.connectionId, 'rejected');
      await NotificationsService.updateNotificationStatus(notification.id, 'rejected');

      toast({
        title: 'Connection rejected',
        description: 'Connection request has been declined',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject connection',
        variant: 'destructive'
      });
    }
  };

  // Handle viewing session details
  const handleViewSession = (notification: NotificationData) => {
    if (notification.sessionId) {
      navigate(`/sessions/${notification.sessionId}`);
    }
  };

  // Handle deleting notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationsService.deleteNotification(notificationId);
      toast({
        title: 'Notification deleted',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  // Format notification time
  const formatNotificationTime = (createdAt: any) => {
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'session_request':
        return <Calendar className="w-5 h-5" />;
      case 'connection_request':
        return <User className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'session_request':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'connection_request':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Notification item component
  const NotificationItem: React.FC<{ notification: NotificationData }> = ({ notification }) => (
    <Card className={`mb-4 transition-all duration-200 hover:shadow-lg ${
      !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Sender Avatar */}
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage 
              src={notification.senderPhotoURL} 
              alt={notification.senderName} 
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
              {notification.senderName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header with icon and status */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-full border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={notification.status === 'pending' ? 'default' : 'secondary'}>
                      {notification.status}
                    </Badge>
                    {getStatusIcon(notification.status)}
                    {!notification.read && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        New
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Message */}
                <h3 className={`text-base mb-1 ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {notification.message}
                </h3>

                {/* Skill name and details */}
                {notification.skillName && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Skill:</span> {notification.skillName}
                  </p>
                )}

                {/* Time */}
                <p className="text-sm text-gray-500">
                  {formatNotificationTime(notification.createdAt)}
                </p>
              </div>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.read && (
                    <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id!)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteNotification(notification.id!)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Action buttons based on notification type */}
            {notification.status === 'pending' && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {notification.type === 'connection_request' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptConnection(notification)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept Connection
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectConnection(notification)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {notification.type === 'session_request' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewSession(notification)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Session Details
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return <div>Please log in to view notifications.</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Bell className="w-8 h-8" />
            <span>Notifications</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay up to date with your connections and sessions
          </p>
        </div>
        {counts.unread > 0 && (
          <Button onClick={handleMarkAllAsRead} className="shrink-0">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All Read ({counts.unread})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>All</span>
            <Badge variant="secondary">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <span>Unread</span>
            <Badge variant="secondary">{counts.unread}</Badge>
          </TabsTrigger>
          <TabsTrigger value="session_request" className="flex items-center space-x-2">
            <span>Sessions</span>
            <Badge variant="secondary">{counts.session_request}</Badge>
          </TabsTrigger>
          <TabsTrigger value="connection_request" className="flex items-center space-x-2">
            <span>Connections</span>
            <Badge variant="secondary">{counts.connection_request}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'all' ? 'No notifications' : `No ${filter.replace('_', ' ')} notifications`}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You're all caught up! New notifications will appear here." 
                  : `No ${filter.replace('_', ' ')} notifications to show.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem 
              key={notification.id || Math.random().toString()} 
              notification={notification} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
