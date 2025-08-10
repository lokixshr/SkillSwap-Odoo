import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  Network,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedInConnections } from '@/hooks/useLinkedInConnections';
import { ConnectButton } from '@/components/connections/ConnectButton';
import { ConnectionRequests } from '@/components/connections/ConnectionRequests';
import { toast } from 'sonner';

export const ConnectionsDemo: React.FC = () => {
  const { user } = useAuth();
  const {
    connections,
    loading,
    sendConnectionRequest,
    getStats,
    isAuthenticated,
    error,
    clearError
  } = useLinkedInConnections();

  const [testUserId, setTestUserId] = React.useState('');
  const [testMessage, setTestMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const stats = getStats();

  const handleTestConnection = async () => {
    if (!testUserId.trim()) {
      toast.error('Please enter a target user ID');
      return;
    }

    try {
      setIsSending(true);
      await sendConnectionRequest({
        targetUserId: testUserId.trim(),
        message: testMessage.trim() || undefined
      });
      setTestUserId('');
      setTestMessage('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-6 w-6" />
              LinkedIn-Style Connections Demo
            </CardTitle>
            <CardDescription>
              Please log in to test the connection request functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Authentication required to access connections</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Network className="h-8 w-8 text-blue-600" />
          LinkedIn-Style Connections Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the complete connection request functionality including sending requests, 
          receiving notifications, and accepting/rejecting connections.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearError}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connection Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalConnections}</div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sent Requests:</span>
                <Badge variant="outline">{stats.sentRequests}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Unread Notifications:</span>
                <Badge variant="outline">{stats.unreadNotifications}</Badge>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Current User ID:</strong> {user?.uid}</p>
              <p><strong>Status:</strong> 
                {loading ? (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="text-green-600 ml-1">✓ Connected</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Connection Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send Test Connection Request
            </CardTitle>
            <CardDescription>
              Enter a user ID to send a connection request (for testing)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUserId">Target User ID</Label>
              <Input
                id="targetUserId"
                placeholder="Enter user ID to connect with"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Input
                id="message"
                placeholder="Hi! I'd like to connect with you on SkillSwap"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={isSending || !testUserId.trim()}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Request...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Send Connection Request
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Tips for testing:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use a different user ID than your own</li>
                <li>Try sending to the same user multiple times to see duplicate prevention</li>
                <li>Log in as different users to test accepting/rejecting</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Requests */}
      <ConnectionRequests />

      {/* Connection History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Connection History
          </CardTitle>
          <CardDescription>
            All your sent and received connection requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading connection history...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sent Requests */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Sent Requests ({connections.sent.length})</h3>
                <div className="space-y-2">
                  {connections.sent.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No sent requests</p>
                  ) : (
                    connections.sent.slice(0, 5).map((connection, index) => (
                      <div key={connection.id || index} className="text-xs border rounded p-2">
                        <div className="flex justify-between items-center">
                          <span>To: {connection.receiverId}</span>
                          <Badge 
                            variant={
                              connection.status === 'accepted' ? 'default' : 
                              connection.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {connection.status}
                          </Badge>
                        </div>
                        {connection.message && (
                          <p className="text-gray-600 mt-1 truncate">{connection.message}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Received Requests */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Received Requests ({connections.received.length})</h3>
                <div className="space-y-2">
                  {connections.received.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No received requests</p>
                  ) : (
                    connections.received.slice(0, 5).map((connection, index) => (
                      <div key={connection.id || index} className="text-xs border rounded p-2">
                        <div className="flex justify-between items-center">
                          <span>From: {connection.senderId}</span>
                          <Badge 
                            variant={
                              connection.status === 'accepted' ? 'default' : 
                              connection.status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {connection.status}
                          </Badge>
                        </div>
                        {connection.message && (
                          <p className="text-gray-600 mt-1 truncate">{connection.message}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to integrate the ConnectButton component in your app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Basic Connect Button</Label>
            <div className="flex items-center gap-4">
              <ConnectButton 
                targetUserId="example-user-1" 
                targetUserName="John Doe"
              />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {`<ConnectButton targetUserId="user-id" targetUserName="Name" />`}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Small Outline Button</Label>
            <div className="flex items-center gap-4">
              <ConnectButton 
                targetUserId="example-user-2" 
                targetUserName="Jane Smith"
                variant="outline"
                size="sm"
              />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {`<ConnectButton variant="outline" size="sm" ... />`}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon Only Button</Label>
            <div className="flex items-center gap-4">
              <ConnectButton 
                targetUserId="example-user-3" 
                targetUserName="Bob Wilson"
                variant="ghost"
                showText={false}
              />
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {`<ConnectButton showText={false} ... />`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionsDemo;
