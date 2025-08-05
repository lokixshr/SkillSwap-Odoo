import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProgressIndicator from "@/components/onboarding/ProgressIndicator";
import OnboardingStep from "@/components/onboarding/OnboardingStep";
import ProfilePhotoUpload from "@/components/onboarding/ProfilePhotoUpload";
import SkillsSelector from "@/components/onboarding/SkillsSelector";
import { User, Mail, MapPin, BookOpen, Share } from "lucide-react";

const STEP_LABELS = [
  "Personal Info",
  "Profile Photo", 
  "Contact Details",
  "Location",
  "Skills to Share",
  "Skills to Learn"
];

const SUGGESTED_SKILLS_TO_OFFER = [
  "Programming", "Design", "Writing", "Photography", "Cooking", "Music",
  "Languages", "Marketing", "Teaching", "Fitness", "Art", "Business"
];

const SUGGESTED_SKILLS_TO_LEARN = [
  "Web Development", "Data Science", "Public Speaking", "Guitar", 
  "Spanish", "Digital Marketing", "Drawing", "Yoga", "Finance", "Leadership"
];

interface OnboardingData {
  firstName: string;
  lastName: string;
  profilePhoto: File | null;
  email: string;
  phone: string;
  bio: string;
  location: string;
  skillsToOffer: string[];
  skillsToLearn: string[];
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    profilePhoto: null,
    email: "",
    phone: "",
    bio: "",
    location: "",
    skillsToOffer: [],
    skillsToLearn: []
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEP_LABELS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      console.log("Onboarding completed:", data);
      navigate("/dashboard"); // Navigate to dashboard or main app
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return data.firstName.trim() !== "" && data.lastName.trim() !== "";
      case 2:
        return true; // Profile photo is optional
      case 3:
        return data.email.trim() !== "";
      case 4:
        return true; // Location is optional
      case 5:
        return data.skillsToOffer.length > 0;
      case 6:
        return data.skillsToLearn.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingStep
            onNext={handleNext}
            canGoNext={canProceedFromStep(1)}
            canGoBack={false}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Welcome to SkillSwap!</h2>
                <p className="text-muted-foreground">Let's start by getting to know you better</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 2:
        return (
          <OnboardingStep
            onNext={handleNext}
            onBack={handleBack}
            showSkip={true}
            onSkip={handleSkip}
          >
            <ProfilePhotoUpload
              currentPhoto={data.profilePhoto}
              onPhotoChange={(photo) => updateData({ profilePhoto: photo })}
            />
          </OnboardingStep>
        );

      case 3:
        return (
          <OnboardingStep
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={canProceedFromStep(3)}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
                <p className="text-muted-foreground">How can other learners reach you?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={data.bio}
                    onChange={(e) => updateData({ bio: e.target.value })}
                    placeholder="Tell us a bit about yourself and what you're passionate about..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 4:
        return (
          <OnboardingStep
            onNext={handleNext}
            onBack={handleBack}
            showSkip={true}
            onSkip={handleSkip}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Where are you located?</h3>
                <p className="text-muted-foreground">This helps us connect you with nearby learners</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => updateData({ location: e.target.value })}
                  placeholder="City, State/Province, Country"
                />
              </div>
            </div>
          </OnboardingStep>
        );

      case 5:
        return (
          <OnboardingStep
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={canProceedFromStep(5)}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Share className="w-6 h-6 text-accent" />
                </div>
              </div>
              <SkillsSelector
                title="What skills can you share?"
                description="Add the skills and knowledge you'd love to teach others"
                placeholder="Type a skill and press Enter"
                selectedSkills={data.skillsToOffer}
                onSkillsChange={(skills) => updateData({ skillsToOffer: skills })}
                suggestedSkills={SUGGESTED_SKILLS_TO_OFFER}
              />
            </div>
          </OnboardingStep>
        );

      case 6:
        return (
          <OnboardingStep
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={canProceedFromStep(6)}
            isLastStep={true}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
              </div>
              <SkillsSelector
                title="What would you like to learn?"
                description="Add the skills you're excited to learn from others"
                placeholder="Type a skill and press Enter"
                selectedSkills={data.skillsToLearn}
                onSkillsChange={(skills) => updateData({ skillsToLearn: skills })}
                suggestedSkills={SUGGESTED_SKILLS_TO_LEARN}
              />
            </div>
          </OnboardingStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen subtle-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help us personalize your SkillSwap experience
          </p>
        </div>

        {/* Progress indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          stepLabels={STEP_LABELS}
        />

        {/* Current step */}
        <div className="animate-in fade-in-50 slide-in-from-right-4 duration-300">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;