import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SessionService } from '@/services/sessionService';
import { Calendar, Video, Phone, MapPin, Clock, Check } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Timestamp } from 'firebase/firestore';

interface BookSessionButtonProps {
  hostUserId: string;
  hostUserName: string;
  skillId?: string;
  skillName: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

const BookSessionButton: React.FC<BookSessionButtonProps> = ({
  hostUserId,
  hostUserName,
  skillId,
  skillName,
  size = 'md',
  variant = 'default',
  className = '',
  showText = true
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');

  const handleBookSession = async () => {
    if (!user?.uid || user.uid === hostUserId) {
      toast({
        title: 'Error',
        description: 'Cannot book a session with yourself',
        variant: 'destructive'
      });
      return;
    }

    if (!preferredDate || !preferredTime) {
      toast({
        title: 'Error',
        description: 'Please select a preferred date and time',
        variant: 'destructive'
      });
      return;
    }

    if (sessionType === 'in-person' && !location.trim()) {
      toast({
        title: 'Error',
        description: 'Please specify a location for in-person sessions',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into a Timestamp
      const dateTime = new Date(`${preferredDate}T${preferredTime}`);
      const preferredTimestamp = Timestamp.fromDate(dateTime);

      await SessionService.createSessionRequest({
        hostId: hostUserId,
        requesterId: user.uid,
        skillId,
        skillName,
        sessionType,
        preferredDate: preferredTimestamp,
        duration: parseInt(duration, 10),
        message: message.trim() || undefined,
        location: sessionType === 'in-person' ? location.trim() : undefined
      });

      setDialogOpen(false);
      resetForm();

      toast({
        title: 'Session request sent!',
        description: `Your session request has been sent to ${hostUserName}`,
      });
    } catch (error) {
      console.error('Error sending session request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send session request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSessionType('video');
    setPreferredDate('');
    setPreferredTime('');
    setDuration('60');
    setMessage('');
    setLocation('');
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Don't show button for self
  if (!user?.uid || user.uid === hostUserId) {
    return null;
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get current time for minimum time if today is selected
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          <Calendar className="w-4 h-4" />
          {showText && <span>Book Session</span>}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Session</DialogTitle>
          <DialogDescription>
            Request a session with {hostUserName} for {skillName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Session Type */}
          <div className="grid gap-3">
            <Label>Session Type</Label>
            <RadioGroup
              value={sessionType}
              onValueChange={(value: 'video' | 'phone' | 'in-person') => setSessionType(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center space-x-2 cursor-pointer">
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="flex items-center space-x-2 cursor-pointer">
                  <Phone className="w-4 h-4" />
                  <span>Phone Call</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person" className="flex items-center space-x-2 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  <span>In Person</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                min={preferredDate === today ? currentTime : undefined}
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location (for in-person sessions) */}
          {sessionType === 'in-person' && (
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Where would you like to meet?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          )}

          {/* Message */}
          <div className="grid gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={`Hi ${hostUserName}, I'd like to book a session to learn ${skillName}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
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
            onClick={() => handleDialogOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookSession}
            disabled={loading || !preferredDate || !preferredTime}
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

export default BookSessionButton;
