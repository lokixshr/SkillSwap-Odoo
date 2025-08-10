# SkillSwap Message System Setup Guide

## 🚀 Quick Setup

### 1. Environment Variables
Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Enable Authentication (Email/Password)
5. Copy the configuration from your Firebase project settings

### 3. Deploy Firestore Indexes
Run the following command to deploy the required indexes:
```bash
firebase deploy --only firestore:indexes
```

### 4. Firestore Security Rules
Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Other users can read profiles
    }
    
    // Skill posts - authenticated users can read all, write their own
    match /skill_posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Connections - users can manage their own connections
    match /connections/{connectionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.connectedUserId);
    }
    
    // Messages - users can only access messages they're part of
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
  }
}
```

### 5. Install Dependencies
```bash
npm install
```

### 6. Run the Development Server
```bash
npm run dev
```

## 🔧 Features Implemented

### ✅ Message System
- **Real-time messaging** with Firebase Firestore
- **Conversation-based messaging** using conversationId
- **Auto-scroll to bottom** when new messages arrive
- **User profile integration** showing proper names and avatars
- **Connection status tracking** (pending, accepted, etc.)
- **Message timestamps** with relative time formatting
- **Responsive design** works on desktop and mobile

### ✅ Database Structure
- **Optimized queries** using conversationId for better performance
- **Proper indexing** for fast message retrieval
- **User profile caching** to avoid repeated API calls
- **Connection management** integrated with messaging

### ✅ User Experience
- **Search functionality** for conversations
- **Visual feedback** for message status
- **Smooth animations** and transitions
- **Loading states** for better UX
- **Error handling** with user-friendly messages

## 🛠️ Technical Improvements Made

1. **Fixed Firestore Query**: Changed from complex 'in' queries to simple conversationId queries
2. **Added Firestore Indexes**: Proper indexes for optimal query performance  
3. **User Profile Management**: Created hook to efficiently load and cache user profiles
4. **Real-time Updates**: Messages update in real-time using Firestore listeners
5. **Auto-scroll**: New messages automatically scroll the chat to the bottom
6. **Error Handling**: Comprehensive error handling with user notifications
7. **Type Safety**: Proper TypeScript interfaces for all data structures

## 🔍 How to Test

1. **Create User Accounts**: Sign up with different email addresses
2. **Create Skill Posts**: Add some skills to teach/learn
3. **Make Connections**: Connect users through skill posts  
4. **Start Messaging**: Go to Messages page and select a connection
5. **Test Real-time**: Send messages from different browser windows/devices

## 📱 Usage Instructions

1. **Navigate to Messages**: Click on Messages in the navigation
2. **Select a Connection**: Click on any connection from the left sidebar
3. **Send Messages**: Type in the input field and press Enter or click Send
4. **View Conversations**: All your conversations are listed on the left
5. **Search**: Use the search bar to find specific conversations

## 🐛 Troubleshooting

### Common Issues:
- **No messages loading**: Check Firebase configuration and security rules
- **Messages not sending**: Verify authentication and Firestore permissions
- **User names not showing**: Ensure user profiles are created during signup
- **Real-time not working**: Check network connection and Firestore rules

### Debug Mode:
Check browser console for detailed error messages and Firebase connection status.
