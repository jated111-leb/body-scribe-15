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
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { updateAchievementsEnhanced } from "@/lib/achievementsEnhanced";
import { calculateLifestyleAchievements } from "@/lib/lifestyleAchievements";
import {
  normalizeMealType, 
  normalizeWorkoutType, 
  normalizeSymptomType,
  CANONICAL_MEAL_TYPES,
  getMealTypeDisplay
} from "@/utils/normalization";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, isToday } from "date-fns";
import { EVENT_EMOJIS } from "@/lib/iconEmojis";

interface QuickLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MealFormData {
  items: string;
  time: string;
  type: string;
  sugarLevel: string;
}

interface WorkoutFormData {
  type: string;
  duration: string;
  intensity: string;
}

interface MedicationFormData {
  name: string;
  dose: string;
  time: string;
}

interface SymptomFormData {
  name: string;
  severity: string;
  notes: string;
}

interface MomentFormData {
  type: string;
}

interface DoctorVisitFormData {
  doctorName: string;
  reason: string;
  diagnosis: string;
  notes: string;
}

interface InjuryFormData {
  bodyPart: string;
  severity: string;
  cause: string;
  notes: string;
}

export const QuickLogDialog = ({ open, onOpenChange }: QuickLogDialogProps) => {
  const [activeTab, setActiveTab] = useState("freetext");
  const [freeText, setFreeText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state for different entry types with proper types
  const [mealData, setMealData] = useState<MealFormData>({ items: "", time: "", type: "", sugarLevel: "" });
  const [workoutData, setWorkoutData] = useState<WorkoutFormData>({ type: "", duration: "", intensity: "" });
  const [medicationData, setMedicationData] = useState<MedicationFormData>({ name: "", dose: "", time: "" });
  const [symptomData, setSymptomData] = useState<SymptomFormData>({ name: "", severity: "", notes: "" });
  const [momentData, setMomentData] = useState<MomentFormData>({ type: "" });
  const [doctorVisitData, setDoctorVisitData] = useState<DoctorVisitFormData>({ doctorName: "", reason: "", diagnosis: "", notes: "" });
  const [injuryData, setInjuryData] = useState<InjuryFormData>({ bodyPart: "", severity: "", cause: "", notes: "" });

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
        event_date: eventDate.toISOString(),
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
          const mealTypeDisplay = mealData.type ? getMealTypeDisplay(normalizeMealType(mealData.type)) : 'Meal';
          eventData = {
            ...eventData,
            event_type: "meal",
            title: mealTypeDisplay,
            description: mealData.items,
            meal_type: normalizeMealType(mealData.type || 'snack'),
            structured_data: { 
              time: mealData.time,
              sugar_level: mealData.sugarLevel || undefined,
            },
          };
          break;
        case "workout":
          const activityLabel = workoutData.type 
            ? workoutData.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : 'Workout';
          eventData = {
            ...eventData,
            event_type: "workout",
            title: activityLabel,
            activity_type: normalizeWorkoutType(workoutData.type || 'aerobic'),
            duration: workoutData.duration ? parseInt(workoutData.duration) : null,
            intensity: workoutData.intensity?.toLowerCase() || 'medium',
          };
          break;
        case "med":
          eventData = {
            ...eventData,
            event_type: "medication",
            title: medicationData.name || "Medication",
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
        case "moment":
          if (!momentData.type) {
            toast({
              title: "Select a moment type",
              description: "Please choose what you'd like to log.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          const momentTitles: Record<string, string> = {
            coffee: "☕ Coffee",
            tea: "🧋 Tea",
            energy_drink: "🧃 Energy Drink",
            caffeine_skip: "🚫 Skipped Caffeine",
            alcohol_free: "🍷🚫 Alcohol-free Day",
          };
          
          const momentInsights: Record<string, string> = {
            coffee: "Coffee moment logged — Aura will observe how this relates to your rhythm.",
            tea: "Tea logged — we'll watch how this choice affects your patterns.",
            energy_drink: "Energy drink noted — observing its role in your day.",
            caffeine_skip: "Caffeine skip logged — interesting to see how today unfolds.",
            alcohol_free: "Alcohol-free day noted — Aura will observe how this affects your sleep rhythm.",
          };
          
          eventData = {
            ...eventData,
            event_type: "moment",
            title: momentTitles[momentData.type] || "Moment",
            description: momentInsights[momentData.type],
            structured_data: { moment_type: momentData.type },
          };
          break;
        case "doctor_visit":
          eventData = {
            ...eventData,
            event_type: "doctor_visit",
            title: `Doctor Visit: ${doctorVisitData.doctorName || 'Appointment'}`,
            doctor_name: doctorVisitData.doctorName,
            diagnosis: doctorVisitData.diagnosis,
            description: doctorVisitData.notes,
            structured_data: { reason: doctorVisitData.reason },
          };
          break;
        case "injury":
          eventData = {
            ...eventData,
            event_type: "injury",
            title: `Injury: ${injuryData.bodyPart || 'Injury'}`,
            severity: injuryData.severity,
            description: `${injuryData.cause ? `Cause: ${injuryData.cause}. ` : ''}${injuryData.notes}`,
            structured_data: { body_part: injuryData.bodyPart },
          };
          break;
      }

      const { error } = await supabase.from("timeline_events").insert(eventData);

      if (error) throw error;

      // Show immediate success feedback
      toast({
        title: "Entry logged",
        description: "Your health rhythm continues to take shape.",
      });

      // Calculate achievements in background (don't block UI or fail the save)
      Promise.all([
        updateAchievementsEnhanced(user.id),
        calculateLifestyleAchievements(user.id)
      ]).then(([achievementResult, lifestyleAchievements]) => {
        const { newAchievements, progressUpdates } = achievementResult;
        
        console.log('📊 Achievement calculation complete:', { 
          newAchievements: newAchievements.length, 
          progressUpdates: progressUpdates.length,
          lifestyleAchievements: lifestyleAchievements.length 
        });

        // Show smart notification based on priority (only if we got results)
        if (lifestyleAchievements.length > 0) {
          const lifestyle = lifestyleAchievements[0];
          toast({
            title: lifestyle.title,
            description: lifestyle.insight_text,
          });
        } else if (newAchievements.length > 0) {
          const achievement = newAchievements[0];
          toast({
            title: "🌱 New Pattern Detected",
            description: achievement.insight_text,
          });
        } else if (progressUpdates.length > 0) {
          const progress = progressUpdates[0];
          toast({
            title: "💫 Almost There",
            description: progress.progress_message,
          });
        }
      }).catch((achievementError) => {
        console.error('Achievement calculation failed (non-blocking):', achievementError);
        // Don't show error to user - the save was successful
      });
      
      // Reset all form states immediately
      setFreeText("");
      setImageUrls([]);
      setEventDate(new Date());
      setShowDatePicker(false);
      setMealData({ items: "", time: "", type: "", sugarLevel: "" });
      setWorkoutData({ type: "", duration: "", intensity: "" });
      setMedicationData({ name: "", dose: "", time: "" });
      setSymptomData({ name: "", severity: "", notes: "" });
      setMomentData({ type: "" });
      setDoctorVisitData({ doctorName: "", reason: "", diagnosis: "", notes: "" });
      setInjuryData({ bodyPart: "", severity: "", cause: "", notes: "" });
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

        {/* Date/Time Picker - Shared across all tabs */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium whitespace-nowrap">When:</Label>
          <div className="flex gap-2 flex-wrap">
            <Button 
              type="button"
              variant={isToday(eventDate) ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setEventDate(new Date());
                setShowDatePicker(false);
              }}
            >
              Now
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => {
                setEventDate(subDays(new Date(), 1));
                setShowDatePicker(false);
              }}
            >
              Yesterday
            </Button>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(eventDate, 'MMM d, yyyy h:mm a')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <Calendar 
                    mode="single"
                    selected={eventDate} 
                    onSelect={(date) => date && setEventDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input 
                      type="time" 
                      value={format(eventDate, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(eventDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setEventDate(newDate);
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs defaultValue="freetext" className="mt-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="freetext" title="Free Text">
              <span className="text-lg">{EVENT_EMOJIS.note}</span>
            </TabsTrigger>
            <TabsTrigger value="moment" title="Moments">
              <span className="text-lg">{EVENT_EMOJIS.moment}</span>
            </TabsTrigger>
            <TabsTrigger value="meal" title="Meals">
              <span className="text-lg">{EVENT_EMOJIS.meal}</span>
            </TabsTrigger>
            <TabsTrigger value="workout" title="Workouts">
              <span className="text-lg">{EVENT_EMOJIS.workout}</span>
            </TabsTrigger>
            <TabsTrigger value="med" title="Medications">
              <span className="text-lg">{EVENT_EMOJIS.medication}</span>
            </TabsTrigger>
            <TabsTrigger value="symptom" title="Symptoms">
              <span className="text-lg">{EVENT_EMOJIS.symptom}</span>
            </TabsTrigger>
            <TabsTrigger value="doctor_visit" title="Doctor Visits">
              <span className="text-lg">{EVENT_EMOJIS.doctor_visit}</span>
            </TabsTrigger>
            <TabsTrigger value="injury" title="Injuries">
              <span className="text-lg">{EVENT_EMOJIS.injury}</span>
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

          <TabsContent value="moment" className="space-y-4">
            <MomentForm data={momentData} onChange={setMomentData} />
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

          <TabsContent value="doctor_visit" className="space-y-4">
            <DoctorVisitForm data={doctorVisitData} onChange={setDoctorVisitData} />
            <div>
              <Label>Add Images (Optional)</Label>
              <div className="mt-2">
                <ImageUpload onImagesChange={setImageUrls} maxImages={5} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="injury" className="space-y-4">
            <InjuryForm data={injuryData} onChange={setInjuryData} />
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

const MomentForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label>Moment Type</Label>
      <p className="text-xs text-muted-foreground mb-3">
        Quick micro-logs that help Aura observe your rhythm
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { value: "coffee", label: "☕ Coffee", desc: "Regular coffee moment" },
          { value: "tea", label: "🧋 Tea", desc: "Tea instead of coffee" },
          { value: "energy_drink", label: "🧃 Energy Drink", desc: "Energy drink consumed" },
          { value: "caffeine_skip", label: "🚫 Skipped Caffeine", desc: "Intentionally caffeine-free today" },
          { value: "alcohol_free", label: "🍷🚫 Alcohol-free Day", desc: "Choosing no alcohol today" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ ...data, type: option.value })}
            className={`p-3 text-left rounded-lg border-2 transition-all ${
              data.type === option.value
                ? "border-[#6CB792] bg-[#6CB792]/5"
                : "border-border hover:border-[#6CB792]/50"
            }`}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{option.desc}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 italic">
        These small choices help Aura understand your patterns without heavy tracking.
      </p>
    </div>
  </div>
);

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
    <div>
      <Label htmlFor="sugar-level">Sugar Level (Optional)</Label>
      <select
        id="sugar-level"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={data.sugarLevel}
        onChange={(e) => onChange({ ...data, sugarLevel: e.target.value })}
      >
        <option value="">Not specified</option>
        <option value="low">Low Sugar</option>
        <option value="medium">Medium Sugar</option>
        <option value="high">High Sugar</option>
      </select>
      <p className="text-xs text-muted-foreground mt-1.5">
        Your perception — helps Aura understand how meals influence your rhythm
      </p>
    </div>
  </div>
);

const WorkoutForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="workout-type">Activity Type</Label>
      <select
        id="workout-type"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={data.type}
        onChange={(e) => onChange({ ...data, type: e.target.value })}
      >
        <option value="">Select activity...</option>
        
        <optgroup label="Walking & Running">
          <option value="walking">Walking</option>
          <option value="running">Running</option>
          <option value="hiking">Hiking</option>
        </optgroup>
        
        <optgroup label="Cardio">
          <option value="cycling">Cycling</option>
          <option value="swimming">Swimming</option>
          <option value="dancing">Dance</option>
          <option value="rowing">Rowing</option>
        </optgroup>
        
        <optgroup label="Strength">
          <option value="strength_training">Strength Training</option>
          <option value="functional_strength">Functional Strength</option>
          <option value="core_training">Core Training</option>
          <option value="weight_lifting">Weight Lifting</option>
        </optgroup>
        
        <optgroup label="HIIT & Intervals">
          <option value="hiit">HIIT</option>
          <option value="intervals">Interval Training</option>
        </optgroup>
        
        <optgroup label="Mobility & Flexibility">
          <option value="yoga">Yoga</option>
          <option value="pilates">Pilates</option>
          <option value="stretching">Stretching</option>
          <option value="tai_chi">Tai Chi</option>
        </optgroup>
        
        <optgroup label="Sports">
          <option value="basketball">Basketball</option>
          <option value="soccer">Soccer</option>
          <option value="football">Football</option>
          <option value="tennis">Tennis</option>
          <option value="volleyball">Volleyball</option>
          <option value="baseball">Baseball</option>
          <option value="golf">Golf</option>
          <option value="boxing">Boxing</option>
          <option value="martial_arts">Martial Arts</option>
        </optgroup>
      </select>
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
          <option value="medium">Medium</option>
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
      <Label htmlFor="symptom-severity">Severity</Label>
      <select
        id="symptom-severity"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={data.severity}
        onChange={(e) => onChange({ ...data, severity: e.target.value })}
      >
        <option value="">Select severity...</option>
        <option value="mild">Mild</option>
        <option value="moderate">Moderate</option>
        <option value="severe">Severe</option>
      </select>
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

const DoctorVisitForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="doctor-name">Doctor's Name</Label>
      <Input 
        id="doctor-name" 
        placeholder="e.g., Dr. Smith" 
        value={data.doctorName}
        onChange={(e) => onChange({ ...data, doctorName: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="visit-reason">Reason for Visit</Label>
      <Input 
        id="visit-reason" 
        placeholder="e.g., Annual checkup, follow-up" 
        value={data.reason}
        onChange={(e) => onChange({ ...data, reason: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="diagnosis">Diagnosis/Findings</Label>
      <Textarea
        id="diagnosis"
        placeholder="What did the doctor say?"
        rows={2}
        value={data.diagnosis}
        onChange={(e) => onChange({ ...data, diagnosis: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="doctor-notes">Additional Notes</Label>
      <Textarea
        id="doctor-notes"
        placeholder="Prescriptions, recommendations, next steps..."
        rows={3}
        value={data.notes}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
      />
    </div>
  </div>
);

const InjuryForm = ({ data, onChange }: { data: any; onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="body-part">Body Part Affected</Label>
      <Input 
        id="body-part" 
        placeholder="e.g., Right ankle, left wrist" 
        value={data.bodyPart}
        onChange={(e) => onChange({ ...data, bodyPart: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="injury-severity">Severity</Label>
      <select
        id="injury-severity"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={data.severity}
        onChange={(e) => onChange({ ...data, severity: e.target.value })}
      >
        <option value="">Select severity...</option>
        <option value="minor">Minor</option>
        <option value="moderate">Moderate</option>
        <option value="severe">Severe</option>
      </select>
    </div>
    <div>
      <Label htmlFor="injury-cause">How did it happen?</Label>
      <Input 
        id="injury-cause" 
        placeholder="e.g., Playing basketball, fell down stairs" 
        value={data.cause}
        onChange={(e) => onChange({ ...data, cause: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="injury-notes">Additional Notes</Label>
      <Textarea
        id="injury-notes"
        placeholder="Treatment received, pain level, mobility impact..."
        rows={3}
        value={data.notes}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
      />
    </div>
  </div>
);
