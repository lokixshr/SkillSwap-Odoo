# SkillSwap Real-Time Notifications System

This document provides a complete guide to the real-time notifications system implemented for the SkillSwap application.

## Overview

The notifications system provides real-time, Firebase-powered notifications for:
- **Connection Requests**: When users want to connect for skill exchange
- **Session Requests**: When users want to schedule learning sessions

## Architecture

### Components
1. **NotificationsService** (`src/services/notificationsService.ts`) - Core service for managing notifications
2. **NotificationBell** (`src/components/NotificationBell.tsx`) - Dropdown notification UI component
3. **NotificationsPage** (`src/pages/NotificationsPage.tsx`) - Full-page notifications management
4. **Integration Examples** (`src/examples/NotificationIntegration.tsx`) - Usage examples

### Data Model

```typescript
interface NotificationData {
  id?: string;
  recipientId: string;        // User who receives the notification
  senderId: string;           // User who sends the notification
  senderName?: string;        // Display name of sender
  senderPhotoURL?: string;    // Avatar URL of sender
  type: 'session_request' | 'connection_request';
  status: 'pending' | 'accepted' | 'rejected';
  message: string;            // Notification message
  createdAt: Timestamp;       // When notification was created
  read: boolean;              // Whether notification has been read
  sessionId?: string;         // Related session ID (for session requests)
  connectionId?: string;      // Related connection ID (for connection requests)
  skillName?: string;         // The skill being discussed
  additionalData?: Record<string, any>; // Optional metadata
}
```

### Firebase Collection Structure

```
/notifications/{notificationId}
├── recipientId: string
├── senderId: string
├── senderName: string
├── senderPhotoURL?: string
├── type: "session_request" | "connection_request"
├── status: "pending" | "accepted" | "rejected"
├── message: string
├── createdAt: ServerTimestamp
├── read: boolean
├── sessionId?: string
├── connectionId?: string
├── skillName?: string
└── additionalData?: object
```

## Implementation Guide

### 1. Triggering Notifications

#### Connection Request
```typescript
import { NotificationsService } from '@/services/notificationsService';
import { UserService, ConnectionService } from '@/lib/database';

const sendConnectionRequest = async (targetUserId: string, skillName: string) => {
  // 1. Get sender profile
  const senderProfile = await UserService.getUserProfile(currentUserId);
  
  // 2. Create connection
  const connectionId = await ConnectionService.createConnection({
    userId: currentUserId,
    connectedUserId: targetUserId,
    skillName,
    status: 'pending',
    message: 'Connection request message'
  });

  // 3. Create notification
  await NotificationsService.createConnectionRequestNotification(
    targetUserId,                    // recipient
    currentUserId,                   // sender
    senderProfile.displayName,       // sender name
    skillName,                       // skill
    connectionId,                    // connection ID
    senderProfile.photoURL           // sender avatar
  );
};
```

#### Session Request
```typescript
const sendSessionRequest = async (
  targetUserId: string, 
  skillName: string, 
  sessionType: string,
  scheduledDate: Date
) => {
  // 1. Get profiles
  const senderProfile = await UserService.getUserProfile(currentUserId);
  const targetProfile = await UserService.getUserProfile(targetUserId);
  
  // 2. Create session
  const sessionId = await SessionService.createSession({
    organizerId: currentUserId,
    participantId: targetUserId,
    organizerName: senderProfile.displayName,
    participantName: targetProfile.displayName,
    skillName,
    sessionType,
    scheduledDate,
    status: 'pending'
  });

  // 3. Create notification
  await NotificationsService.createSessionRequestNotification(
    targetUserId,                    // recipient
    currentUserId,                   // sender
    senderProfile.displayName,       // sender name
    skillName,                       // skill
    sessionId,                       // session ID
    senderProfile.photoURL           // sender avatar
  );
};
```

### 2. Real-Time Listening

#### Subscribe to User Notifications
```typescript
import { NotificationsService } from '@/services/notificationsService';

useEffect(() => {
  if (!user?.uid) return;

  const unsubscribe = NotificationsService.subscribeToUserNotifications(
    user.uid,
    (notifications) => {
      setNotifications(notifications);
      const unreadCount = notifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    }
  );

  return () => unsubscribe();
}, [user?.uid]);
```

#### Subscribe to Unread Only
```typescript
const unsubscribe = NotificationsService.subscribeToUnreadNotifications(
  user.uid,
  (unreadNotifications) => {
    setUnreadNotifications(unreadNotifications);
  }
);
```

### 3. Handling Notifications

#### Mark as Read
```typescript
const handleMarkAsRead = async (notificationId: string) => {
  await NotificationsService.markAsRead(notificationId);
};
```

#### Accept/Reject Connection
```typescript
const handleAcceptConnection = async (notification: NotificationData) => {
  if (!notification.connectionId || !notification.id) return;

  // Update connection status
  await ConnectionService.updateConnectionStatus(
    notification.connectionId, 
    'accepted'
  );
  
  // Update notification status
  await NotificationsService.updateNotificationStatus(
    notification.id, 
    'accepted'
  );
};
```

#### Delete Notification
```typescript
const handleDeleteNotification = async (notificationId: string) => {
  await NotificationsService.deleteNotification(notificationId);
};
```

## UI Components

### NotificationBell Component

A compact bell icon with badge count that shows notifications in a popover dropdown.

```tsx
import NotificationBell from '@/components/NotificationBell';

// Usage in header/navigation
<NotificationBell className="mr-4" />
```

**Features:**
- Real-time badge count updates
- Dropdown with recent notifications
- Accept/reject buttons for connection requests
- "View Session" button for session requests
- Mark as read functionality
- "View All Notifications" link

### NotificationsPage Component

A full-page interface for managing all notifications with filtering and search.

```tsx
import NotificationsPage from '@/pages/NotificationsPage';

// Used in route: /notifications
<Route path="/notifications" element={<NotificationsPage />} />
```

**Features:**
- Filter by: All, Unread, Sessions, Connections
- Badge counts for each filter
- Full notification management (read, delete, respond)
- Responsive design
- Real-time updates

## Firebase Configuration

### Firestore Security Rules

```javascript
// Notifications collection rules
match /notifications/{notificationId} {
  // Users can read their own notifications (as recipient)
  allow read: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
  
  // Users can create notifications for others (as sender)
  allow create: if isAuthenticated() && 
    request.resource.data.senderId == request.auth.uid &&
    request.resource.data.recipientId != request.auth.uid;
  
  // Users can update notifications they received
  allow update: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
  
  // Users can delete their own notifications
  allow delete: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
}
```

### Firestore Indexes

Required composite indexes:
```json
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "read", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## API Reference

### NotificationsService Methods

#### Core Operations
- `createNotification(data)` - Create a new notification
- `getUserNotifications(userId)` - Get all notifications for a user
- `getUnreadCount(userId)` - Get unread notifications count
- `markAsRead(notificationId)` - Mark single notification as read
- `markAllAsRead(userId)` - Mark all user notifications as read
- `updateNotificationStatus(notificationId, status)` - Update notification status
- `deleteNotification(notificationId)` - Delete a notification

#### Convenience Methods
- `createConnectionRequestNotification(recipientId, senderId, senderName, skillName, connectionId, senderPhotoURL?)` - Create connection request notification
- `createSessionRequestNotification(recipientId, senderId, senderName, skillName, sessionId, senderPhotoURL?)` - Create session request notification

#### Real-time Subscriptions
- `subscribeToUserNotifications(userId, callback)` - Subscribe to all user notifications
- `subscribeToUnreadNotifications(userId, callback)` - Subscribe to unread notifications only

#### Utility Methods
- `getNotificationsByType(userId, type)` - Get notifications by type
- `deleteAllUserNotifications(userId)` - Delete all user notifications (cleanup)

## Integration Points

### Existing Components Integration

The notification system integrates with:

1. **ConnectionModal** - Automatically creates notifications when connections are requested
2. **SessionService** - Creates notifications when sessions are scheduled
3. **Dashboard** - Shows NotificationBell in header
4. **Navigation** - Links to notifications page

### Custom Integration Example

```typescript
// In your component where users interact
import { NotificationsService } from '@/services/notificationsService';

const YourComponent = () => {
  const handleUserAction = async () => {
    // Your existing logic...
    
    // Add notification
    await NotificationsService.createNotification({
      recipientId: targetUser.id,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      type: 'connection_request',
      status: 'pending',
      message: 'Custom notification message',
      skillName: 'Custom Skill',
      connectionId: connectionId
    });
  };
};
```

## Deployment

### Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy both
firebase deploy --only firestore
```

## Testing

### Manual Testing

1. **Create Test Notifications:**
   - Use the integration examples component
   - Navigate to `/test-notifications`
   - Click "Send Test Connection Request" or "Send Test Session Request"

2. **Test Real-time Updates:**
   - Open app in two browser tabs with different users
   - Send notification from one user
   - Verify real-time appearance in the other user's notification bell

3. **Test Notification Actions:**
   - Accept/reject connection requests
   - Mark notifications as read
   - Delete notifications
   - Filter by type

### Integration Testing

```typescript
// Example test for notification creation
const testNotificationCreation = async () => {
  const notificationId = await NotificationsService.createConnectionRequestNotification(
    'recipient-user-id',
    'sender-user-id',
    'Test Sender',
    'React Development',
    'connection-123'
  );
  
  console.log('Notification created:', notificationId);
  
  // Verify notification appears in recipient's list
  const notifications = await NotificationsService.getUserNotifications('recipient-user-id');
  const createdNotification = notifications.find(n => n.id === notificationId);
  
  console.log('Notification found:', !!createdNotification);
};
```

## Performance Considerations

1. **Real-time Listeners:** Each user only subscribes to their own notifications
2. **Pagination:** NotificationsPage shows most recent 50 notifications by default
3. **Indexes:** Optimized for common query patterns (by recipient, by read status, by type)
4. **Cleanup:** Implement notification cleanup for old notifications
5. **Batch Operations:** Use batch operations for marking multiple notifications as read

## Troubleshooting

### Common Issues

1. **Notifications not appearing:**
   - Check Firestore security rules
   - Verify user authentication
   - Check browser console for errors

2. **Real-time updates not working:**
   - Verify onSnapshot subscriptions are properly set up
   - Check network connectivity
   - Verify Firestore indexes are deployed

3. **Permission denied errors:**
   - Check that recipientId matches current user
   - Verify security rules are deployed
   - Check user authentication status

### Debug Tools

The system includes debug logging. Check browser console for:
- `Setting up notification subscription for user: {userId}`
- `Received X notifications for user {userId}`
- `Notification created with ID: {notificationId}`

## Future Enhancements

Planned improvements:
1. **Push Notifications:** Browser/mobile push notifications
2. **Email Notifications:** Optional email notifications for important updates
3. **Notification Categories:** More notification types (reminders, updates, etc.)
4. **Advanced Filtering:** Filter by date, sender, skill, etc.
5. **Notification Templates:** Customizable notification messages
6. **Analytics:** Track notification engagement metrics

---

For questions or issues, refer to the main project documentation or create an issue in the project repository.
