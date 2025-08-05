import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface SkillsSelectorProps {
  title: string;
  description: string;
  placeholder: string;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  suggestedSkills?: string[];
}

const SkillsSelector = ({ 
  title, 
  description, 
  placeholder, 
  selectedSkills, 
  onSkillsChange,
  suggestedSkills = []
}: SkillsSelectorProps) => {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      onSkillsChange([...selectedSkills, trimmedSkill]);
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const availableSuggestions = suggestedSkills.filter(
    skill => !selectedSkills.includes(skill)
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Input for adding new skills */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button 
            onClick={() => addSkill(inputValue)}
            disabled={!inputValue.trim()}
            className="btn-hero"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Suggested skills */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Popular skills:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => addSkill(skill)}
              >
                {skill}
                <Plus className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Selected skills */}
      {selectedSkills.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Selected skills:</p>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <Badge
                key={skill}
                className="bg-accent text-accent-foreground hover:bg-accent-hover"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsSelector;