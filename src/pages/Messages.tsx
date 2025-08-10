import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  ArrowLeft,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useConnections";
import { useConnectionProfiles } from "@/hooks/useConnectionProfiles";
import { useSupabaseConversations } from "@/hooks/useSupabaseConversations";
import { useConnectedUsers } from "@/hooks/useConnectedUsers";
import { useFriends } from "@/hooks/useFriends";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useChatConversations } from "@/hooks/useChatConversations";
import ChatRoom from "@/components/ChatRoom";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, loading: connectionsLoading } = useConnections();
  const { conversations: supaConvs } = useSupabaseConversations();
  const { contacts } = useConnectedUsers();
  const { friends } = useFriends();
  const { users: allUsers } = useAllUsers();
  const { chats, loading: chatsLoading } = useChatConversations();
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Include pending and accepted connections in the list
  const fallbackFromSupabase = supaConvs.map((c: any) => ({
      id: c.conversationId,
      status: 'accepted',
      connectedUserId: c.otherUserId,
      skillName: 'Chat',
      message: ''
    }))
  const fallbackFromContacts = contacts.map((c: any) => ({
      id: c.id,
      status: c.status,
      connectedUserId: c.connectedUserId,
      skillName: 'Chat',
      message: ''
    }))
  const fallbackFromFriends = friends.map((f: any) => ({
    id: f.id,
    status: 'accepted',
    connectedUserId: f.connectedUserId,
    skillName: 'Chat',
    message: ''
  }))
  const fallbackFromChats = chats.map((c: any) => ({
    id: c.id,
    status: 'accepted',
    connectedUserId: c.otherUserId,
    skillName: 'Chat',
    message: ''
  }))
  // Final fallback: show all users to start a new chat even if no connections exist yet
  const fallbackFromAllUsers = allUsers.map((u: any) => ({
    id: `user-${u.uid}`,
    status: 'accepted',
    connectedUserId: u.uid,
    skillName: 'Chat',
    message: ''
  }))

  const unionCandidates = [
    ...connections,
    ...fallbackFromContacts,
    ...fallbackFromFriends,
    ...fallbackFromChats,
    ...fallbackFromSupabase,
    ...fallbackFromAllUsers,
  ]
    .map((c: any) => ({
      ...c,
      connectedUserId: c.connectedUserId || (c.senderId === user?.uid ? c.recipientId : c.senderId)
    }))
    .filter((c) => c.connectedUserId && c.connectedUserId !== user?.uid && c.status !== 'rejected');

  // De-duplicate by connectedUserId, prefer accepted over others
  const mergedMap = new Map<string, any>();
  for (const c of unionCandidates) {
    const key = c.connectedUserId;
    const prev = mergedMap.get(key);
    if (!prev) {
      mergedMap.set(key, c);
    } else if (prev.status !== 'accepted' && c.status === 'accepted') {
      mergedMap.set(key, c);
    }
  }
  const uniqueConnections = Array.from(mergedMap.values()).filter(
    (c) => c.connectedUserId && c.connectedUserId !== user?.uid
  );

  // Get profiles for all listed connections
  const { getDisplayName, getAvatarUrl } = useConnectionProfiles(uniqueConnections);

  // Filter connections based on search
  const lowered = searchQuery.toLowerCase();
  const filteredConnections = uniqueConnections.filter(connection => {
    const skillMatch = connection.skillName?.toLowerCase().includes(lowered);
    const messageMatch = connection.message?.toLowerCase().includes(lowered);
    const nameMatch = getDisplayName(connection.connectedUserId)?.toLowerCase().includes(lowered);
    return Boolean(skillMatch || messageMatch || nameMatch);
  });

  // Use the new hook functions directly
  const getConnectionDisplayName = (connection: any) => {
    return getDisplayName(connection.connectedUserId);
  };

  const getConnectionAvatar = (connection: any) => {
    return getAvatarUrl(connection.connectedUserId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view messages.</p>
          <Button onClick={() => navigate("/login")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-primary">Messages</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List */}
        <div className="w-full md:w-80 border-r border-border bg-background">
          <div className="p-4 border-b border-border">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {connectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start connecting with users to see conversations here</p>
                </div>
              ) : (
                filteredConnections.map((connection) => (
                  <Card
                    key={`${connection.connectedUserId}-${connection.id}`}
                    className={`cursor-pointer transition-colors ${
                      selectedConnection?.id === connection.id
                        ? 'bg-accent border-accent'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedConnection(connection)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getConnectionAvatar(connection)} />
                          <AvatarFallback>
                            {getConnectionDisplayName(connection).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground truncate">
                              {getConnectionDisplayName(connection)}
                            </h3>
                            <Badge variant={connection.status === 'accepted' ? 'default' : 'secondary'}>
                              {connection.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {connection.skillName}
                          </p>
                          {connection.message && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {connection.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedConnection ? (
            <ChatRoom 
              otherUserId={selectedConnection.connectedUserId}
              otherUserName={getConnectionDisplayName(selectedConnection)}
              otherUserAvatar={getConnectionAvatar(selectedConnection)}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;