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
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  // Mock user data
  const user = {
    name: "John Doe",
    avatar: "",
    initials: "JD",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    joinDate: "March 2024",
    bio: "Passionate software developer and lifelong learner. I love sharing knowledge about web development and learning new skills from others in the community.",
    stats: {
      skillsTaught: 8,
      skillsLearned: 12,
      totalSessions: 45,
      rating: 4.8,
      reviews: 23
    }
  };

  const skills = [
    { name: "React Development", level: 90, category: "Teaching", sessions: 15 },
    { name: "JavaScript", level: 85, category: "Teaching", sessions: 12 },
    { name: "Python", level: 70, category: "Learning", sessions: 8 },
    { name: "Digital Marketing", level: 40, category: "Learning", sessions: 5 },
    { name: "Spanish", level: 60, category: "Learning", sessions: 10 },
    { name: "UI/UX Design", level: 75, category: "Teaching", sessions: 7 }
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
              <Avatar className="w-8 h-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">{user.initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                    <div className="flex items-center text-muted-foreground mt-2 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {user.joinDate}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="sm:self-start">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
                
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="hover-lift">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{user.stats.skillsTaught}</div>
              <div className="text-sm text-muted-foreground">Skills Taught</div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{user.stats.skillsLearned}</div>
              <div className="text-sm text-muted-foreground">Skills Learned</div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{user.stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                <div className="text-2xl font-bold text-accent">{user.stats.rating}</div>
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent">{user.stats.reviews}</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-accent" />
                    Teaching Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.filter(skill => skill.category === "Teaching").map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">{skill.sessions} sessions</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-accent" />
                    Learning Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skills.filter(skill => skill.category === "Learning").map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">{skill.sessions} sessions</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.map((badge, index) => (
                <Card key={index} className="hover-lift">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                      <badge.icon className={`w-8 h-8 ${badge.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'taught' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {activity.type === 'taught' ? <BookOpen className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">
                        {activity.type === 'taught' ? 'Taught' : 'Learned'} <span className="font-medium">{activity.skill}</span>
                        {activity.type === 'taught' ? ' to ' : ' from '}<span className="font-medium">{activity.user}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Reviews ({reviews.length})</span>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                    <span className="font-medium">{user.stats.rating}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={index} className="border-b border-border last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{review.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">{review.user}</h4>
                            <p className="text-sm text-muted-foreground">Learned {review.skill}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-2">{review.comment}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;