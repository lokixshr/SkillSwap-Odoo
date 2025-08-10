# SkillSwap Firebase Backend Implementation

## Overview

This document outlines the comprehensive Firebase backend implementation for the SkillSwap application, including real-time functionality, security rules, and scalable database design.

## 🏗️ Architecture

### Database Collections

#### 1. Users Collection (`users`)
```typescript
interface UserProfile {
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email
  displayName: string;            // Full name
  photoURL?: string;              // Profile photo URL
  firstName?: string;             // First name
  lastName?: string;              // Last name
  bio?: string;                   // User bio
  location?: string;              // User location
  skillsToTeach: string[];        // Skills user can teach
  skillsToLearn: string[];        // Skills user wants to learn
  isPublic: boolean;              // Profile visibility
  createdAt: Timestamp;           // Account creation time
  updatedAt: Timestamp;           // Last update time
  rating?: number;                // Average rating
  totalConnections?: number;      // Total connections made
  totalHours?: number;            // Total hours logged
}
```

#### 2. Skill Posts Collection (`skill_posts`)
```typescript
interface SkillPost {
  id?: string;                    // Document ID
  userId: string;                 // Creator's UID
  userDisplayName: string;        // Creator's display name
  userPhotoURL?: string;          // Creator's photo URL
  skillName: string;              // Skill name
  description: string;            // Detailed description
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  type: 'learn' | 'teach';       // Post type
  timestamp: Timestamp;           // Creation time
  isActive: boolean;              // Post visibility
  tags?: string[];                // Skill tags
}
```

#### 3. Connections Collection (`connections`)
```typescript
interface Connection {
  id?: string;                    // Document ID
  userId: string;                 // Initiator's UID
  connectedUserId: string;        // Target user's UID
  skillName: string;              // Skill being connected about
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timestamp: Timestamp;           // Connection time
  message?: string;               // Connection message
}
```

#### 4. Messages Collection (`messages`)
```typescript
interface Message {
  id?: string;                    // Document ID
  senderId: string;               // Sender's UID
  receiverId: string;             // Receiver's UID
  content: string;                // Message content
  timestamp: Timestamp;           // Send time
  isRead: boolean;                // Read status
}
```

## 🔐 Security Rules

### Firestore Security Rules
```javascript
rules_version='2'

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isOwnData() {
      return request.auth.uid == resource.data.userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || resource.data.isPublic == true);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Skill posts collection
    match /skill_posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && isOwnData();
      allow delete: if isAuthenticated() && isOwnData();
    }
    
    // Connections collection
    match /connections/{connectionId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || 
        resource.data.connectedUserId == request.auth.uid
      );
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && isOwnData();
      allow delete: if isAuthenticated() && isOwnData();
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid || 
        resource.data.receiverId == request.auth.uid
      );
      allow create: if isAuthenticated() && request.resource.data.senderId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.senderId == request.auth.uid;
    }
  }
}
```

## 🚀 Service Layer

### 1. UserService
Handles user profile management with real-time updates.

**Key Methods:**
- `createOrUpdateUser()` - Create or update user profile
- `getUserProfile()` - Get user profile by UID
- `updateUserSkills()` - Update user's skills arrays
- `subscribeToUserProfile()` - Real-time profile updates

### 2. SkillPostService
Manages skill posts with automatic user skill updates.

**Key Methods:**
- `createSkillPost()` - Create new skill post
- `getActiveSkillPosts()` - Get all active posts
- `getSkillPostsByType()` - Get posts by type (learn/teach)
- `subscribeToSkillPosts()` - Real-time post updates
- `subscribeToSkillPostsByType()` - Real-time filtered updates

### 3. ConnectionService
Handles user connections and relationship management.

**Key Methods:**
- `createConnection()` - Create connection request
- `updateConnectionStatus()` - Update connection status
- `getUserConnections()` - Get user's connections
- `subscribeToUserConnections()` - Real-time connection updates

### 4. MessageService
Manages real-time messaging between users.

**Key Methods:**
- `sendMessage()` - Send a message
- `getConversationMessages()` - Get conversation history
- `markMessagesAsRead()` - Mark messages as read
- `subscribeToConversation()` - Real-time message updates

## 🎣 Custom Hooks

### 1. useSkillPosts
```typescript
const { posts, loading, error, createPost, updatePost, deletePost } = useSkillPosts('learn');
```

### 2. useUserProfile
```typescript
const { profile, loading, error, updateProfile, updateSkills } = useUserProfile();
```

### 3. useConnections
```typescript
const { connections, loading, error, createConnection, updateConnectionStatus } = useConnections();
```

### 4. useMessages
```typescript
const { messages, loading, error, sendMessage, markMessagesAsRead } = useMessages(otherUserId);
```

## 🔄 Real-time Features

### 1. Live Skill Posts
- New posts appear immediately on all connected clients
- Posts are filtered by type (learn/teach) in real-time
- Automatic user skill array updates when posts are created

### 2. Live User Profiles
- Profile changes are reflected immediately across the app
- Skills updates trigger real-time UI updates
- Profile photo and bio changes are live

### 3. Live Connections
- Connection requests appear in real-time
- Status changes (pending → accepted) are live
- Connection counts update automatically

### 4. Live Messaging
- Messages appear instantly in conversations
- Read status updates in real-time
- Unread message counts update automatically

## 📊 Database Optimization

### 1. Indexing Strategy
- Composite indexes on `skill_posts` for type + timestamp queries
- Indexes on `connections` for user-based queries
- Indexes on `messages` for conversation queries

### 2. Query Optimization
- Use `where` clauses to filter data at the database level
- Implement pagination for large datasets
- Use `orderBy` for consistent sorting

### 3. Data Structure
- Denormalized user data in skill posts for fast queries
- Embedded connection data for quick access
- Optimized message structure for real-time updates

## 🛡️ Error Handling

### 1. Service Layer Errors
```typescript
try {
  await SkillPostService.createSkillPost(postData);
} catch (error) {
  console.error('Error creating skill post:', error);
  toast({
    title: "Error",
    description: "Failed to create skill post. Please try again.",
    variant: "destructive",
  });
}
```

### 2. Authentication Errors
```typescript
if (!user) {
  toast({
    title: "Authentication Required",
    description: "Please sign in to perform this action.",
    variant: "destructive",
  });
  return;
}
```

### 3. Network Errors
```typescript
const handleNetworkError = (error: any) => {
  if (error.code === 'unavailable') {
    toast({
      title: "Connection Error",
      description: "Please check your internet connection.",
      variant: "destructive",
    });
  }
};
```

## 🚀 Deployment

### 1. Firestore Rules Deployment
```bash
firebase deploy --only firestore:rules
```

### 2. Full Application Deployment
```bash
npm run build
firebase deploy
```

### 3. Environment Variables
Ensure all Firebase configuration variables are set in `.env`:
```
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id
```

## 📈 Scalability Considerations

### 1. Data Growth
- Implement pagination for large collections
- Use composite indexes for complex queries
- Consider data archiving for old messages

### 2. Performance
- Optimize real-time listeners to minimize bandwidth
- Use efficient queries with proper indexing
- Implement caching strategies for frequently accessed data

### 3. Security
- Regular security rule reviews
- Implement rate limiting for API calls
- Monitor for suspicious activity

## 🔧 Maintenance

### 1. Regular Tasks
- Monitor Firestore usage and costs
- Review and update security rules
- Clean up inactive user data
- Optimize indexes based on query patterns

### 2. Monitoring
- Set up Firebase Analytics
- Monitor real-time listener performance
- Track user engagement metrics

### 3. Backups
- Regular database backups
- Export critical data periodically
- Test restore procedures

## 🎯 Future Enhancements

### 1. Advanced Features
- Push notifications for new connections
- File sharing in messages
- Video calling integration
- Advanced search and filtering

### 2. Performance Improvements
- Implement virtual scrolling for large lists
- Add offline support with local caching
- Optimize bundle size with code splitting

### 3. Analytics
- Track user behavior patterns
- Monitor skill matching success rates
- Analyze connection quality metrics

---

This backend implementation provides a solid foundation for the SkillSwap application with real-time functionality, proper security, and scalability considerations. The modular service layer and custom hooks make it easy to maintain and extend the application as it grows. 