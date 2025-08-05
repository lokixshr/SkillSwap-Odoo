import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Search, 
  Video, 
  Calendar, 
  MoreVertical,
  Phone,
  Paperclip,
  Smile
} from "lucide-react";
import { Link } from "react-router-dom";

const Messages = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  // Mock conversation data
  const conversations = [
    {
      id: 1,
      user: { name: "Sarah Chen", avatar: "", initials: "SC" },
      lastMessage: "Thanks for the React lesson! Really helpful.",
      timestamp: "2m ago",
      unread: 2,
      skill: "React Development",
      online: true
    },
    {
      id: 2,
      user: { name: "Alex Kumar", avatar: "", initials: "AK" },
      lastMessage: "When can we schedule our Python session?",
      timestamp: "15m ago",
      unread: 0,
      skill: "Python Programming",
      online: true
    },
    {
      id: 3,
      user: { name: "Emma Wilson", avatar: "", initials: "EW" },
      lastMessage: "Great session yesterday! Looking forward to the next one.",
      timestamp: "2h ago",
      unread: 0,
      skill: "Digital Marketing",
      online: false
    },
    {
      id: 4,
      user: { name: "Carlos Rodriguez", avatar: "", initials: "CR" },
      lastMessage: "¡Hola! Ready for our Spanish practice?",
      timestamp: "1d ago",
      unread: 1,
      skill: "Spanish Conversation",
      online: false
    }
  ];

  // Mock messages for active chat
  const messages = [
    {
      id: 1,
      sender: "Sarah Chen",
      content: "Hi John! Thanks for accepting my request to learn React.",
      timestamp: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      sender: "You",
      content: "Hello Sarah! I'm excited to help you learn React. Do you have any specific topics you'd like to focus on?",
      timestamp: "10:32 AM",
      isOwn: true
    },
    {
      id: 3,
      sender: "Sarah Chen",
      content: "I'm particularly interested in learning about hooks and state management. I have some basic knowledge but want to dive deeper.",
      timestamp: "10:35 AM",
      isOwn: false
    },
    {
      id: 4,
      sender: "You",
      content: "Perfect! Hooks are a great topic. We can start with useState and useEffect, then move on to more advanced concepts. Would you like to schedule a video call?",
      timestamp: "10:37 AM",
      isOwn: true
    },
    {
      id: 5,
      sender: "Sarah Chen",
      content: "That sounds great! When would be a good time for you?",
      timestamp: "10:40 AM",
      isOwn: false
    },
    {
      id: 6,
      sender: "You",
      content: "How about tomorrow at 2 PM? I can set up a Google Meet link for us.",
      timestamp: "10:42 AM",
      isOwn: true
    },
    {
      id: 7,
      sender: "Sarah Chen",
      content: "Perfect! Tomorrow at 2 PM works for me. Thanks for the React lesson! Really helpful.",
      timestamp: "10:45 AM",
      isOwn: false
    }
  ];

  const currentConversation = conversations.find(conv => conv.id === activeChat);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const handleScheduleMeeting = () => {
    // Here you would integrate with Google Meet/Zoom APIs
    console.log("Scheduling meeting with", currentConversation?.user.name);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="text-2xl font-bold text-primary">SkillSwap</Link>
            <nav className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Avatar className="w-8 h-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setActiveChat(conversation.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                      activeChat === conversation.id ? 'bg-accent/20 border-r-2 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.user.avatar} />
                          <AvatarFallback>{conversation.user.initials}</AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">{conversation.user.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                            {conversation.unread > 0 && (
                              <Badge variant="destructive" className="w-5 h-5 text-xs flex items-center justify-center p-0">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs mb-1">{conversation.skill}</Badge>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-2 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={currentConversation.user.avatar} />
                          <AvatarFallback>{currentConversation.user.initials}</AvatarFallback>
                        </Avatar>
                        {currentConversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{currentConversation.user.name}</h3>
                        <Badge variant="outline" className="text-xs">{currentConversation.skill}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleScheduleMeeting}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Meeting
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[70%] ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!message.isOwn && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{currentConversation.user.initials}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`rounded-lg p-3 ${
                            message.isOwn 
                              ? 'bg-accent text-accent-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.isOwn ? 'text-accent-foreground/70' : 'text-muted-foreground/70'
                            }`}>
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none min-h-[40px] max-h-32 pr-12"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="btn-hero"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the left to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;