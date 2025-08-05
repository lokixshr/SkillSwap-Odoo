import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingStepProps {
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  canGoNext?: boolean;
  canGoBack?: boolean;
  showSkip?: boolean;
  isLastStep?: boolean;
}

const OnboardingStep = ({
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = "Continue",
  backLabel = "Back",
  canGoNext = true,
  canGoBack = true,
  showSkip = false,
  isLastStep = false
}: OnboardingStepProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl border-border/50 bg-card/80 backdrop-blur-sm hover-lift">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Step content */}
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              {children}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-3">
                {onBack && (
                  <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={!canGoBack}
                    className="hover:bg-secondary"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backLabel}
                  </Button>
                )}
                
                {showSkip && onSkip && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                )}
              </div>

              {onNext && (
                <Button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="btn-hero"
                >
                  {isLastStep ? "Complete Setup" : nextLabel}
                  {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingStep;