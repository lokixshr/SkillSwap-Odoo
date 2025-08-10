import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Star, Users, BookOpen, Calendar, Search, Plus, LogOut, Bell, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SkillPostModal from "@/components/SkillPostModal";
import ConnectionModal from "@/components/ConnectionModal";
import { SkillPostService, SkillPost, ConnectionService } from "@/lib/database";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserService, UserProfile } from "@/lib/database";
import NotificationBell from "@/components/NotificationBell";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [selectedSkillPost, setSelectedSkillPost] = useState<SkillPost | null>(null);
  const [skillsToTeach, setSkillsToTeach] = useState<SkillPost[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<SkillPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<UserProfile[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const stats = [
    { label: "Active Connections", value: "12", icon: Users },
    { label: "Skills Taught", value: "8", icon: BookOpen },
    { label: "Hours Logged", value: "45", icon: Calendar },
    { label: "Average Rating", value: "4.8", icon: Star }
  ];

  const handleViewProfile = (userId: string) => {
    // Navigate to a user profile page (for now, navigate to general profile)
    navigate(`/profile`);
  };

  // Set up real-time listeners for skill posts
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time listeners for user:', user.uid);

    // Subscribe to skills to teach (learn requests)
    const unsubscribeTeach = SkillPostService.subscribeToSkillPostsByType('learn', (posts) => {
      console.log('Received learn posts:', posts);
      setSkillsToTeach(posts);
      setLoading(false);
    });

    // Subscribe to skills to learn (teach offers)
    const unsubscribeLearn = SkillPostService.subscribeToSkillPostsByType('teach', (posts) => {
      console.log('Received teach posts:', posts);
      setSkillsToLearn(posts);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up real-time listeners');
      unsubscribeTeach();
      unsubscribeLearn();
    };
  }, [user]);

  // User search effect
  useEffect(() => {
    let active = true;
    if (userSearch.trim().length === 0) {
      setUserSuggestions([]);
      return;
    }
    UserService.searchUsers(userSearch, 5).then(users => {
      if (active) setUserSuggestions(users);
    });
    return () => { active = false; };
  }, [userSearch]);

  const handleConnect = (skillPost: SkillPost) => {
    setSelectedSkillPost(skillPost);
    setIsConnectionModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Removed test buttons and helpers per request

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">SkillSwap</Link>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search skills or users..."
                  className="pl-10"
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value);
                    setShowUserSuggestions(true);
                  }}
                  onFocus={() => setShowUserSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowUserSuggestions(false), 150)}
                />
                {showUserSuggestions && userSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-background border border-border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    {userSuggestions.map(sug => (
                      <div
                        key={sug.uid}
                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-accent"
                        onMouseDown={() => {
                          setShowUserSuggestions(false);
                          setUserSearch("");
                          navigate(`/profile?uid=${sug.uid}`);
                        }}
                      >
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={sug.photoURL || ""} />
                          <AvatarFallback>{sug.displayName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{sug.displayName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{sug.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Test buttons removed */}
              <Link to="/sessions">
                <Button variant="ghost" size="icon">
                  <CalendarDays className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" size="icon">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <NotificationBell />
              <Link to="/profile">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">Ready to share knowledge and learn something new today?</p>
          </div>
          <Button
            onClick={() => setIsSkillModalOpen(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-12 rounded-full p-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="teach" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teach">Skills to Teach</TabsTrigger>
            <TabsTrigger value="learn">Skills to Learn</TabsTrigger>
          </TabsList>

          <TabsContent value="teach" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">People want to learn from you</h2>
              <Badge variant="secondary">{skillsToTeach.length} requests</Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : skillsToTeach.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No learning requests yet. Check back later!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {skillsToTeach.map((request) => (
                  <Card key={request.id} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.userPhotoURL || ""} />
                            <AvatarFallback>{request.userDisplayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-foreground">{request.userDisplayName}</h3>
                              <Badge variant="outline">{request.proficiencyLevel}</Badge>
                            </div>
                            <p className="text-lg font-medium text-accent mb-1">{request.skillName}</p>
                            <p className="text-muted-foreground mb-2">{request.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.timestamp?.toDate ?
                                new Date(request.timestamp.toDate()).toLocaleDateString() :
                                'Recently'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(request.userId)}
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            className="btn-hero"
                            onClick={() => handleConnect(request)}
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="learn" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Available skills to learn</h2>
              <Badge variant="secondary">{skillsToLearn.length} offers</Badge>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : skillsToLearn.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No teaching offers yet. Check back later!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {skillsToLearn.map((offer) => (
                  <Card key={offer.id} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={offer.userPhotoURL || ""} />
                            <AvatarFallback>{offer.userDisplayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-foreground">{offer.userDisplayName}</h3>
                              <Badge variant="outline">{offer.proficiencyLevel}</Badge>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-muted-foreground ml-1">4.8</span>
                              </div>
                            </div>
                            <p className="text-lg font-medium text-accent mb-1">{offer.skillName}</p>
                            <p className="text-muted-foreground mb-2">{offer.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {offer.timestamp?.toDate ?
                                new Date(offer.timestamp.toDate()).toLocaleDateString() :
                                'Recently'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(offer.userId)}
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            className="btn-hero"
                            onClick={() => handleConnect(offer)}
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SkillPostModal
        open={isSkillModalOpen}
        onOpenChange={setIsSkillModalOpen}
      />

      {selectedSkillPost && (
        <ConnectionModal
          open={isConnectionModalOpen}
          onOpenChange={setIsConnectionModalOpen}
          skillPost={selectedSkillPost}
        />
      )}
    </div>
  );
};

export default Dashboard;