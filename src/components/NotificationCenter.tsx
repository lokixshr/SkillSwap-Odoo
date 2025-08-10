import React, { useState } from 'react';
import { Bell, Check, X, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationData } from '@/services/notificationsService';
import { ConnectionsService } from '@/services/connectionsService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    updateNotificationStatus
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationId) return;
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: 'All notifications marked as read',
        description: `All notifications have been marked as read`
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

  const handleConnectionAction = async (notificationId: string, connectionId: string | undefined, action: 'accept' | 'reject') => {
    if (!connectionId) {
      console.error('No connection ID provided');
      return;
    }
    
    try {
      await ConnectionsService.updateConnectionStatus(connectionId, action === 'accept' ? 'accepted' : 'rejected');
      await updateNotificationStatus(notificationId, action === 'accept' ? 'accepted' : 'rejected');
      
      toast({
        title: `Connection ${action}ed`,
        description: `You have ${action}ed the connection request`,
      });
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} connection request`,
        variant: 'destructive'
      });
    }
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'session_request':
        return <Calendar className="w-4 h-4" />;
      case 'connection_request':
        return <User className="w-4 h-4" />;
      case 'connection_update':
        return <Check className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'session_request': return 'text-blue-600';
      case 'connection_request': return 'text-green-600';
      case 'connection_update': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const isUnread = (notification: NotificationData) => {
    if ('read' in notification && typeof notification.read === 'boolean') {
      return !notification.read;
    }
    return notification.status === 'unread' || notification.status === 'pending';
  };

  const NotificationItem: React.FC<{ notification: NotificationData }> = ({ notification }) => {
    const unread = isUnread(notification);
    
    return (
      <div 
        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
          unread 
            ? 'bg-accent/20 hover:bg-accent/30 border-primary/20' 
            : 'bg-background hover:bg-accent/50'
        }`}
        onClick={() => unread && notification.id && handleMarkAsRead(notification.id)}
      >
        <div className="flex items-start space-x-3">
          {notification.senderPhotoURL ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src={notification.senderPhotoURL} />
              <AvatarFallback>
                {notification.senderName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)} bg-current/10`}>
              {getNotificationIcon(notification.type)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm ${unread ? 'font-medium' : 'text-muted-foreground'}`}>
                  {notification.message}
                </p>
                
                {notification.type === 'connection_request' && notification.status === 'pending' && (
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionAction(notification.id!, notification.connectionId, 'accept');
                      }}
                      className="h-7 px-3"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionAction(notification.id!, notification.connectionId, 'reject');
                      }}
                      className="h-7 px-3"
                    >
                      Decline
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                  {unread && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </div>
              
              {unread && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    notification.id && handleMarkAsRead(notification.id);
                  }}
                  className="ml-2 p-1 h-auto"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-lg">
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
              <div className="p-3 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                  onClick={() => setIsOpen(false)}
                >
                  View All Notifications
                </Button>
              </div>
            </>
          )}
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
