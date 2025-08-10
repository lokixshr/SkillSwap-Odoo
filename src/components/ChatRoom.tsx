import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  Timestamp,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Message interface matching the required structure
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Timestamp;
}

interface ChatRoomProps {
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  className?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ 
  otherUserId, 
  otherUserName = 'User', 
  otherUserAvatar,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate chatId from sorted user IDs
  const chatId = React.useMemo(() => {
    if (!user || !otherUserId) return '';
    return [user.uid, otherUserId].sort().join('_');
  }, [user?.uid, otherUserId]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure parent chat doc exists and set up real-time listener for messages
  useEffect(() => {
    if (!user || !otherUserId || !chatId) {
      console.log('Missing required data for message listener:', { user: !!user, otherUserId, chatId });
      setMessages([]);
      setLoading(false);
      return;
    }

    if (user.uid === otherUserId) {
      console.warn('Refusing to open chat with self.');
      setMessages([]);
      setLoading(false);
      return;
    }

    console.log('Setting up message listener for chatId:', chatId);

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const setup = async () => {
      try {
        // Create or merge the parent chat doc first (no pre-read to avoid rule issues)
        const chatRef = doc(db, 'chats', chatId);
        const participantsSorted = [user.uid, otherUserId].sort();
        await setDoc(
          chatRef,
          {
            participants: participantsSorted,
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
            lastMessageAt: new Date() as any,
          } as any,
          { merge: true }
        );

        if (cancelled) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const messageData: Message[] = [];

            console.log(`Raw snapshot has ${snapshot.docs.length} documents`);

            snapshot.forEach((doc) => {
              const data = doc.data();
              console.log('Raw message data:', data);

              let createdAt: Timestamp;
              if (data.createdAt && data.createdAt.toDate) {
                createdAt = data.createdAt;
              } else {
                createdAt = new Timestamp(Math.floor(Date.now() / 1000), 0);
              }

              messageData.push({
                id: doc.id,
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                createdAt,
              });
            });

            messageData.sort((a, b) => {
              const aTime = a.createdAt?.toDate()?.getTime() || 0;
              const bTime = b.createdAt?.toDate()?.getTime() || 0;
              return aTime - bTime;
            });

            console.log('Processed messages:', messageData.length, messageData);
            setMessages(messageData);
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to messages:', error);
            toast({
              title: 'Error',
              description: 'Failed to load messages. Please refresh the page.',
              variant: 'destructive',
            });
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Failed to ensure parent chat document:', err);
        setLoading(false);
      }
    };

    setup();

    return () => {
      cancelled = true;
      console.log('Cleaning up message listener');
      if (unsubscribe) unsubscribe();
    };
  }, [user, otherUserId, chatId, toast]);

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !otherUserId || sending) {
      return;
    }

    if (user.uid === otherUserId) {
      toast({ title: 'Invalid action', description: 'Cannot chat with yourself.', variant: 'destructive' });
      return;
    }

    setSending(true);
    
    try {
      console.log('Sending message:', {
        senderId: user.uid,
        receiverId: otherUserId,
        content: newMessage,
        chatId
      });

      // Ensure parent chat doc exists/updated before sending
      const chatRef = doc(db, 'chats', chatId);
      const participantsSorted = [user.uid, otherUserId].sort();
      await setDoc(
        chatRef,
        {
          participants: participantsSorted,
          updatedAt: new Date() as any,
          lastMessageAt: new Date() as any,
        } as any,
        { merge: true }
      );

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        receiverId: otherUserId,
        content: newMessage.trim(),
        createdAt: new Date() as any,
      });

      setNewMessage('');
      console.log('Message sent successfully');
      
      toast({
        title: 'Success',
        description: 'Message sent!',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Just now';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to use chat.</p>
      </div>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="flex flex-row items-center space-y-0 space-x-4 pb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUserAvatar} />
          <AvatarFallback>{otherUserName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{otherUserName}</h3>
          <p className="text-sm text-muted-foreground">Chat conversation</p>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === user.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMine && (
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={otherUserAvatar} />
                          <AvatarFallback>{otherUserName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'
                          }`}
                        >
                          {isMine ? 'You • ' : ''}{formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatRoom;
