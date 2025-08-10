import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  Clock,
  User,
  Calendar,
  MessageCircle,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationsService, NotificationData } from '@/services/notificationsService';
import { ConnectionsService } from '@/services/connectionsService';
import { SessionService } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time subscription to notifications
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Setting up notification subscription for user:', user.uid);
    
    const unsubscribe = NotificationsService.subscribeToUserNotifications(
      user.uid,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        const unread = updatedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up notification subscription');
      unsubscribe();
    };
  }, [user?.uid]);

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationId) return;
    
    try {
      await NotificationsService.markAsRead(notificationId);
      toast({
        title: 'Notification marked as read',
        duration: 2000
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      console.error('Error marking all as read:', error);
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
      // Update connection status in database
      await ConnectionsService.updateConnectionStatus(notification.connectionId, 'accepted');
      
      // Update notification status
      await NotificationsService.updateNotificationStatus(notification.id, 'accepted');

      toast({
        title: 'Connection accepted',
        description: `You are now connected with ${notification.senderName}`,
      });
    } catch (error) {
      console.error('Error accepting connection:', error);
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
      // Update connection status in database
      await ConnectionsService.updateConnectionStatus(notification.connectionId, 'rejected');
      
      // Update notification status
      await NotificationsService.updateNotificationStatus(notification.id, 'rejected');

      toast({
        title: 'Connection rejected',
        description: 'Connection request has been declined',
      });
    } catch (error) {
      console.error('Error rejecting connection:', error);
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
      setIsOpen(false);
      navigate(`/sessions/${notification.sessionId}`);
    }
  };

  // Handle deleting notification
  const handleDeleteNotification = async (notificationId: string) => {
    if (!notificationId) return;

    try {
      await NotificationsService.deleteNotification(notificationId);
      toast({
        title: 'Notification deleted',
        duration: 2000
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
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
        return <Calendar className="w-4 h-4" />;
      case 'connection_request':
        return <User className="w-4 h-4" />;
      case 'connection_update':
        return <User className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'session_request':
        return 'text-blue-600 bg-blue-50';
      case 'connection_request':
        return 'text-green-600 bg-green-50';
      case 'connection_update':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Notification item component
  const NotificationItem: React.FC<{ notification: NotificationData }> = ({ notification }) => (
    <Card className={`mb-3 transition-all duration-200 hover:shadow-md ${
      !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Sender Avatar */}
          <Avatar className="w-10 h-10 flex-shrink-0">
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
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <Badge 
                    variant={notification.status === 'pending' ? 'default' : 'secondary'}
                    className={
                      notification.type === 'connection_update'
                        ? (notification.status === 'accepted' 
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-red-100 text-red-700 border border-red-300')
                        : ''
                    }
                  >
                    {notification.status}
                  </Badge>
                </div>

                {/* Message */}
                <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {notification.message}
                </p>

                {/* Skill name if available */}
                {notification.skillName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Skill: {notification.skillName}
                  </p>
                )}

                {/* Time and read status */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
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
              <div className="flex space-x-2 mt-3">
                {notification.type === 'connection_request' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptConnection(notification)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectConnection(notification)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
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
                    <Calendar className="w-4 h-4 mr-1" />
                    View Session
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className="w-96 p-0 shadow-xl"
        sideOffset={5}
      >
        <Card className="border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs text-muted-foreground">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id || Math.random().toString()} 
                      notification={notification} 
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
