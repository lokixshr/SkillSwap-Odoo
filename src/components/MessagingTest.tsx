import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import ChatRoom from './ChatRoom';
import { Users, MessageCircle, Plus } from 'lucide-react';

const MessagingTest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testUsers, setTestUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Create test users for messaging
  const createTestUser = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create a test user ID (simulate different users)
      const testUserId = `test_user_${Date.now()}`;
      const testUserName = `Test User ${testUsers.length + 1}`;
      
      // Add to our local test users list
      const newTestUser = {
        uid: testUserId,
        displayName: testUserName,
        email: `${testUserId}@test.com`,
        photoURL: null,
        isTest: true
      };

      setTestUsers(prev => [...prev, newTestUser]);
      
      toast({
        title: 'Test User Created',
        description: `Created ${testUserName} for testing messaging`,
      });
      
    } catch (error) {
      console.error('Error creating test user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Search for real users
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    try {
      const users = await UserService.searchUsers(query, 5);
      const realUsers = users.filter(u => u.uid !== user?.uid);
      setTestUsers(prev => {
        // Merge real users with test users, avoid duplicates
        const existing = prev.map(u => u.uid);
        const newUsers = realUsers.filter(u => !existing.includes(u.uid));
        return [...prev, ...newUsers.map(u => ({ ...u, isTest: false }))];
      });
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const selectUser = (testUser: any) => {
    setSelectedUserId(testUser.uid);
    setSelectedUserName(testUser.displayName || testUser.email);
    
    toast({
      title: 'User Selected',
      description: `Now chatting with ${testUser.displayName || testUser.email}`,
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to test messaging
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messaging Test Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Current User:</strong> {user.displayName || user.email} ({user.uid})</p>
            <p><strong>Issue:</strong> You were trying to chat with yourself (same senderId & receiverId)</p>
            <p><strong>Solution:</strong> Create test users or find real users to chat with</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={createTestUser} 
              disabled={loading}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Test User
            </Button>
            
            <Input 
              placeholder="Search for real users..."
              onChange={(e) => searchUsers(e.target.value)}
              className="flex-1"
            />
          </div>

          {testUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Users for Chat:
              </h4>
              <div className="grid gap-2">
                {testUsers.map((testUser) => (
                  <div key={testUser.uid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{testUser.displayName || testUser.email}</p>
                      <p className="text-xs text-muted-foreground">{testUser.uid}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={testUser.isTest ? "secondary" : "default"}>
                        {testUser.isTest ? "Test" : "Real"}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => selectUser(testUser)}
                        variant={selectedUserId === testUser.uid ? "default" : "outline"}
                      >
                        {selectedUserId === testUser.uid ? "Chatting" : "Chat"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Chat with {selectedUserName}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Chat ID: {[user.uid, selectedUserId].sort().join('_')}
            </div>
          </CardHeader>
          <CardContent>
            <ChatRoom 
              otherUserId={selectedUserId}
              otherUserName={selectedUserName}
              className="h-96"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessagingTest;
