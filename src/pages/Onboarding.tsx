import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import SkillsSelector from "@/components/onboarding/SkillsSelector";
import { User, Mail, MapPin, BookOpen, Share } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserService } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    skillsToOffer: [],
    skillsToLearn: []
  });

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user && userProfile) {
      // If user has a complete profile, redirect to dashboard
      if (userProfile.firstName && userProfile.lastName && userProfile.bio) {
        navigate("/dashboard");
      }
    }
  }, [user, userProfile, navigate]);

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const STEP_LABELS = [
    "Basic Information",
    "About You",
    "Skills to Offer",
    "Skills to Learn"
  ];

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < STEP_LABELS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      try {
        if (user) {
          // Update user profile with onboarding data
          await UserService.createOrUpdateUser(user, {
            firstName: data.firstName,
            lastName: data.lastName,
            bio: data.bio,
            location: data.location,
          });
          
          // Update user skills
          await UserService.updateUserSkills(
            user.uid,
            data.skillsToOffer,
            data.skillsToLearn
          );
          
          toast({
            title: "Profile completed!",
            description: "Your SkillSwap profile has been created successfully.",
          });
        }
        
        navigate("/dashboard");
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast({
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = (currentStep / STEP_LABELS.length) * 100;

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Welcome to SkillSwap!
            </CardTitle>
            <p className="text-muted-foreground">
              Let's set up your profile to get started
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep} of {STEP_LABELS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {STEP_LABELS[0]}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={data.firstName}
                      onChange={(e) => updateData("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={data.lastName}
                      onChange={(e) => updateData("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {STEP_LABELS[1]}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={data.location}
                      onChange={(e) => updateData("location", e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={data.bio}
                      onChange={(e) => updateData("bio", e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Share className="w-5 h-5" />
                  {STEP_LABELS[2]}
                </h3>
                <p className="text-muted-foreground">
                  Select the skills you'd like to teach to others
                </p>
                <SkillsSelector
                  selectedSkills={data.skillsToOffer}
                  onSkillsChange={(skills) => updateData("skillsToOffer", skills)}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {STEP_LABELS[3]}
                </h3>
                <p className="text-muted-foreground">
                  Select the skills you'd like to learn from others
                </p>
                <SkillsSelector
                  selectedSkills={data.skillsToLearn}
                  onSkillsChange={(skills) => updateData("skillsToLearn", skills)}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button onClick={handleNext}>
                {currentStep === STEP_LABELS.length ? "Complete Setup" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface OnboardingData {
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  skillsToOffer: string[];
  skillsToLearn: string[];
}

export default Onboarding;