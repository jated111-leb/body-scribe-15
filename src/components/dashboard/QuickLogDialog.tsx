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
import { 
  normalizeMealType, 
  normalizeWorkoutType, 
  normalizeSymptomType,
  CANONICAL_MEAL_TYPES,
  getMealTypeDisplay
} from "@/utils/normalization";

interface QuickLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickLogDialog = ({ open, onOpenChange }: QuickLogDialogProps) => {
  const [activeTab, setActiveTab] = useState("freetext");
  const [freeText, setFreeText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state for different entry types
  const [mealData, setMealData] = useState({ items: "", time: "", type: "" });
  const [workoutData, setWorkoutData] = useState({ type: "", duration: "", intensity: "" });
  const [medicationData, setMedicationData] = useState({ name: "", dose: "", time: "" });
  const [symptomData, setSymptomData] = useState({ name: "", severity: "", notes: "" });

  const handleSave = async () => {
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
      let eventData: any = {
        user_id: user.id,
        attachment_urls: imageUrls,
        event_date: new Date().toISOString(),
      };

      // Build entry based on active tab with normalized canonical types
      switch (activeTab) {
        case "freetext":
          eventData = {
            ...eventData,
            event_type: "note",
            title: "Quick Log",
            description: freeText,
          };
          break;
        case "meal":
          eventData = {
            ...eventData,
            event_type: "meal",
            title: "Meal Log",
            description: mealData.items,
            meal_type: normalizeMealType(mealData.type || 'snack'),
            structured_data: { time: mealData.time },
          };
          break;
        case "workout":
          eventData = {
            ...eventData,
            event_type: "workout",
            title: "Workout Log",
            activity_type: normalizeWorkoutType(workoutData.type || 'aerobic'),
            duration: workoutData.duration ? parseInt(workoutData.duration) : null,
            intensity: workoutData.intensity?.toLowerCase() || 'moderate',
          };
          break;
        case "med":
          eventData = {
            ...eventData,
            event_type: "medication",
            title: "Medication Log",
            medication_name: medicationData.name,
            dosage: medicationData.dose,
            structured_data: { time: medicationData.time },
          };
          break;
        case "symptom":
          const symptomType = normalizeSymptomType(symptomData.name || 'pain');
          eventData = {
            ...eventData,
            event_type: "symptom",
            title: symptomData.name || 'Symptom',
            severity: symptomData.severity || 'moderate',
            description: symptomData.notes,
            structured_data: { symptom_type: symptomType },
          };
          break;
      }

      const { error } = await supabase.from("timeline_events").insert(eventData);

      if (error) throw error;

      // Update achievements after logging
      await updateAchievementsForUser(user.id);

      toast({
        title: "Entry logged!",
        description: "Your health data has been recorded.",
      });
      
      // Reset all form states
      setFreeText("");
      setImageUrls([]);
      setMealData({ items: "", time: "", type: "" });
      setWorkoutData({ type: "", duration: "", intensity: "" });
      setMedicationData({ name: "", dose: "", time: "" });
      setSymptomData({ name: "", severity: "", notes: "" });
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

        <Tabs defaultValue="freetext" className="mt-4" onValueChange={setActiveTab}>
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
            <MealForm data={mealData} onChange={setMealData} />
            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workout" className="space-y-4">
            <WorkoutForm data={workoutData} onChange={setWorkoutData} />
            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="med" className="space-y-4">
            <MedicationForm data={medicationData} onChange={setMedicationData} />
            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="symptom" className="space-y-4">
            <SymptomForm data={symptomData} onChange={setSymptomData} />
            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MealForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="meal-items">Food Items</Label>
      <Textarea
        id="meal-items"
        placeholder="e.g., Grilled chicken breast, quinoa, steamed broccoli"
        rows={3}
        value={data.items}
        onChange={(e) => onChange({ ...data, items: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="meal-time">Time</Label>
        <Input 
          id="meal-time" 
          type="time" 
          value={data.time}
          onChange={(e) => onChange({ ...data, time: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="meal-type">Meal Type</Label>
        <select
          id="meal-type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={data.type}
          onChange={(e) => onChange({ ...data, type: e.target.value })}
        >
          <option value="">Select meal type...</option>
          {CANONICAL_MEAL_TYPES.map(type => (
            <option key={type} value={type}>
              {getMealTypeDisplay(type)}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

const WorkoutForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="workout-type">Activity Type</Label>
      <Input 
        id="workout-type" 
        placeholder="e.g., Basketball, Running, Yoga" 
        value={data.type}
        onChange={(e) => onChange({ ...data, type: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="workout-duration">Duration (minutes)</Label>
        <Input 
          id="workout-duration" 
          type="number" 
          placeholder="45" 
          value={data.duration}
          onChange={(e) => onChange({ ...data, duration: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="workout-intensity">Intensity</Label>
        <select
          id="workout-intensity"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={data.intensity}
          onChange={(e) => onChange({ ...data, intensity: e.target.value })}
        >
          <option value="">Select intensity...</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  </div>
);

const MedicationForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="med-name">Medication Name</Label>
      <Input 
        id="med-name" 
        placeholder="e.g., Metformin" 
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="med-dose">Dose</Label>
        <Input 
          id="med-dose" 
          placeholder="e.g., 500mg" 
          value={data.dose}
          onChange={(e) => onChange({ ...data, dose: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="med-time">Time Taken</Label>
        <Input 
          id="med-time" 
          type="time" 
          value={data.time}
          onChange={(e) => onChange({ ...data, time: e.target.value })}
        />
      </div>
    </div>
  </div>
);

const SymptomForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="symptom-name">Symptom</Label>
      <Input 
        id="symptom-name" 
        placeholder="e.g., Right shoulder pain" 
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="symptom-severity">Severity (1-10)</Label>
      <Input 
        id="symptom-severity" 
        type="number" 
        min="1" 
        max="10" 
        placeholder="5" 
        value={data.severity}
        onChange={(e) => onChange({ ...data, severity: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="symptom-notes">Additional Notes</Label>
      <Textarea
        id="symptom-notes"
        placeholder="Context, triggers, or other relevant details..."
        rows={3}
        value={data.notes}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
      />
    </div>
  </div>
);
