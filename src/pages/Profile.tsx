import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Star, 
  Award, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Edit3,
  Mail,
  Phone,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSkillPosts } from "@/hooks/useSkillPosts";

const Profile = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { posts: userPosts, loading: postsLoading } = useSkillPosts();

  // Use real user data or fallback to mock data
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || "User";
  const email = userProfile?.email || user?.email || "user@example.com";
  const photoURL = userProfile?.photoURL || user?.photoURL || "";
  const location = userProfile?.location || "Location not set";
  const bio = userProfile?.bio || "No bio available";
  const firstName = userProfile?.firstName || displayName.split(' ')[0];
  const lastName = userProfile?.lastName || displayName.split(' ').slice(1).join(' ') || "";

  // Calculate stats from real data
  const teachingPosts = userPosts.filter(post => post.type === 'teach');
  const learningPosts = userPosts.filter(post => post.type === 'learn');
  
  const stats = {
    skillsTaught: teachingPosts.length,
    skillsLearned: learningPosts.length,
    totalSessions: 0, // Will be calculated from connections
    rating: 4.8, // Will be calculated from reviews
    reviews: 0
  };

  const skills = [
    ...userProfile?.skillsToTeach.map(skill => ({ 
      name: skill, 
      level: 90, 
      category: "Teaching", 
      sessions: teachingPosts.filter(p => p.skillName === skill).length 
    })) || [],
    ...userProfile?.skillsToLearn.map(skill => ({ 
      name: skill, 
      level: 40, 
      category: "Learning", 
      sessions: learningPosts.filter(p => p.skillName === skill).length 
    })) || []
  ];

  const badges = [
    { name: "Bronze Teacher", icon: Award, color: "text-amber-600", description: "Completed 10+ teaching sessions" },
    { name: "Knowledge Seeker", icon: BookOpen, color: "text-blue-600", description: "Learned 5+ new skills" },
    { name: "Community Helper", icon: Star, color: "text-green-600", description: "Maintained 4.5+ rating" },
    { name: "Early Adopter", icon: Calendar, color: "text-purple-600", description: "Joined in first month" }
  ];

  const recentActivity = [
    { type: "taught", skill: "React Development", user: "Sarah Chen", date: "2 days ago" },
    { type: "learned", skill: "Python", user: "Alex Kumar", date: "3 days ago" },
    { type: "taught", skill: "JavaScript", user: "Emma Wilson", date: "1 week ago" },
    { type: "learned", skill: "Spanish", user: "Carlos Rodriguez", date: "1 week ago" }
  ];

  const reviews = [
    { 
      user: "Sarah Chen", 
      skill: "React Development", 
      rating: 5, 
      comment: "John was an excellent teacher! Very patient and explained complex concepts clearly.",
      date: "1 week ago"
    },
    { 
      user: "Emma Wilson", 
      skill: "JavaScript", 
      rating: 5, 
      comment: "Great session on JavaScript fundamentals. Highly recommend!",
      date: "2 weeks ago"
    },
    { 
      user: "Mike Johnson", 
      skill: "React Development", 
      rating: 4, 
      comment: "Very knowledgeable and helpful. Looking forward to our next session.",
      date: "3 weeks ago"
    }
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="text-2xl font-bold text-primary">SkillSwap</Link>
            <div className="flex items-center space-x-4">
              <Link to="/messages">
                <Button variant="ghost" size="icon">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={photoURL} />
              <AvatarFallback className="text-2xl">
                {firstName?.charAt(0) || lastName?.charAt(0) || displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                  <p className="text-muted-foreground">{email}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {userProfile?.createdAt?.toDate ? 
                    new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 
                    'Recently'
                  }</span>
                </div>
              </div>
              
              {bio && (
                <p className="mt-4 text-foreground">{bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.skillsTaught}</div>
                <div className="text-sm text-muted-foreground">Skills Taught</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.skillsLearned}</div>
                <div className="text-sm text-muted-foreground">Skills Learned</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.rating}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.reviews}</div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid gap-4">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{skill.name}</h3>
                          <p className="text-sm text-muted-foreground">{skill.category}</p>
                        </div>
                        <Badge variant="outline">{skill.sessions} sessions</Badge>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No skills added yet. Complete your onboarding to add skills!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'taught' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.type === 'taught' ? <BookOpen className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {activity.type === 'taught' ? 'Taught' : 'Learned'} {activity.skill}
                        </p>
                        <p className="text-sm text-muted-foreground">with {activity.user} • {activity.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground">{review.user}</h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.skill}</p>
                        <p className="text-foreground mb-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((badge, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-accent/10`}>
                        <badge.icon className={`w-6 h-6 ${badge.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{badge.name}</h4>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;