import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SkillPostService } from "@/lib/database";

interface SkillPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SkillPostModal: React.FC<SkillPostModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [learnForm, setLearnForm] = useState({
    skillName: "",
    description: "",
    level: "",
  });
  
  const [teachForm, setTeachForm] = useState({
    skillName: "",
    description: "",
    level: "",
  });

  const handleLearnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnForm.skillName || !learnForm.description || !learnForm.level) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post skills.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await SkillPostService.createSkillPost({
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhotoURL: user.photoURL || undefined,
        skillName: learnForm.skillName,
        description: learnForm.description,
        proficiencyLevel: learnForm.level as 'Beginner' | 'Intermediate' | 'Advanced',
        type: 'learn'
      });
      
      toast({
        title: "Skill Posted Successfully!",
        description: `Your request to learn "${learnForm.skillName}" has been posted.`,
      });
      
      setLearnForm({ skillName: "", description: "", level: "" });
      onOpenChange(false);
    } catch (error) {
      console.error('Error posting skill:', error);
      toast({
        title: "Error",
        description: "Failed to post skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTeachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachForm.skillName || !teachForm.description || !teachForm.level) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post skills.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await SkillPostService.createSkillPost({
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhotoURL: user.photoURL || undefined,
        skillName: teachForm.skillName,
        description: teachForm.description,
        proficiencyLevel: teachForm.level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
        type: 'teach'
      });
      
      toast({
        title: "Skill Posted Successfully!",
        description: `Your offer to teach "${teachForm.skillName}" has been posted.`,
      });
      
      setTeachForm({ skillName: "", description: "", level: "" });
      onOpenChange(false);
    } catch (error) {
      console.error('Error posting skill:', error);
      toast({
        title: "Error",
        description: "Failed to post skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Skill</DialogTitle>
          <DialogDescription>
            Share what you want to learn or what you can teach.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="learn" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="learn">Want to Learn</TabsTrigger>
            <TabsTrigger value="teach">Want to Teach</TabsTrigger>
          </TabsList>
          
          <TabsContent value="learn" className="space-y-4 mt-4">
            <form onSubmit={handleLearnSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="learn-skill">Skill Name</Label>
                <Input
                  id="learn-skill"
                  placeholder="e.g., JavaScript Programming"
                  value={learnForm.skillName}
                  onChange={(e) => setLearnForm({ ...learnForm, skillName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="learn-description">Description of Learning Goal</Label>
                <Textarea
                  id="learn-description"
                  placeholder="Describe what you want to achieve or specific areas you'd like to focus on..."
                  value={learnForm.description}
                  onChange={(e) => setLearnForm({ ...learnForm, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="learn-level">Desired Proficiency Level</Label>
                <Select value={learnForm.level} onValueChange={(value) => setLearnForm({ ...learnForm, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Post Learning Request</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="teach" className="space-y-4 mt-4">
            <form onSubmit={handleTeachSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teach-skill">Skill Name</Label>
                <Input
                  id="teach-skill"
                  placeholder="e.g., Digital Photography"
                  value={teachForm.skillName}
                  onChange={(e) => setTeachForm({ ...teachForm, skillName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teach-description">Description of Teaching Offer</Label>
                <Textarea
                  id="teach-description"
                  placeholder="Describe what you can teach and your approach..."
                  value={teachForm.description}
                  onChange={(e) => setTeachForm({ ...teachForm, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teach-level">Your Proficiency Level</Label>
                <Select value={teachForm.level} onValueChange={(value) => setTeachForm({ ...teachForm, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Post Teaching Offer</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SkillPostModal;