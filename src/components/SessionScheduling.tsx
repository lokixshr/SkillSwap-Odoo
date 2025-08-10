import React, { useState, useEffect } from 'react';
import { Calendar, Video, Phone, MapPin, Clock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SessionService, UserService } from '@/lib/database';
import { MeetingService } from '@/lib/meetingService';
import { Timestamp } from 'firebase/firestore';

interface SessionSchedulingProps {
  participantId: string;
  skillName: string;
  onBack?: () => void;
  onSessionCreated?: (sessionId: string) => void;
}

const SessionScheduling: React.FC<SessionSchedulingProps> = ({ 
  participantId, 
  skillName, 
  onBack, 
  onSessionCreated 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [participantProfile, setParticipantProfile] = useState<any>(null);
  const [sessionType, setSessionType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  // Load participant profile
  useEffect(() => {
    const loadParticipantProfile = async () => {
      try {
        const profile = await UserService.getUserProfile(participantId);
        setParticipantProfile(profile);
      } catch (error) {
        console.error('Error loading participant profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load participant information',
          variant: 'destructive'
        });
      }
    };

    loadParticipantProfile();
  }, [participantId, toast]);

  const handleSessionTypeChange = (type: 'video' | 'phone' | 'in-person') => {
    setSessionType(type);
    if (type !== 'in-person') {
      setLocation(''); // Clear location for video/phone calls
    }
  };

  const handleScheduleSession = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time for the session',
        variant: 'destructive'
      });
      return;
    }

    if (sessionType === 'in-person' && !location.trim()) {
      toast({
        title: 'Location Required',
        description: 'Please specify a location for in-person sessions',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create scheduled date timestamp
      const scheduledDateTime = new Date(`${selectedDate} ${selectedTime}`);
      const scheduledTimestamp = Timestamp.fromDate(scheduledDateTime);

      // Create base session data
      const sessionData = {
        organizerId: user.uid,
        participantId,
        organizerName: user.displayName || user.email || 'Unknown',
        participantName: participantProfile?.displayName || 'Unknown',
        organizerPhotoURL: user.photoURL,
        participantPhotoURL: participantProfile?.photoURL,
        skillName,
        description: notes.trim() || undefined,
        sessionType,
        scheduledDate: scheduledTimestamp,
        duration,
        status: 'pending' as const,
        location: sessionType === 'in-person' ? location : undefined,
        notes: notes.trim() || undefined
      };

      // Create the session
      const sessionId = await SessionService.createSession(sessionData);

      // Generate meeting link for video/phone sessions
      if (sessionType === 'video' || sessionType === 'phone') {
        try {
          const meetingRoom = await MeetingService.generateMeetingLink(
            sessionId,
            user.uid,
            participantId,
            'jitsi' // Default to Jitsi for now
          );

          // Update session with meeting link
          await SessionService.updateSessionStatus(sessionId, 'pending', {
            meetingLink: meetingRoom.meetingUrl,
            meetingId: meetingRoom.roomId
          });

          console.log('Meeting link generated:', meetingRoom.meetingUrl);
        } catch (error) {
          console.error('Error generating meeting link:', error);
          // Don't fail the session creation if meeting link generation fails
        }
      }

      toast({
        title: 'Session Scheduled!',
        description: `Your ${sessionType} session has been scheduled with ${participantProfile?.displayName}`,
        duration: 5000
      });

      onSessionCreated?.(sessionId);

    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Failed to schedule the session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!participantProfile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-xl">Schedule Session</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Set up a learning session with {participantProfile.displayName}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Participant Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={participantProfile.photoURL} />
              <AvatarFallback>
                {participantProfile.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{participantProfile.displayName}</h3>
              <p className="text-muted-foreground">{participantProfile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">Intermediate</Badge>
                <span className="text-sm text-muted-foreground">Skill: {skillName}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={sessionType === 'video' ? 'default' : 'outline'}
              onClick={() => handleSessionTypeChange('video')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Video className="w-6 h-6" />
              <span>Video</span>
            </Button>
            <Button
              variant={sessionType === 'phone' ? 'default' : 'outline'}
              onClick={() => handleSessionTypeChange('phone')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Phone className="w-6 h-6" />
              <span>Phone</span>
            </Button>
            <Button
              variant={sessionType === 'in-person' ? 'default' : 'outline'}
              onClick={() => handleSessionTypeChange('in-person')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <MapPin className="w-6 h-6" />
              <span>In-Person</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date and Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              placeholder="Pick a date"
            />
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-xs"
                >
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="duration">Duration (minutes):</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              min="15"
              max="240"
              step="15"
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location (In-Person Only) */}
      {sessionType === 'in-person' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Meeting Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g. Central Library, Main Branch, Study Room 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Please specify a public, safe location for your in-person session
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any specific topics you'd like to cover or special requirements..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Schedule Button */}
      <div className="flex justify-end space-x-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        <Button
          onClick={handleScheduleSession}
          disabled={isSubmitting || !selectedDate || !selectedTime}
          className="px-8"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Scheduling...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Schedule Session</span>
            </div>
          )}
        </Button>
      </div>

      {/* Session Preview */}
      {selectedDate && selectedTime && (
        <Card className="bg-accent/10">
          <CardHeader>
            <CardTitle className="text-lg">Session Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>With:</strong> {participantProfile.displayName}</p>
              <p><strong>Skill:</strong> {skillName}</p>
              <p><strong>Type:</strong> {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session</p>
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Duration:</strong> {duration} minutes</p>
              {sessionType === 'in-person' && location && (
                <p><strong>Location:</strong> {location}</p>
              )}
              {notes && <p><strong>Notes:</strong> {notes}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionScheduling;
