import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  User,
  MessageSquare,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SessionService } from '@/lib/database';
import type { Session } from '@/lib/database';
import { Timestamp } from 'firebase/firestore';
import { useConnections } from '@/hooks/useConnections';
import ChatRoom from '@/components/ChatRoom';
import { isSameDay, categorizeSessions } from '@/utils/dateHelpers';

const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connections: allConnections } = useConnections();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadSessions = async () => {
      try {
        const userSessions = await SessionService.getUserSessions(user.uid);
        setSessions(userSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your sessions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to session updates
    const unsubscribe = SessionService.subscribeToUserSessions(user.uid, (updatedSessions) => {
      setSessions(updatedSessions);
    });

    loadSessions();

    return () => unsubscribe();
  }, [user, toast]);

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await SessionService.updateSessionStatus(sessionId, 'confirmed');
      toast({
        title: 'Session Accepted',
        description: 'The session has been confirmed',
      });
    } catch (error) {
      console.error('Error accepting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept session',
        variant: 'destructive'
      });
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      await SessionService.updateSessionStatus(sessionId, 'cancelled');
      toast({
        title: 'Session Declined',
        description: 'The session has been cancelled',
      });
    } catch (error) {
      console.error('Error declining session:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline session',
        variant: 'destructive'
      });
    }
  };

  const handleJoinSession = (session: Session) => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    } else if (session.sessionType === 'phone') {
      // Show instructions for phone session
      toast({
        title: 'Phone Session',
        description: 'Contact details and instructions have been sent via email',
      });
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await SessionService.updateSessionStatus(sessionId, 'completed');
      toast({
        title: 'Session Completed',
        description: 'The session has been marked as completed',
      });
    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark session as completed',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'in-progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSessionTypeIcon = (type: Session['sessionType']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const formatSessionDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    };
  };


  const canJoinSession = (session: Session) => {
    const now = new Date();
    const sessionTime = session.scheduledDate.toDate();
    const timeDiff = sessionTime.getTime() - now.getTime();
    return session.status === 'confirmed' && timeDiff <= 15 * 60 * 1000 && timeDiff >= -30 * 60 * 1000; // 15 min before to 30 min after
  };

  const isSessionUpcoming = (session: Session) => {
    const now = new Date();
    const sessionTime = session.scheduledDate.toDate();
    const timeDiff = sessionTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // Within 1 hour
  };

  // Only allow sessions with users the current user is connected to (accepted)
  const acceptedUserIds = useMemo(() => {
    return new Set(
      allConnections
        .filter(c => c.status === 'accepted')
        .map(c => c.connectedUserId)
    );
  }, [allConnections]);

  const sessionsWithAcceptedOnly = useMemo(() => {
    if (!user) return [] as Session[];
    return sessions.filter(s => {
      const otherUserId = s.organizerId === user.uid ? s.participantId : s.organizerId;
      return acceptedUserIds.has(otherUserId);
    });
  }, [sessions, acceptedUserIds, user]);

  // Date-based categorization via helper
  const now = new Date();
  const { previous: previousSessions, current: currentSessions, next: nextSessions } = useMemo(() => {
    return categorizeSessions(sessionsWithAcceptedOnly, now);
  }, [sessionsWithAcceptedOnly, now]);

  const [chatUser, setChatUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);

  const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
    const { date, time } = formatSessionDate(session.scheduledDate);
    const isOrganizer = session.organizerId === user?.uid;
    const otherUser = isOrganizer ? {
      name: session.participantName,
      photoURL: session.participantPhotoURL
    } : {
      name: session.organizerName,
      photoURL: session.organizerPhotoURL
    };

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
              <div>
                <CardTitle className="text-lg">{session.skillName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isOrganizer ? 'Teaching' : 'Learning'} with {otherUser.name}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              {getSessionTypeIcon(session.sessionType)}
              <span className="capitalize">{session.sessionType}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.photoURL} />
              <AvatarFallback>
                {otherUser.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherUser.name}</p>
              <p className="text-sm text-muted-foreground">
                {isOrganizer ? 'Student' : 'Teacher'}
              </p>
            </div>
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock3 className="w-4 h-4 text-muted-foreground" />
              <span>{session.duration} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Location (for in-person sessions) */}
          {session.sessionType === 'in-person' && session.location && (
            <div className="flex items-center space-x-2 text-sm bg-accent/10 p-2 rounded">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{session.location}</span>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div className="text-sm bg-accent/10 p-2 rounded">
              <p className="font-medium mb-1">Notes:</p>
              <p>{session.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Pending sessions - Accept/Decline */}
            {session.status === 'pending' && !isOrganizer && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAcceptSession(session.id)}
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeclineSession(session.id)}
                  className="flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </Button>
              </>
            )}

            {/* Confirmed sessions - Join when time is near */}
            {session.status === 'confirmed' && canJoinSession(session) && (
              <Button
                size="sm"
                onClick={() => handleJoinSession(session)}
                className="flex items-center space-x-1"
              >
                {session.sessionType === 'video' && <Video className="w-4 h-4" />}
                {session.sessionType === 'phone' && <Phone className="w-4 h-4" />}
                {session.sessionType === 'in-person' && <MapPin className="w-4 h-4" />}
                <span>Join Session</span>
              </Button>
            )}

            {/* In progress - Mark as complete */}
            {session.status === 'in-progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteSession(session.id)}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </Button>
            )}

            {/* Meeting link for video/phone sessions */}
            {session.meetingLink && (session.status === 'confirmed' || session.status === 'in-progress') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(session.meetingLink, '_blank')}
                className="flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Meeting Link</span>
              </Button>
            )}

            {/* Chat button */}
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center space-x-1"
              onClick={() => {
                const otherId = isOrganizer ? session.participantId : session.organizerId;
                const otherName = isOrganizer ? session.participantName : session.organizerName;
                const otherAvatar = isOrganizer ? session.participantPhotoURL : session.organizerPhotoURL;
                setChatUser({ id: otherId, name: otherName, avatar: otherAvatar });
              }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </Button>
          </div>

          {/* Upcoming session alert */}
          {isSessionUpcoming(session) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Session starting soon!
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Sessions</h1>
          <p className="text-muted-foreground">
            Manage your learning and teaching sessions
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {sessionsWithAcceptedOnly.length} total sessions
        </Badge>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="previous">
            Previous ({previousSessions.length})
          </TabsTrigger>
          <TabsTrigger value="current">
            Current ({currentSessions.length})
          </TabsTrigger>
          <TabsTrigger value="next">
            Next ({nextSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="previous" className="space-y-4">
          {previousSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No previous sessions</p>
                <p className="text-muted-foreground">
                  Completed or past sessions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previousSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {currentSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No sessions today</p>
                <p className="text-muted-foreground">
                  Sessions scheduled for today will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="next" className="space-y-4">
          {nextSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No upcoming sessions</p>
                <p className="text-muted-foreground">
                  Schedule a new session to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Modal */}
      <Dialog open={!!chatUser} onOpenChange={(open) => !open && setChatUser(null)}>
        <DialogContent className="max-w-2xl h-[600px]">
          <DialogHeader>
            <DialogTitle>Chat with {chatUser?.name}</DialogTitle>
          </DialogHeader>
          {chatUser && (
            <div className="h-[500px]">
              <ChatRoom
                otherUserId={chatUser.id}
                otherUserName={chatUser.name}
                otherUserAvatar={chatUser.avatar}
                className="h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManagement;
