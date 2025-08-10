import { Timestamp } from 'firebase/firestore';

// Enhanced interface for better type safety
interface SessionEmailData {
  id?: string;
  skillName: string;
  sessionType: 'video' | 'phone' | 'in-person';
  scheduledDate: Timestamp;
  duration: number;
  meetingLink?: string;
  location?: string;
  notes?: string;
  organizerId: string;
  organizerName?: string;
  participantId: string;
  participantName?: string;
}

interface EmailRequest {
  type: 'session-request' | 'session-confirmation' | 'session-reminder' | 'session-cancellation' | 'connection-request';
  session?: SessionEmailData;
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  isOrganizer?: boolean;
  cancelledBy?: string;
  meetingLink?: string;
  customMessage?: string;
  additionalData?: Record<string, any>;
}

export class EmailService {
  private static readonly EMAIL_ENDPOINTS = {
    development: '/api/send-email', // Local development
    production: 'https://your-email-api.com/send', // Production endpoint
  };

  private static getEmailEndpoint(): string {
    return process.env.NODE_ENV === 'production' 
      ? this.EMAIL_ENDPOINTS.production 
      : this.EMAIL_ENDPOINTS.development;
  }

  /**
   * Format date for email templates
   */
  private static formatDate(timestamp: Timestamp): string {
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date TBD';
    }
  }

  /**
   * Generate HTML email template
   */
  private static generateEmailTemplate({
    title,
    greeting,
    content,
    meetingInfo,
    callToAction,
    footer
  }: {
    title: string;
    greeting: string;
    content: string;
    meetingInfo?: string;
    callToAction?: string;
    footer?: string;
  }): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .meeting-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .logo { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🎯 SkillSwap</div>
        <h1>${title}</h1>
      </div>
      <div class="content">
        <p><strong>${greeting}</strong></p>
        ${content}
        ${meetingInfo ? `<div class="meeting-info">${meetingInfo}</div>` : ''}
        ${callToAction ? `<div style="text-align: center;">${callToAction}</div>` : ''}
        ${footer || '<p>Best regards,<br/>The SkillSwap Team</p>'}
      </div>
      <div class="footer">
        <p>This email was sent from SkillSwap - Connecting learners and teachers worldwide</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
    `;
  }

  private static async sendEmailRequest(data: EmailRequest): Promise<boolean> {
    try {
      // For now, simulate email sending and log the content
      console.log('📧 EMAIL SIMULATION - Would send email:', {
        to: data.recipientEmail,
        type: data.type,
        subject: this.getEmailSubject(data),
        content: this.getEmailContent(data)
      });

      // In a real implementation, you would uncomment this:
      /*
      const response = await fetch(this.getEmailEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          to: data.recipientEmail,
          subject: this.getEmailSubject(data),
          html: this.getEmailContent(data),
          ...data
        })
      });

      if (!response.ok) {
        console.error('Email API error:', await response.text());
        return false;
      }

      const result = await response.json();
      return result.success;
      */

      // Simulate successful email sending
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Get email subject based on type
   */
  private static getEmailSubject(data: EmailRequest): string {
    switch (data.type) {
      case 'session-request':
        return `🎯 New Session Request from ${data.senderName} - ${data.session?.skillName}`;
      case 'session-confirmation':
        return `✅ Session Confirmed - ${data.session?.skillName} on ${data.session ? this.formatDate(data.session.scheduledDate).split(',')[0] : 'TBD'}`;
      case 'session-reminder':
        return `⏰ Session Reminder - ${data.session?.skillName} ${data.type.includes('24h') ? 'Tomorrow' : 'Starting Soon'}`;
      case 'session-cancellation':
        return `❌ Session Cancelled - ${data.session?.skillName}`;
      case 'connection-request':
        return `🤝 New Connection Request from ${data.senderName}`;
      default:
        return '📧 SkillSwap Notification';
    }
  }

  /**
   * Generate email content based on type
   */
  private static getEmailContent(data: EmailRequest): string {
    const session = data.session;
    const formattedDate = session ? this.formatDate(session.scheduledDate) : '';
    
    switch (data.type) {
      case 'session-request':
        return this.generateEmailTemplate({
          title: 'New Session Request',
          greeting: `Hi ${data.recipientName}!`,
          content: `
            <p><strong>${data.senderName}</strong> has requested a ${session?.sessionType || 'learning'} session with you!</p>
            <p><strong>Skill:</strong> ${session?.skillName || 'Various'}</p>
            <p><strong>Preferred Date:</strong> ${formattedDate || 'To be scheduled'}</p>
            <p><strong>Duration:</strong> ${session?.duration || 60} minutes</p>
            ${session?.notes ? `<p><strong>Message:</strong> ${session.notes}</p>` : ''}
            <p>Please log in to your SkillSwap account to accept or decline this request.</p>
          `,
          callToAction: '<a href="https://skillswap.app/dashboard" class="cta-button">View Request</a>'
        });

      case 'session-confirmation':
        const meetingInfo = this.generateMeetingInfo(session!);
        return this.generateEmailTemplate({
          title: 'Session Confirmed!',
          greeting: `Hi ${data.recipientName}!`,
          content: `
            <p>Great news! Your ${session?.sessionType} session for <strong>${session?.skillName}</strong> has been confirmed.</p>
            <p><strong>When:</strong> ${formattedDate}</p>
            <p><strong>Duration:</strong> ${session?.duration} minutes</p>
            <p><strong>${data.isOrganizer ? 'Participant' : 'Teacher'}:</strong> ${data.isOrganizer ? session?.participantName : session?.organizerName}</p>
            ${session?.notes ? `<p><strong>Notes:</strong> ${session.notes}</p>` : ''}
          `,
          meetingInfo,
          callToAction: '<a href="https://skillswap.app/sessions" class="cta-button">View Session Details</a>'
        });

      case 'session-reminder':
        return this.generateEmailTemplate({
          title: 'Session Reminder',
          greeting: `Hi ${data.recipientName}!`,
          content: `
            <p>This is a friendly reminder that your ${session?.sessionType} session is coming up!</p>
            <p><strong>Skill:</strong> ${session?.skillName}</p>
            <p><strong>When:</strong> ${formattedDate}</p>
            <p><strong>Duration:</strong> ${session?.duration} minutes</p>
            <p><strong>${data.isOrganizer ? 'Participant' : 'Teacher'}:</strong> ${data.isOrganizer ? session?.participantName : session?.organizerName}</p>
          `,
          meetingInfo: this.generateMeetingInfo(session!),
          callToAction: session?.meetingLink ? `<a href="${session.meetingLink}" class="cta-button">Join Meeting</a>` : undefined
        });

      case 'session-cancellation':
        return this.generateEmailTemplate({
          title: 'Session Cancelled',
          greeting: `Hi ${data.recipientName}!`,
          content: `
            <p>We're sorry to inform you that your session has been cancelled.</p>
            <p><strong>Skill:</strong> ${session?.skillName}</p>
            <p><strong>Originally scheduled:</strong> ${formattedDate}</p>
            <p><strong>Cancelled by:</strong> ${data.cancelledBy}</p>
            <p>You can always schedule a new session when you're ready!</p>
          `,
          callToAction: '<a href="https://skillswap.app/explore" class="cta-button">Find New Sessions</a>'
        });

      default:
        return this.generateEmailTemplate({
          title: 'SkillSwap Notification',
          greeting: `Hi ${data.recipientName}!`,
          content: '<p>You have a new notification from SkillSwap.</p>',
          callToAction: '<a href="https://skillswap.app/dashboard" class="cta-button">View Dashboard</a>'
        });
    }
  }

  /**
   * Generate meeting information section for emails
   */
  private static generateMeetingInfo(session: SessionEmailData): string {
    switch (session.sessionType) {
      case 'video':
        return `
          <h3>🖥️ Video Call Information</h3>
          ${session.meetingLink ? `
            <p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>
            <p><strong>How to Join:</strong></p>
            <ul>
              <li>Click the meeting link 5 minutes before the session</li>
              <li>Allow camera and microphone permissions when prompted</li>
              <li>Test your audio/video before the session starts</li>
              <li>Use headphones to prevent echo</li>
            </ul>
          ` : '<p><strong>Meeting Link:</strong> Will be provided closer to the session time</p>'}
          <p><em>💡 Tip: Make sure you have a stable internet connection!</em></p>
        `;
        
      case 'phone':
        return `
          <h3>📞 Phone Call Information</h3>
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Exchange phone numbers through the SkillSwap messaging system</li>
            <li>The session organizer will initiate the call</li>
            <li>Be ready to receive the call at the scheduled time</li>
            <li>Find a quiet location for the best experience</li>
          </ul>
          <p><em>💡 Tip: Have pen and paper ready for notes!</em></p>
        `;
        
      case 'in-person':
        return `
          <h3>📍 In-Person Meeting Information</h3>
          ${session.location ? `<p><strong>Location:</strong> ${session.location}</p>` : ''}
          <p><strong>Important Reminders:</strong></p>
          <ul>
            <li>Confirm the exact meeting location through messaging</li>
            <li>Plan to arrive 5-10 minutes early</li>
            <li>Exchange contact information for coordination</li>
            <li>Meet in public, well-lit locations for safety</li>
            <li>Bring any necessary materials or resources</li>
          </ul>
          <p><em>🛡️ Safety first: Let someone know your meeting plans!</em></p>
        `;
        
      default:
        return '<p>Session details will be provided soon.</p>';
    }
  }

  /**
   * Send session request notification email
   */
  static async sendSessionRequestEmail(
    session: SessionEmailData,
    recipientEmail: string,
    recipientName: string,
    senderName?: string
  ): Promise<boolean> {
    return await this.sendEmailRequest({
      type: 'session-request',
      session,
      recipientEmail,
      recipientName,
      senderName: senderName || session.organizerName || 'Someone'
    });
  }

  /**
   * Send session confirmation email with meeting details
   */
  static async sendSessionConfirmationEmail(
    session: SessionEmailData,
    recipientEmail: string,
    recipientName: string,
    isOrganizer: boolean
  ): Promise<boolean> {
    return await this.sendEmailRequest({
      type: 'session-confirmation',
      session,
      recipientEmail,
      recipientName,
      isOrganizer,
      meetingLink: session.meetingLink
    });
  }

  /**
   * Send session reminder email
   */
  static async sendSessionReminderEmail(
    session: SessionEmailData,
    recipientEmail: string,
    recipientName: string,
    isOrganizer: boolean,
    reminderType: '24h' | '1h' = '1h'
  ): Promise<boolean> {
    return await this.sendEmailRequest({
      type: 'session-reminder',
      session,
      recipientEmail,
      recipientName,
      isOrganizer,
      additionalData: { reminderType }
    });
  }

  /**
   * Send session cancellation email
   */
  static async sendSessionCancellationEmail(
    session: SessionEmailData,
    recipientEmail: string,
    recipientName: string,
    cancelledBy: string
  ): Promise<boolean> {
    return await this.sendEmailRequest({
      type: 'session-cancellation',
      session,
      recipientEmail,
      recipientName,
      cancelledBy
    });
  }

  /**
   * Send connection request email
   */
  static async sendConnectionRequestEmail(
    senderName: string,
    recipientEmail: string,
    recipientName: string,
    skillName?: string
  ): Promise<boolean> {
    return await this.sendEmailRequest({
      type: 'connection-request',
      recipientEmail,
      recipientName,
      senderName,
      customMessage: skillName ? `${senderName} wants to connect with you to learn/teach ${skillName}` : `${senderName} wants to connect with you on SkillSwap`
    });
  }
}
