import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "./ImageUpload";
import { Utensils, Activity, Pill, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { updateAchievementsForUser } from "@/lib/achievements";

interface QuickLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickLogDialog = ({ open, onOpenChange }: QuickLogDialogProps) => {
  const [freeText, setFreeText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!freeText.trim() && imageUrls.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Please add some text or images",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to log entries",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.from("timeline_events").insert({
        user_id: user.id,
        event_type: "note",
        title: "Quick Log",
        description: freeText,
        attachment_urls: imageUrls,
        event_date: new Date().toISOString(),
      });

      if (error) throw error;

      // Update achievements after logging
      await updateAchievementsForUser(user.id);

      toast({
        title: "Entry logged!",
        description: "Your health data has been recorded.",
      });
      
      setFreeText("");
      setImageUrls([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error logging entry:', error);
      toast({
        title: "Error logging entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Log</DialogTitle>
          <DialogDescription>
            Add a health entry using natural language or structured forms
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="freetext" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="freetext">Free Text</TabsTrigger>
            <TabsTrigger value="meal">
              <Utensils className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="workout">
              <Activity className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="med">
              <Pill className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="symptom">
              <AlertCircle className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="freetext" className="space-y-4">
            <div>
              <Label>Describe what happened</Label>
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="e.g., Had a shake in the morning, felt shoulder pain after basketball, took medication at 8pm..."
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Write naturally—we'll parse and organize the information for you.
              </p>
            </div>

            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meal" className="space-y-4">
            <MealForm />
          </TabsContent>

          <TabsContent value="workout" className="space-y-4">
            <WorkoutForm />
          </TabsContent>

          <TabsContent value="med" className="space-y-4">
            <MedicationForm />
          </TabsContent>

          <TabsContent value="symptom" className="space-y-4">
            <SymptomForm />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary" disabled={loading || !freeText.trim()}>
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MealForm = () => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="meal-items">Food Items</Label>
      <Textarea
        id="meal-items"
        placeholder="e.g., Grilled chicken breast, quinoa, steamed broccoli"
        rows={3}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="meal-time">Time</Label>
        <Input id="meal-time" type="time" />
      </div>
      <div>
        <Label htmlFor="meal-type">Meal Type</Label>
        <Input id="meal-type" placeholder="Breakfast, Lunch..." />
      </div>
    </div>
  </div>
);

const WorkoutForm = () => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="workout-type">Activity Type</Label>
      <Input id="workout-type" placeholder="e.g., Basketball, Running, Yoga" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="workout-duration">Duration (minutes)</Label>
        <Input id="workout-duration" type="number" placeholder="45" />
      </div>
      <div>
        <Label htmlFor="workout-intensity">Intensity</Label>
        <Input id="workout-intensity" placeholder="Low, Moderate, High" />
      </div>
    </div>
  </div>
);

const MedicationForm = () => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="med-name">Medication Name</Label>
      <Input id="med-name" placeholder="e.g., Metformin" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="med-dose">Dose</Label>
        <Input id="med-dose" placeholder="e.g., 500mg" />
      </div>
      <div>
        <Label htmlFor="med-time">Time Taken</Label>
        <Input id="med-time" type="time" />
      </div>
    </div>
  </div>
);

const SymptomForm = () => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="symptom-name">Symptom</Label>
      <Input id="symptom-name" placeholder="e.g., Right shoulder pain" />
    </div>
    <div>
      <Label htmlFor="symptom-severity">Severity (1-10)</Label>
      <Input id="symptom-severity" type="number" min="1" max="10" placeholder="5" />
    </div>
    <div>
      <Label htmlFor="symptom-notes">Additional Notes</Label>
      <Textarea
        id="symptom-notes"
        placeholder="Context, triggers, or other relevant details..."
        rows={3}
      />
    </div>
  </div>
);
