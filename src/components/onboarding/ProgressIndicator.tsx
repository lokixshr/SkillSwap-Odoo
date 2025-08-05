import { CheckCircle2, Circle } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const ProgressIndicator = ({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 w-full h-0.5 bg-muted">
          <div 
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          
          return (
            <div key={index} className="flex flex-col items-center relative z-10">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-out
                ${isCompleted 
                  ? 'bg-accent text-accent-foreground shadow-lg' 
                  : isCurrent 
                    ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-accent/20' 
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Circle className={`w-6 h-6 ${isCurrent ? 'fill-current' : ''}`} />
                )}
              </div>
              <span className={`
                mt-2 text-sm font-medium transition-colors duration-300
                ${isCurrent ? 'text-primary' : isCompleted ? 'text-accent' : 'text-muted-foreground'}
              `}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;