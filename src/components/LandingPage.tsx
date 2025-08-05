import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, BookOpen, Star, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-skillswap.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">SkillSwap</div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="hover:bg-secondary">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="btn-hero">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-hero text-white">
                  Share Skills,
                  <br />
                  <span className="text-accent-foreground">Learn Together</span>
                </h1>
                <p className="text-lead text-white/90 max-w-lg">
                  Connect with like-minded learners and share your expertise. Build a community where knowledge flows freely and everyone grows together.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup">
                    <Button size="lg" className="btn-hero w-full sm:w-auto">
                      Start Learning Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="#features">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="People sharing skills and learning together"
                  className="rounded-2xl shadow-2xl hover-lift"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 subtle-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Why Choose SkillSwap?
            </h2>
            <p className="text-lead max-w-3xl mx-auto">
              Our platform makes skill sharing intuitive, engaging, and rewarding for everyone involved.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Connect & Collaborate",
                description: "Find learning partners who share your interests and goals."
              },
              {
                icon: BookOpen,
                title: "Learn Anything",
                description: "From coding to cooking, explore skills across all domains."
              },
              {
                icon: Star,
                title: "Quality Content",
                description: "Curated learning experiences from verified skill sharers."
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Protected environment with verified users and secure interactions."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover-lift border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lead">
              Join thousands of learners who are already sharing skills and growing together.
            </p>
            <Link to="/signup">
              <Button size="lg" className="btn-hero">
                Join SkillSwap Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-primary">SkillSwap</div>
              <p className="text-muted-foreground">
                Connecting learners and skill sharers worldwide.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-2">
                <Link to="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link to="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-2">
                <Link to="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link to="#contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-2">
                <Link to="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link to="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2024 SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;