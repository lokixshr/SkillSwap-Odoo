import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { MeetingRoom } from './database';

/**
 * Meeting Link Generation Service
 * Generates unique meeting links for video/phone calls
 */
export class MeetingService {
  private static COLLECTION = 'meeting_rooms';

  /**
   * Generate a unique room ID
   */
  private static generateRoomId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `skillswap-${timestamp}-${random}`;
  }

  /**
   * Create Jitsi meeting link
   */
  static createJitsiMeeting(sessionId: string, hostUserId: string, guestUserId: string): MeetingRoom {
    const roomId = this.generateRoomId();
    const meetingUrl = `https://meet.jit.si/${roomId}`;
    
    // Jitsi meetings expire after 24 hours of inactivity
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    return {
      sessionId,
      roomId,
      meetingUrl,
      provider: 'jitsi',
      isActive: true,
      createdAt: serverTimestamp() as any,
      expiresAt: serverTimestamp() as any,
      hostUserId,
      guestUserId
    };
  }

  /**
   * Create Daily.co meeting link (requires API key)
   */
  static async createDailyMeeting(sessionId: string, hostUserId: string, guestUserId: string): Promise<MeetingRoom | null> {
    try {
      const apiKey = import.meta.env.VITE_DAILY_API_KEY;
      if (!apiKey) {
        console.warn('Daily.co API key not configured, falling back to Jitsi');
        return null;
      }

      const roomName = this.generateRoomId();
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            max_participants: 2,
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status}`);
      }

      const roomData = await response.json();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return {
        sessionId,
        roomId: roomData.name,
        meetingUrl: roomData.url,
        provider: 'daily',
        isActive: true,
        createdAt: serverTimestamp() as any,
        expiresAt: serverTimestamp() as any,
        hostUserId,
        guestUserId
      };
    } catch (error) {
      console.error('Error creating Daily.co meeting:', error);
      return null;
    }
  }

  /**
   * Create Google Meet link (requires Google API)
   */
  static async createGoogleMeetMeeting(sessionId: string, hostUserId: string, guestUserId: string): Promise<MeetingRoom | null> {
    try {
      // Note: This would require Google Calendar API setup and OAuth
      // For now, we'll create a placeholder implementation
      console.warn('Google Meet integration requires Google Calendar API setup');
      
      // Fallback to Jitsi for now
      return null;
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      return null;
    }
  }

  /**
   * Generate meeting link based on preference (with fallback)
   */
  static async generateMeetingLink(
    sessionId: string, 
    hostUserId: string, 
    guestUserId: string,
    preferredProvider: 'jitsi' | 'daily' | 'google_meet' | 'zoom' = 'jitsi'
  ): Promise<MeetingRoom> {
    let meetingRoom: MeetingRoom | null = null;

    // Try preferred provider first
    switch (preferredProvider) {
      case 'daily':
        meetingRoom = await this.createDailyMeeting(sessionId, hostUserId, guestUserId);
        break;
      case 'google_meet':
        meetingRoom = await this.createGoogleMeetMeeting(sessionId, hostUserId, guestUserId);
        break;
      case 'jitsi':
      default:
        meetingRoom = this.createJitsiMeeting(sessionId, hostUserId, guestUserId);
        break;
    }

    // Fallback to Jitsi if preferred provider failed
    if (!meetingRoom) {
      console.log(`${preferredProvider} failed, falling back to Jitsi`);
      meetingRoom = this.createJitsiMeeting(sessionId, hostUserId, guestUserId);
    }

    // Save to database
    try {
      const meetingRef = await addDoc(collection(db, this.COLLECTION), meetingRoom);
      meetingRoom.id = meetingRef.id;
      
      console.log('Meeting room created:', meetingRoom);
      return meetingRoom;
    } catch (error) {
      console.error('Error saving meeting room to database:', error);
      throw new Error('Failed to save meeting room');
    }
  }

  /**
   * Deactivate meeting room
   */
  static async deactivateMeetingRoom(meetingRoomId: string): Promise<void> {
    try {
      const meetingRef = doc(db, this.COLLECTION, meetingRoomId);
      await updateDoc(meetingRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      console.log('Meeting room deactivated:', meetingRoomId);
    } catch (error) {
      console.error('Error deactivating meeting room:', error);
      throw new Error('Failed to deactivate meeting room');
    }
  }

  /**
   * Generate phone call instructions
   */
  static generatePhoneCallInstructions(hostName: string, participantName: string): string {
    return `
📞 Phone Call Session Instructions:

1. ${hostName} will initiate the call
2. ${participantName} should be ready to receive the call
3. Please exchange phone numbers through the chat before the session
4. Recommended duration: Plan for the scheduled session length
5. Have a backup communication method ready (chat/email)

Tips for a great phone session:
• Find a quiet location
• Use headphones if available
• Have pen and paper ready for notes
• Speak clearly and ask for clarification when needed
    `.trim();
  }

  /**
   * Generate in-person meeting instructions
   */
  static generateInPersonInstructions(location: string, hostName: string, participantName: string): string {
    return `
📍 In-Person Session Instructions:

Meeting Location: ${location}

Before the meeting:
• ${hostName} and ${participantName} should confirm the exact meeting spot
• Exchange contact information for last-minute coordination
• Plan to arrive 5-10 minutes early
• Bring any necessary materials or resources

Safety reminders:
• Meet in public, well-lit locations
• Let someone know your meeting plans
• Trust your instincts and stay safe
• Have a backup communication plan
    `.trim();
  }

  /**
   * Create comprehensive session instructions
   */
  static createSessionInstructions(
    sessionType: 'video' | 'phone' | 'in-person',
    meetingRoom?: MeetingRoom,
    location?: string,
    hostName: string = 'Host',
    participantName: string = 'Participant'
  ): string {
    const baseInstructions = `
🎯 Session Instructions for ${hostName} and ${participantName}
    `;

    switch (sessionType) {
      case 'video':
        return `${baseInstructions}

💻 Video Call Session:
Meeting Link: ${meetingRoom?.meetingUrl || 'To be provided'}
Meeting ID: ${meetingRoom?.roomId || 'To be provided'}

How to join:
1. Click the meeting link 5 minutes before the session
2. Allow camera and microphone permissions
3. Test your audio/video before the session starts
4. Use headphones to prevent echo

Platform: ${meetingRoom?.provider || 'Jitsi Meet'}
${meetingRoom?.provider === 'jitsi' ? '• No account required\n• Works in any modern web browser' : ''}

Backup plan: If video fails, use the chat to exchange phone numbers.`;

      case 'phone':
        return baseInstructions + '\n\n' + this.generatePhoneCallInstructions(hostName, participantName);

      case 'in-person':
        return baseInstructions + '\n\n' + this.generateInPersonInstructions(location || 'TBD', hostName, participantName);

      default:
        return baseInstructions + '\n\nSession details will be provided soon.';
    }
  }
}
