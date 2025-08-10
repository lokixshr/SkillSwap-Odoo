import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, MapPin, MessageCircle, Video, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserService } from "@/lib/database";
import { ConnectionsService } from "@/services/connectionsService";
import { useToast } from "@/hooks/use-toast";
import { NotificationsService } from "@/services/notificationsService";

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillPost: any;
  userProfile?: any;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ 
  open, 
  onOpenChange, 
  skillPost, 
  userProfile 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState<"video" | "phone" | "in-person">("video");
  const [loading, setLoading] = useState(false);
  const [existingStatus, setExistingStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");
  const [checkingExisting, setCheckingExisting] = useState(false);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const handleSendConnection = async () => {
    // Enhanced validation
    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in to send connection requests.",
        variant: "destructive",
      });
      return;
    }

    if (!skillPost?.userId || skillPost.userId.trim() === '') {
      toast({
        title: "Invalid Skill Post",
        description: "Cannot send connection request - invalid skill post data.",
        variant: "destructive",
      });
      return;
    }

    if (user.uid === skillPost.userId) {
      toast({
        title: "Invalid Request",
        description: "Cannot send connection request to yourself.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to introduce yourself.",
        variant: "destructive",
      });
      return;
    }

    // Log the attempt for debugging
    console.log('🔄 ConnectionModal attempting connection request:', {
      senderId: user.uid,
      recipientId: skillPost.userId,
      senderIdType: typeof user.uid,
      recipientIdType: typeof skillPost.userId,
      skillName: skillPost.skillName,
      messageLength: message.trim().length
    });

    setLoading(true);
    try {
      // 1. Get current user profile for sender info
      const senderProfile = await UserService.getUserProfile(user.uid);
      if (!senderProfile) throw new Error('Sender profile not found');

      const connectionData = {
        senderId: user.uid,
        recipientId: skillPost.userId,
        skillName: skillPost.skillName,
        message: message.trim()
      };

      // Final validation log
      console.log('📤 ConnectionModal final connection data being sent:', connectionData);

      // 2. Create connection request using the new service
      const connectionId = await ConnectionsService.createConnectionRequest(connectionData);

      // 3. Create notification for recipient
      await NotificationsService.createConnectionRequestNotification(
        skillPost.userId, // recipient
        user.uid, // sender
        senderProfile.displayName || 'Someone',
        skillPost.skillName,
        connectionId,
        senderProfile.photoURL
      );

      toast({
        title: "Connection request sent!",
        description: "The user will be notified of your request.",
      });

      onOpenChange(false);
      setStep(1);
      setMessage("");
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error) {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check existing connection status whenever modal opens or target changes
  useEffect(() => {
    const checkExisting = async () => {
      if (!open) return;
      if (!user?.uid || !skillPost?.userId) return;
      if (user.uid === skillPost.userId) return;
      setCheckingExisting(true);
      try {
        const existing = await ConnectionsService.getExistingConnection(user.uid, skillPost.userId);
        if (existing) {
          setExistingStatus(existing.status);
        } else {
          setExistingStatus("none");
        }
      } catch (_err) {
        setExistingStatus("none");
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExisting();
  }, [open, user?.uid, skillPost?.userId]);

  const handleScheduleSession = async () => {
    if (!user || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      // 1. Get current user profile for sender info
      const senderProfile = await UserService.getUserProfile(user.uid);
      if (!senderProfile) throw new Error('Sender profile not found');

      // 2. Create connection request with scheduling info
      const connectionId = await ConnectionsService.createConnectionRequest({
        senderId: user.uid,
        recipientId: skillPost.userId,
        skillName: skillPost.skillName,
        message: `${message}\n\nScheduled session: ${format(selectedDate, 'PPP')} at ${selectedTime} (${sessionType})`
      });

      // 3. Create notification for session request
      await NotificationsService.createSessionRequestNotification(
        skillPost.userId, // recipient
        user.uid, // sender
        senderProfile.displayName || 'Someone',
        skillPost.skillName,
        connectionId, // Using connectionId as sessionId for now
        senderProfile.photoURL
      );

      toast({
        title: "Session scheduled!",
        description: "Your session request has been sent with scheduling details.",
      });

      onOpenChange(false);
      setStep(1);
      setMessage("");
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: "Error",
        description: "Failed to schedule session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    return userProfile?.displayName || skillPost.userDisplayName || "User";
  };

  const getAvatar = () => {
    return userProfile?.photoURL || skillPost.userPhotoURL || "";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Connect with {getDisplayName()}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={getAvatar()} />
              <AvatarFallback>{getDisplayName().charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{getDisplayName()}</h3>
              <p className="text-sm text-muted-foreground">{skillPost.skillName}</p>
              <Badge variant="outline" className="mt-1">{skillPost.proficiencyLevel}</Badge>
            </div>
          </div>

          {/* Steps */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you'd like to connect..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                {(existingStatus === "pending" || existingStatus === "accepted") && (
                  <div className="text-sm text-muted-foreground">
                    {existingStatus === "pending" && "A connection request is already pending with this user."}
                    {existingStatus === "accepted" && "You are already connected with this user."}
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSendConnection}
                    disabled={!message.trim() || loading || checkingExisting || existingStatus === "pending" || existingStatus === "accepted"}
                  >
                    {loading ? "Sending..." : checkingExisting ? "Checking..." : "Send Connection Request"}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionModal; 