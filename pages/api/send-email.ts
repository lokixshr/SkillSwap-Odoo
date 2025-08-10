import type { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '../../src/lib/database';
import { Timestamp } from 'firebase/firestore';

// Email service configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@skillswap.com';
const FROM_NAME = process.env.FROM_NAME || 'SkillSwap';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
}

interface EmailRequest {
  type: 'session-request' | 'session-confirmation' | 'session-reminder' | 'session-cancellation';
  session: Session;
  recipientEmail: string;
  recipientName: string;
  isOrganizer?: boolean;
  cancelledBy?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, session, recipientEmail, recipientName, isOrganizer, cancelledBy }: EmailRequest = req.body;

    let success = false;

    switch (type) {
      case 'session-request':
        success = await sendSessionRequestEmail(session, recipientEmail, recipientName);
        break;
      case 'session-confirmation':
        success = await sendSessionConfirmationEmail(session, recipientEmail, recipientName, isOrganizer || false);
        break;
      case 'session-reminder':
        success = await sendSessionReminderEmail(session, recipientEmail, recipientName, isOrganizer || false);
        break;
      case 'session-cancellation':
        success = await sendSessionCancellationEmail(session, recipientEmail, recipientName, cancelledBy || 'Unknown');
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      console.error('SendGrid API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Session request notification email
async function sendSessionRequestEmail(
  session: Session,
  recipientEmail: string,
  recipientName: string
): Promise<boolean> {
  const sessionDate = session.scheduledDate.toDate();
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const template = generateSessionRequestTemplate({
    recipientName,
    organizerName: session.organizerName,
    skillName: session.skillName,
    sessionType: session.sessionType,
    date: formattedDate,
    time: formattedTime,
    duration: session.duration,
    location: session.location,
    notes: session.notes,
    sessionId: session.id
  });

  const emailData: EmailData = {
    to: recipientEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: template.subject,
    html: template.html,
    text: template.text
  };

  return await sendEmail(emailData);
}

// Session confirmation email
async function sendSessionConfirmationEmail(
  session: Session,
  recipientEmail: string,
  recipientName: string,
  isOrganizer: boolean
): Promise<boolean> {
  const sessionDate = session.scheduledDate.toDate();
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const template = generateSessionConfirmationTemplate({
    recipientName,
    otherPersonName: isOrganizer ? session.participantName : session.organizerName,
    skillName: session.skillName,
    sessionType: session.sessionType,
    date: formattedDate,
    time: formattedTime,
    duration: session.duration,
    location: session.location,
    meetingLink: session.meetingLink,
    notes: session.notes,
    isOrganizer
  });

  const emailData: EmailData = {
    to: recipientEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: template.subject,
    html: template.html,
    text: template.text
  };

  return await sendEmail(emailData);
}

// Session reminder email
async function sendSessionReminderEmail(
  session: Session,
  recipientEmail: string,
  recipientName: string,
  isOrganizer: boolean
): Promise<boolean> {
  const sessionDate = session.scheduledDate.toDate();
  const now = new Date();
  const timeDiff = sessionDate.getTime() - now.getTime();
  const hoursUntil = Math.round(timeDiff / (1000 * 60 * 60));

  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const template = generateSessionReminderTemplate({
    recipientName,
    otherPersonName: isOrganizer ? session.participantName : session.organizerName,
    skillName: session.skillName,
    sessionType: session.sessionType,
    time: formattedTime,
    duration: session.duration,
    hoursUntil,
    location: session.location,
    meetingLink: session.meetingLink,
    isOrganizer
  });

  const emailData: EmailData = {
    to: recipientEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: template.subject,
    html: template.html,
    text: template.text
  };

  return await sendEmail(emailData);
}

// Session cancellation email
async function sendSessionCancellationEmail(
  session: Session,
  recipientEmail: string,
  recipientName: string,
  cancelledBy: string
): Promise<boolean> {
  const sessionDate = session.scheduledDate.toDate();
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const template = generateSessionCancellationTemplate({
    recipientName,
    cancelledBy,
    skillName: session.skillName,
    date: formattedDate,
    time: formattedTime
  });

  const emailData: EmailData = {
    to: recipientEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: template.subject,
    html: template.html,
    text: template.text
  };

  return await sendEmail(emailData);
}

// Email Templates (keeping the same templates but using server-side APP_URL)
function generateSessionRequestTemplate(data: {
  recipientName: string;
  organizerName: string;
  skillName: string;
  sessionType: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
  sessionId: string;
}): EmailTemplate {
  const subject = `New Session Request: ${data.skillName} with ${data.organizerName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button.secondary { background: #6c757d; }
          .session-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .detail-label { font-weight: 600; color: #495057; }
          .detail-value { color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 New Session Request</h1>
            <p>Someone wants to learn from you!</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p><strong>${data.organizerName}</strong> has requested a learning session with you for <strong>${data.skillName}</strong>.</p>
            
            <div class="session-details">
              <h3>📅 Session Details</h3>
              <div class="detail-row">
                <span class="detail-label">Skill:</span>
                <span class="detail-value">${data.skillName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)} session</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              ${data.location ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.location}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.notes ? `
              <div class="session-details">
                <h4>📝 Additional Notes</h4>
                <p>${data.notes}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/sessions" class="button">✅ Accept Session</a>
              <a href="${APP_URL}/sessions" class="button secondary">❌ Decline</a>
            </div>
            
            <p>You can also manage this request by logging into your SkillSwap account.</p>
            
            <p>Thanks for being part of the SkillSwap community!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 SkillSwap. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hi ${data.recipientName},

    ${data.organizerName} has requested a learning session with you for ${data.skillName}.

    Session Details:
    - Skill: ${data.skillName}
    - Type: ${data.sessionType} session
    - Date: ${data.date}
    - Time: ${data.time}
    - Duration: ${data.duration} minutes
    ${data.location ? `- Location: ${data.location}` : ''}

    ${data.notes ? `Additional Notes: ${data.notes}` : ''}

    Please log into your SkillSwap account to accept or decline this session request.

    Visit: ${APP_URL}/sessions

    Thanks for being part of the SkillSwap community!
  `;

  return { subject, html, text };
}

// Add the other template functions here (generateSessionConfirmationTemplate, generateSessionReminderTemplate, generateSessionCancellationTemplate)
// For brevity, I'll include just one template. You can copy the others from the original file and update the APP_URL references.

function generateSessionConfirmationTemplate(data: {
  recipientName: string;
  otherPersonName: string;
  skillName: string;
  sessionType: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
  isOrganizer: boolean;
}): EmailTemplate {
  const subject = `Session Confirmed: ${data.skillName} with ${data.otherPersonName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .session-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .detail-label { font-weight: 600; color: #495057; }
          .detail-value { color: #6c757d; }
          .meeting-link { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
          .meeting-link a { color: #1976d2; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Session Confirmed!</h1>
            <p>Your learning session has been confirmed</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>Great news! Your ${data.isOrganizer ? 'requested' : ''} session with <strong>${data.otherPersonName}</strong> for <strong>${data.skillName}</strong> has been confirmed.</p>
            
            <div class="session-details">
              <h3>📅 Session Details</h3>
              <div class="detail-row">
                <span class="detail-label">Skill:</span>
                <span class="detail-value">${data.skillName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)} session</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              ${data.location ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.location}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.meetingLink ? `
              <div class="meeting-link">
                <h4>🎥 Meeting Link</h4>
                <p>Join your ${data.sessionType} session here:</p>
                <a href="${data.meetingLink}" target="_blank">${data.meetingLink}</a>
                <p><small>You can join the meeting 15 minutes before the scheduled time.</small></p>
              </div>
            ` : ''}
            
            ${data.notes ? `
              <div class="session-details">
                <h4>📝 Session Notes</h4>
                <p>${data.notes}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/sessions" class="button">📋 View Session</a>
            </div>
            
            <p>We'll send you a reminder before the session starts. Looking forward to a great learning experience!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 SkillSwap. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
    Hi ${data.recipientName},

    Great news! Your session with ${data.otherPersonName} for ${data.skillName} has been confirmed.

    Session Details:
    - Skill: ${data.skillName}
    - Type: ${data.sessionType} session
    - Date: ${data.date}
    - Time: ${data.time}
    - Duration: ${data.duration} minutes
    ${data.location ? `- Location: ${data.location}` : ''}

    ${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}

    ${data.notes ? `Session Notes: ${data.notes}` : ''}

    We'll send you a reminder before the session starts.

    Visit: ${APP_URL}/sessions

    Looking forward to a great learning experience!
  `;
  
  return { subject, html, text };
}

function generateSessionReminderTemplate(data: {
  recipientName: string;
  otherPersonName: string;
  skillName: string;
  sessionType: string;
  time: string;
  duration: number;
  hoursUntil: number;
  location?: string;
  meetingLink?: string;
  isOrganizer: boolean;
}): EmailTemplate {
  const reminderText = data.hoursUntil <= 1 ? 'starting soon' : `starting in ${data.hoursUntil} hours`;
  const subject = `Reminder: ${data.skillName} session ${reminderText}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #fd7e14; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .session-details { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fd7e14; }
          .meeting-link { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
          .meeting-link a { color: #1976d2; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Session Reminder</h1>
            <p>Your learning session is ${reminderText}!</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>This is a friendly reminder that you have a ${data.sessionType} session with <strong>${data.otherPersonName}</strong> for <strong>${data.skillName}</strong> ${reminderText}.</p>
            
            <div class="session-details">
              <h3>📅 Session Details</h3>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Duration:</strong> ${data.duration} minutes</p>
              ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
            </div>
            
            ${data.meetingLink ? `
              <div class="meeting-link">
                <h4>🎥 Join Your Session</h4>
                <a href="${data.meetingLink}" target="_blank" class="button">Join Meeting</a>
                <p><small>Click the link above to join your ${data.sessionType} session</small></p>
              </div>
            ` : data.sessionType === 'phone' ? `
              <div class="meeting-link">
                <h4>📞 Phone Session</h4>
                <p>Contact details have been shared with both participants.</p>
              </div>
            ` : data.sessionType === 'in-person' && data.location ? `
              <div class="meeting-link">
                <h4>📍 In-Person Session</h4>
                <p>Don't forget to head to: ${data.location}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/sessions" class="button">📋 View Session</a>
            </div>
            
            <p>Looking forward to a productive learning session!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 SkillSwap. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
    Hi ${data.recipientName},

    This is a friendly reminder that you have a ${data.sessionType} session with ${data.otherPersonName} for ${data.skillName} ${reminderText}.

    Session Details:
    - Time: ${data.time}
    - Duration: ${data.duration} minutes
    ${data.location ? `- Location: ${data.location}` : ''}

    ${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}

    Visit: ${APP_URL}/sessions

    Looking forward to a productive learning session!
  `;
  
  return { subject, html, text };
}

function generateSessionCancellationTemplate(data: {
  recipientName: string;
  cancelledBy: string;
  skillName: string;
  date: string;
  time: string;
}): EmailTemplate {
  const subject = `Session Cancelled: ${data.skillName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .session-details { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Session Cancelled</h1>
            <p>A session has been cancelled</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>We wanted to let you know that <strong>${data.cancelledBy}</strong> has cancelled the learning session for <strong>${data.skillName}</strong>.</p>
            
            <div class="session-details">
              <h3>📅 Cancelled Session</h3>
              <p><strong>Skill:</strong> ${data.skillName}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
            </div>
            
            <p>Don't worry! There are many other learning opportunities available on SkillSwap. You can:</p>
            
            <ul>
              <li>Browse other available teachers</li>
              <li>Schedule a session with a different instructor</li>
              <li>Explore new skills to learn</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/explore" class="button">🔍 Find New Sessions</a>
            </div>
            
            <p>Thank you for your understanding, and we hope to see you back on SkillSwap soon!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 SkillSwap. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
    Hi ${data.recipientName},

    We wanted to let you know that ${data.cancelledBy} has cancelled the learning session for ${data.skillName}.

    Cancelled Session:
    - Skill: ${data.skillName}
    - Date: ${data.date}
    - Time: ${data.time}

    Don't worry! There are many other learning opportunities available on SkillSwap.

    Visit: ${APP_URL}/explore

    Thank you for your understanding, and we hope to see you back on SkillSwap soon!
  `;
  
  return { subject, html, text };
}
