import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Star, Users, BookOpen, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock data for skills to teach requests
  const skillsToTeach = [
    {
      id: 1,
      skill: "React Development",
      user: { name: "Sarah Chen", avatar: "", initials: "SC" },
      level: "Beginner",
      description: "Looking to learn React fundamentals and hooks",
      timePosted: "2 hours ago"
    },
    {
      id: 2,
      skill: "Spanish Conversation",
      user: { name: "Carlos Rodriguez", avatar: "", initials: "CR" },
      level: "Intermediate",
      description: "Want to practice conversational Spanish",
      timePosted: "5 hours ago"
    },
    {
      id: 3,
      skill: "Digital Marketing",
      user: { name: "Emma Wilson", avatar: "", initials: "EW" },
      level: "Beginner",
      description: "Need help with social media marketing strategies",
      timePosted: "1 day ago"
    }
  ];

  // Mock data for skills to learn offers
  const skillsToLearn = [
    {
      id: 4,
      skill: "Python Programming",
      user: { name: "Alex Kumar", avatar: "", initials: "AK" },
      level: "Advanced",
      description: "Offering advanced Python and machine learning",
      timePosted: "1 hour ago",
      rating: 4.9
    },
    {
      id: 5,
      skill: "Guitar Lessons",
      user: { name: "Music Mike", avatar: "", initials: "MM" },
      level: "Expert",
      description: "Teaching acoustic and electric guitar for all levels",
      timePosted: "3 hours ago",
      rating: 4.8
    },
    {
      id: 6,
      skill: "Photography",
      user: { name: "Lisa Park", avatar: "", initials: "LP" },
      level: "Intermediate",
      description: "Portrait and landscape photography techniques",
      timePosted: "6 hours ago",
      rating: 4.7
    }
  ];

  const stats = [
    { label: "Active Connections", value: "12", icon: Users },
    { label: "Skills Taught", value: "8", icon: BookOpen },
    { label: "Hours Logged", value: "45", icon: Calendar },
    { label: "Average Rating", value: "4.8", icon: Star }
  ];

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
                  placeholder="Search skills or users..." 
                  className="pl-10"
                />
              </div>
              <Link to="/messages">
                <Button variant="ghost" size="icon">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, John!</h1>
          <p className="text-muted-foreground">Ready to share knowledge and learn something new today?</p>
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
            
            <div className="grid gap-4">
              {skillsToTeach.map((request) => (
                <Card key={request.id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback>{request.user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-foreground">{request.user.name}</h3>
                            <Badge variant="outline">{request.level}</Badge>
                          </div>
                          <p className="text-lg font-medium text-accent mb-1">{request.skill}</p>
                          <p className="text-muted-foreground mb-2">{request.description}</p>
                          <p className="text-sm text-muted-foreground">{request.timePosted}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button size="sm" className="btn-hero">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="learn" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Available skills to learn</h2>
              <Badge variant="secondary">{skillsToLearn.length} offers</Badge>
            </div>
            
            <div className="grid gap-4">
              {skillsToLearn.map((offer) => (
                <Card key={offer.id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={offer.user.avatar} />
                          <AvatarFallback>{offer.user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-foreground">{offer.user.name}</h3>
                            <Badge variant="outline">{offer.level}</Badge>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-muted-foreground ml-1">{offer.rating}</span>
                            </div>
                          </div>
                          <p className="text-lg font-medium text-accent mb-1">{offer.skill}</p>
                          <p className="text-muted-foreground mb-2">{offer.description}</p>
                          <p className="text-sm text-muted-foreground">{offer.timePosted}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button size="sm" className="btn-hero">
                          Connect
                        </Button>
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

export default Dashboard;