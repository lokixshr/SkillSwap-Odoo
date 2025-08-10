import React from 'react';
import ChatRoom from '@/components/ChatRoom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Example component demonstrating different ways to use the ChatRoom component
 * throughout your SkillSwap application
 */
const ChatRoomExample: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">ChatRoom Integration Examples</h1>
        <p className="text-muted-foreground mb-8">
          Here are different ways to integrate the ChatRoom component in your SkillSwap app:
        </p>
      </div>

      {/* Example 1: Full Page Chat */}
      <Card>
        <CardHeader>
          <CardTitle>1. Full Page Chat (Messages Page)</CardTitle>
          <CardDescription>
            Used in the main Messages page for full chat experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-lg">
            <ChatRoom 
              otherUserId="user123"
              otherUserName="John Doe"
              otherUserAvatar="https://github.com/shadcn.png"
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Embedded in Profile/Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle>2. Quick Chat in User Profile</CardTitle>
          <CardDescription>
            Embedded chat when viewing someone's profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-6">
            {/* User Profile Summary */}
            <div className="flex-shrink-0 space-y-4">
              <div className="text-center">
                <img 
                  src="https://github.com/shadcn.png" 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full mx-auto"
                />
                <h3 className="font-semibold mt-2">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">React Developer</p>
                <div className="flex gap-2 mt-2 justify-center">
                  <Badge variant="secondary">JavaScript</Badge>
                  <Badge variant="secondary">React</Badge>
                </div>
              </div>
              <Button className="w-full">View Full Profile</Button>
            </div>
            
            {/* Quick Chat */}
            <div className="flex-1">
              <h4 className="font-medium mb-2">Quick Chat</h4>
              <div className="h-64 border rounded-lg">
                <ChatRoom 
                  otherUserId="user456"
                  otherUserName="Sarah Johnson"
                  otherUserAvatar="https://github.com/shadcn.png"
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 3: Modal Chat */}
      <Card>
        <CardHeader>
          <CardTitle>3. Modal/Popup Chat</CardTitle>
          <CardDescription>
            Chat that opens in a dialog/modal overlay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can wrap ChatRoom in a Dialog component for modal chat experience:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <code className="text-sm">
{`import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Start Chat</Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl h-[600px]">
    <ChatRoom 
      otherUserId="user789"
      otherUserName="Mike Wilson"
      otherUserAvatar="/avatars/mike.png"
      className="h-full"
    />
  </DialogContent>
</Dialog>`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 4: Connection/Skill Post Integration */}
      <Card>
        <CardHeader>
          <CardTitle>4. Skill Post with Chat</CardTitle>
          <CardDescription>
            Integrate chat directly with skill posts for immediate connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skill Post */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://github.com/shadcn.png" 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold">Alex Chen</h4>
                    <p className="text-sm text-muted-foreground">Looking to Learn</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="font-medium">Want to learn React Native</h3>
                  <p className="text-sm text-muted-foreground">
                    I'm experienced in web React but new to mobile development. 
                    Looking for someone to help me get started!
                  </p>
                  <div className="flex gap-2">
                    <Badge>React Native</Badge>
                    <Badge>Mobile</Badge>
                    <Badge variant="outline">Beginner</Badge>
                  </div>
                  <Button className="w-full">Connect & Help</Button>
                </div>
              </CardContent>
            </Card>

            {/* Integrated Chat */}
            <div>
              <h4 className="font-medium mb-2">Start Conversation</h4>
              <div className="h-80 border rounded-lg">
                <ChatRoom 
                  otherUserId="alex123"
                  otherUserName="Alex Chen"
                  otherUserAvatar="https://github.com/shadcn.png"
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
          <CardDescription>
            Technical details for developers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Props:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li><code>otherUserId</code>: The Firebase UID of the user you're chatting with</li>
              <li><code>otherUserName</code>: Display name for the other user</li>
              <li><code>otherUserAvatar</code>: Avatar URL (optional)</li>
              <li><code>className</code>: Additional CSS classes for styling</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Features:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground ml-4">
              <li>✅ Real-time messaging with Firebase Firestore</li>
              <li>✅ Auto-scroll to latest messages</li>
              <li>✅ Responsive design</li>
              <li>✅ Message timestamps</li>
              <li>✅ Send on Enter key</li>
              <li>✅ Loading states</li>
              <li>✅ Error handling</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Firestore Structure:</h4>
            <div className="bg-slate-50 p-3 rounded text-xs font-mono">
              /chats/{'{chatId}'}/messages/{'{messageId}'}<br/>
              &nbsp;&nbsp;├── senderId: string<br/>
              &nbsp;&nbsp;├── receiverId: string<br/>
              &nbsp;&nbsp;├── content: string<br/>
              &nbsp;&nbsp;└── createdAt: serverTimestamp<br/>
              <br/>
              <span className="text-muted-foreground">
                chatId = sorted([userId1, userId2]).join('_')
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRoomExample;
