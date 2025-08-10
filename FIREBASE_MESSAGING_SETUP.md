# Firebase Real-time Messaging System

This implementation adds a complete real-time 1:1 messaging system to your SkillSwap React + TypeScript + Tailwind project using Firebase Firestore.

## 🚀 Features

✅ **Real-time messaging** with Firebase Firestore onSnapshot()  
✅ **Optimized data model** using chatId for efficient querying  
✅ **Auto-scroll** to latest messages  
✅ **Responsive design** with Tailwind CSS  
✅ **Message timestamps** with relative time formatting  
✅ **Firebase Auth integration** for secure messaging  
✅ **TypeScript** support with proper type definitions  
✅ **Error handling** and loading states  
✅ **Modular components** for easy integration  

## 📁 Files Added/Modified

### New Files:
- `src/lib/firebaseConfig.ts` - Firebase configuration and initialization
- `src/components/ChatRoom.tsx` - Main chat component
- `src/components/ChatRoomExample.tsx` - Usage examples and documentation
- `src/hooks/useMessages.ts` - Updated to use Firebase Firestore
- `FIREBASE_MESSAGING_SETUP.md` - This setup guide

### Modified Files:
- `src/pages/Messages.tsx` - Updated to use new ChatRoom component
- `firestore.rules` - Updated security rules for chat structure
- `firestore.indexes.json` - Already includes necessary indexes

## 🔧 Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains all Firebase configuration:

```env
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
VITE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project or create a new one
3. Enable **Firestore Database** (if not already enabled)
4. Enable **Authentication** with Email/Password (if not already enabled)

### 3. Deploy Firestore Security Rules

Deploy the updated security rules:

```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Firestore Indexes

Deploy the indexes for optimal query performance:

```bash
firebase deploy --only firestore:indexes
```

### 5. Install Dependencies

The project should already have Firebase dependencies. If not:

```bash
npm install firebase
```

### 6. Test the Implementation

1. Start your development server:
```bash
npm run dev
```

2. Sign in with two different accounts
3. Create connections between users (through existing SkillSwap functionality)
4. Navigate to the Messages page
5. Select a connection and start chatting!

## 🗄️ Data Structure

### Firestore Collections

```
/chats/{chatId}/messages/{messageId}
├── senderId: string (Firebase UID)
├── receiverId: string (Firebase UID)  
├── content: string (message text)
└── createdAt: serverTimestamp

Where chatId = sorted([userId1, userId2]).join('_')
```

### Example chatId:
- User A: `abc123`
- User B: `def456`  
- chatId: `abc123_def456` (alphabetically sorted)

This structure ensures:
- ✅ Efficient querying by chatId
- ✅ Real-time updates via onSnapshot()
- ✅ Proper security rules validation
- ✅ Scalable message storage

## 🔒 Security Rules

The updated `firestore.rules` file includes:

```javascript
// Chat messages - users can only access messages they're part of
match /chats/{chatId}/messages/{messageId} {
  allow read, write: if isAuthenticated() && 
    (request.auth.uid in chatId.split('_'));
  
  // Ensure the senderId matches the authenticated user for new messages
  allow create: if isAuthenticated() && 
    request.resource.data.senderId == request.auth.uid &&
    request.auth.uid in chatId.split('_');
}
```

This ensures:
- Only authenticated users can access chats
- Users can only access chats they're part of (chatId contains their UID)
- Users can only send messages as themselves (senderId validation)

## 💻 Component Usage

### Basic Usage

```tsx
import ChatRoom from '@/components/ChatRoom';

function MyComponent() {
  return (
    <div className="h-96">
      <ChatRoom 
        otherUserId="firebase_uid_of_other_user"
        otherUserName="John Doe"
        otherUserAvatar="https://example.com/avatar.jpg"
        className="h-full"
      />
    </div>
  );
}
```

### Modal Chat

```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ChatRoom from '@/components/ChatRoom';

function ModalChatExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Start Chat</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px]">
        <ChatRoom 
          otherUserId="user789"
          otherUserName="Mike Wilson"
          className="h-full"
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Props Interface

```typescript
interface ChatRoomProps {
  otherUserId: string;        // Required: Firebase UID of other user
  otherUserName?: string;     // Optional: Display name (default: 'User')
  otherUserAvatar?: string;   // Optional: Avatar URL
  className?: string;         // Optional: Additional CSS classes
}
```

## 🎯 Integration Points

### 1. Messages Page
The main Messages page (`src/pages/Messages.tsx`) now uses ChatRoom:
- Displays list of connections on the left
- Shows ChatRoom component on the right when connection is selected
- Integrates with existing useConnections() hook

### 2. User Profiles
Add quick chat functionality to user profile pages:
```tsx
// In a user profile component
<ChatRoom 
  otherUserId={profileUser.uid}
  otherUserName={profileUser.displayName}
  otherUserAvatar={profileUser.photoURL}
  className="h-64"
/>
```

### 3. Skill Posts
Enable immediate chat when connecting through skill posts:
```tsx
// When user clicks "Connect" on a skill post
<ChatRoom 
  otherUserId={skillPost.userId}
  otherUserName={skillPost.userDisplayName}
  otherUserAvatar={skillPost.userPhotoURL}
/>
```

## 🐛 Troubleshooting

### Common Issues:

**1. Messages not loading**
- Check Firebase configuration in `.env`
- Verify Firestore rules are deployed
- Check browser console for authentication errors

**2. Permission denied errors**
- Ensure user is authenticated (`useAuth` returns valid user)
- Check that chatId format is correct (sorted user IDs)
- Verify Firestore security rules are properly deployed

**3. Messages not sending**
- Check that `senderId` matches authenticated user UID
- Verify Firestore write permissions
- Check network connectivity

**4. Real-time updates not working**
- Ensure proper cleanup of onSnapshot listeners
- Check that component is not unmounting/remounting excessively
- Verify Firestore connection is stable

### Debug Mode:
All components include detailed logging when `import.meta.env.DEV` is true. Check browser console for detailed information about:
- Message subscription setup
- Real-time updates
- Send operations
- Error details

## 🔄 Migration from Existing System

If you were using the existing Supabase messaging system:

1. The new Firebase system is already integrated and should work immediately
2. Old Supabase dependencies can be removed after testing
3. The `useMessages` hook interface remains the same for backward compatibility
4. Existing UI components in Messages page work without changes

## 📈 Performance Considerations

### Optimizations Included:
- ✅ Efficient chatId-based querying (no complex `where` clauses)
- ✅ Proper Firestore indexes for fast message retrieval  
- ✅ Real-time listeners with automatic cleanup
- ✅ Component-level loading states
- ✅ Minimal re-renders with optimized useEffect dependencies

### Best Practices:
- Chat messages are stored in subcollections for better scalability
- Security rules prevent unauthorized access
- Auto-scroll only happens when new messages arrive
- Proper error boundaries for failed operations

## 🚀 Next Steps

After basic setup, consider adding:

1. **Message read status** - Track when messages are read
2. **Typing indicators** - Show when someone is typing
3. **File/image sharing** - Upload attachments via Firebase Storage
4. **Push notifications** - Firebase Cloud Messaging for offline users
5. **Message search** - Full-text search within conversations
6. **Message reactions** - Emoji reactions to messages
7. **Group chats** - Extend system for multiple participants

The current implementation provides a solid foundation for all these features!

## 📞 Support

If you encounter any issues:
1. Check this README for troubleshooting steps
2. Review browser console for detailed error messages  
3. Verify Firebase configuration and security rules
4. Test with simple user scenarios first (2 authenticated users, basic messages)

The messaging system is now fully integrated and ready to use! 🎉
