import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    sex: "",
    height: "",
    weight: "",
  });

  const [health, setHealth] = useState({
    conditions: "",
    medications: "",
    supplements: "",
    allergies: "",
  });

  const [pastMedications, setPastMedications] = useState<Array<{
    name: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>>([]);

  const [pastInjuries, setPastInjuries] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([]);

  const [pastSurgeries, setPastSurgeries] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([]);

  const [pastInflammations, setPastInflammations] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([]);

  const [workoutActivities, setWorkoutActivities] = useState<Array<{
    activityType: string;
    date: Date | undefined;
    duration: string;
    location: string;
  }>>([]);

  const [goals, setGoals] = useState("");

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      if (!user) {
        // Load from localStorage for guest
        const stored = localStorage.getItem('guestProfile');
        if (stored) {
          const data = JSON.parse(stored);
          setProfile({
            name: data.profile?.name || "",
            age: data.profile?.age || "",
            sex: data.profile?.sex || "",
            height: data.profile?.height || "",
            weight: data.profile?.weight || "",
          });
          setHealth({
            conditions: data.health?.conditions || "",
            medications: data.health?.medications || "",
            supplements: data.health?.supplements || "",
            allergies: data.health?.allergies || "",
          });
          setGoals(data.goals || "");
          setPastMedications(data.pastMedications?.map((m: any) => ({
            name: m.name,
            startDate: m.startDate ? new Date(m.startDate) : undefined,
            endDate: m.endDate ? new Date(m.endDate) : undefined,
          })) || []);
          setPastInjuries(data.pastInjuries?.map((i: any) => ({
            name: i.name,
            date: i.date ? new Date(i.date) : undefined,
          })) || []);
          setPastSurgeries(data.pastSurgeries?.map((s: any) => ({
            name: s.name,
            date: s.date ? new Date(s.date) : undefined,
          })) || []);
          setPastInflammations(data.pastInflammations?.map((inf: any) => ({
            name: inf.name,
            date: inf.date ? new Date(inf.date) : undefined,
          })) || []);
          setWorkoutActivities(data.workoutActivities?.map((w: any) => ({
            activityType: w.activityType,
            date: w.date ? new Date(w.date) : undefined,
            duration: w.duration,
            location: w.location,
          })) || []);
        }
      } else {
        // Load from database for authenticated user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        if (profileData) {
          setProfile({
            name: profileData.full_name || "",
            age: profileData.age?.toString() || "",
            sex: profileData.sex || "",
            height: profileData.height?.toString() || "",
            weight: profileData.weight?.toString() || "",
          });
    setHealth({
      conditions: profileData.health_conditions?.join(', ') || "",
      medications: profileData.medications?.join('\n') || "",
      supplements: "",
      allergies: profileData.allergies?.join(', ') || "",
    });
          setGoals(profileData.goals?.join('\n') || "");
        }

        // Load timeline events
        const { data: eventsData, error: eventsError } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('user_id', user.id)
          .in('event_type', ['medication', 'injury', 'surgery', 'illness', 'workout'])
          .order('event_date', { ascending: false });

        if (eventsError) throw eventsError;

        if (eventsData) {
          const medications = eventsData
            .filter(e => e.event_type === 'medication')
            .map(e => ({
              name: e.title,
              startDate: e.prescription_start ? new Date(e.prescription_start) : undefined,
              endDate: e.prescription_end ? new Date(e.prescription_end) : undefined,
            }));

          const injuries = eventsData
            .filter(e => e.event_type === 'injury')
            .map(e => ({
              name: e.title,
              date: new Date(e.event_date),
            }));

          const surgeries = eventsData
            .filter(e => e.event_type === 'surgery')
            .map(e => ({
              name: e.title,
              date: new Date(e.event_date),
            }));

          const inflammations = eventsData
            .filter(e => e.event_type === 'illness')
            .map(e => ({
              name: e.title,
              date: new Date(e.event_date),
            }));

          const workouts = eventsData
            .filter(e => e.event_type === 'workout')
            .map(e => ({
              activityType: e.activity_type || e.title,
              date: new Date(e.event_date),
              duration: e.duration ? `${Math.round(e.duration / 60)}h` : "",
              location: e.description || "",
            }));

          setPastMedications(medications);
          setPastInjuries(injuries);
          setPastSurgeries(surgeries);
          setPastInflammations(inflammations);
          setWorkoutActivities(workouts);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPastMedication = () => {
    setPastMedications([...pastMedications, { name: "", startDate: undefined, endDate: undefined }]);
  };

  const removePastMedication = (index: number) => {
    setPastMedications(pastMedications.filter((_, i) => i !== index));
  };

  const updatePastMedication = (index: number, field: string, value: any) => {
    const updated = [...pastMedications];
    updated[index] = { ...updated[index], [field]: value };
    setPastMedications(updated);
  };

  const addPastInjury = () => {
    setPastInjuries([...pastInjuries, { name: "", date: undefined }]);
  };

  const removePastInjury = (index: number) => {
    setPastInjuries(pastInjuries.filter((_, i) => i !== index));
  };

  const updatePastInjury = (index: number, field: string, value: any) => {
    const updated = [...pastInjuries];
    updated[index] = { ...updated[index], [field]: value };
    setPastInjuries(updated);
  };

  const addPastSurgery = () => {
    setPastSurgeries([...pastSurgeries, { name: "", date: undefined }]);
  };

  const removePastSurgery = (index: number) => {
    setPastSurgeries(pastSurgeries.filter((_, i) => i !== index));
  };

  const updatePastSurgery = (index: number, field: string, value: any) => {
    const updated = [...pastSurgeries];
    updated[index] = { ...updated[index], [field]: value };
    setPastSurgeries(updated);
  };

  const addPastInflammation = () => {
    setPastInflammations([...pastInflammations, { name: "", date: undefined }]);
  };

  const removePastInflammation = (index: number) => {
    setPastInflammations(pastInflammations.filter((_, i) => i !== index));
  };

  const updatePastInflammation = (index: number, field: string, value: any) => {
    const updated = [...pastInflammations];
    updated[index] = { ...updated[index], [field]: value };
    setPastInflammations(updated);
  };

  const addWorkoutActivity = () => {
    setWorkoutActivities([...workoutActivities, { activityType: "", date: undefined, duration: "", location: "" }]);
  };

  const removeWorkoutActivity = (index: number) => {
    setWorkoutActivities(workoutActivities.filter((_, i) => i !== index));
  };

  const updateWorkoutActivity = (index: number, field: string, value: any) => {
    const updated = [...workoutActivities];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutActivities(updated);
  };


  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate BMR (Mifflin-St Jeor equation)
      let bmr = null;
      if (profile.weight && profile.height && profile.age && profile.sex) {
        const weight = parseFloat(profile.weight);
        const height = parseFloat(profile.height);
        const age = parseInt(profile.age);
        
        if (profile.sex === "male") {
          bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else if (profile.sex === "female") {
          bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
      }

      if (!user) {
        // Guest mode: save to localStorage
        const guestData = {
          profile,
          health,
          goals,
          pastMedications: pastMedications.map(m => ({
            name: m.name,
            startDate: m.startDate?.toISOString(),
            endDate: m.endDate?.toISOString(),
          })),
          pastInjuries: pastInjuries.map(i => ({
            name: i.name,
            date: i.date?.toISOString(),
          })),
          pastSurgeries: pastSurgeries.map(s => ({
            name: s.name,
            date: s.date?.toISOString(),
          })),
          pastInflammations: pastInflammations.map(inf => ({
            name: inf.name,
            date: inf.date?.toISOString(),
          })),
          workoutActivities: workoutActivities.map(w => ({
            activityType: w.activityType,
            date: w.date?.toISOString(),
            duration: w.duration,
            location: w.location,
          })),
          bmr,
        };
        
        localStorage.setItem('guestProfile', JSON.stringify(guestData));
        
        toast({
          title: "Profile saved!",
          description: "Your health information has been saved locally. Sign up to sync across devices.",
        });
        return;
      }

      // Authenticated mode: save to database
      const profileData = {
        id: user.id,
        full_name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        sex: profile.sex || null,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        bmr: bmr,
        health_conditions: health.conditions ? health.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        medications: health.medications ? health.medications.split('\n').map(s => s.trim()).filter(Boolean) : [],
        allergies: health.allergies ? health.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        goals: goals ? goals.split('\n').map(s => s.trim()).filter(Boolean) : [],
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Create timeline events for medical history
      const timelineEvents = [];

      for (const med of pastMedications) {
        if (med.name && med.startDate) {
          timelineEvents.push({
            user_id: user.id,
            event_type: 'medication',
            title: med.name,
            event_date: med.startDate.toISOString(),
            medication_name: med.name,
            prescription_start: med.startDate.toISOString().split('T')[0],
            prescription_end: med.endDate ? med.endDate.toISOString().split('T')[0] : null,
            source: 'settings',
          });
        }
      }

      for (const injury of pastInjuries) {
        if (injury.name && injury.date) {
          timelineEvents.push({
            user_id: user.id,
            event_type: 'injury',
            title: injury.name,
            event_date: injury.date.toISOString(),
            description: injury.name,
            source: 'settings',
          });
        }
      }

      for (const surgery of pastSurgeries) {
        if (surgery.name && surgery.date) {
          timelineEvents.push({
            user_id: user.id,
            event_type: 'surgery',
            title: surgery.name,
            event_date: surgery.date.toISOString(),
            description: surgery.name,
            source: 'settings',
          });
        }
      }

      for (const inflammation of pastInflammations) {
        if (inflammation.name && inflammation.date) {
          timelineEvents.push({
            user_id: user.id,
            event_type: 'illness',
            title: inflammation.name,
            event_date: inflammation.date.toISOString(),
            description: inflammation.name,
            severity: 'high',
            source: 'settings',
          });
        }
      }

      for (const workout of workoutActivities) {
        if (workout.activityType && workout.date) {
          timelineEvents.push({
            user_id: user.id,
            event_type: 'workout',
            title: workout.activityType,
            event_date: workout.date.toISOString(),
            activity_type: workout.activityType,
            duration: workout.duration ? parseInt(workout.duration.replace(/[^\d]/g, '')) * 60 : null,
            description: workout.location,
            source: 'settings',
          });
        }
      }

      // Only delete settings-managed events, not manual entries
      await supabase
        .from('timeline_events')
        .delete()
        .eq('user_id', user.id)
        .eq('source', 'settings')
        .in('event_type', ['medication', 'injury', 'surgery', 'illness', 'workout']);

      if (timelineEvents.length > 0) {
        const { error: eventsError } = await supabase
          .from('timeline_events')
          .insert(timelineEvents);

        if (eventsError) throw eventsError;
      }

      toast({
        title: "Profile saved!",
        description: "Your health information and timeline have been updated.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Update your health information</p>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={profile.sex} onValueChange={(value) => setProfile({ ...profile, sex: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Enter height in cm"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter weight in kg"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Information */}
        <Card>
          <CardHeader>
            <CardTitle>Health Information</CardTitle>
            <CardDescription>Medical history and conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Existing Health Conditions</Label>
              <Textarea
                id="conditions"
                placeholder="Add any existing health conditions (comma separated)"
                value={health.conditions}
                onChange={(e) => setHealth({ ...health, conditions: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  placeholder="Add current medications"
                  value={health.medications}
                  onChange={(e) => setHealth({ ...health, medications: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplements">Current Supplements</Label>
                <Textarea
                  id="supplements"
                  placeholder="Add current supplements (one per line)"
                  value={health.supplements}
                  onChange={(e) => setHealth({ ...health, supplements: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="Add any allergies (comma separated)"
                value={health.allergies}
                onChange={(e) => setHealth({ ...health, allergies: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Past Medications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past Medications</CardTitle>
                <CardDescription>Track previous medications with dates</CardDescription>
              </div>
              <Button onClick={addPastMedication} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastMedications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No past medications yet. Click "Add" to record previous medications.
              </p>
            ) : (
              pastMedications.map((med, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Enter medication name and dosage"
                      value={med.name}
                      onChange={(e) => updatePastMedication(index, "name", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !med.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {med.startDate ? format(med.startDate, "PP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                            <Calendar
                              mode="single"
                              selected={med.startDate}
                              onSelect={(date) => updatePastMedication(index, "startDate", date)}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !med.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {med.endDate ? format(med.endDate, "PP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                            <Calendar
                              mode="single"
                              selected={med.endDate}
                              onSelect={(date) => updatePastMedication(index, "endDate", date)}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePastMedication(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Injuries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past Injuries</CardTitle>
                <CardDescription>Record previous injuries and their dates</CardDescription>
              </div>
              <Button onClick={addPastInjury} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastInjuries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No past injuries yet. Click "Add" to record previous injuries.
              </p>
            ) : (
              pastInjuries.map((injury, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Enter injury description"
                      value={injury.name}
                      onChange={(e) => updatePastInjury(index, "name", e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">Injury Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !injury.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {injury.date ? format(injury.date, "PP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={injury.date}
                            onSelect={(date) => updatePastInjury(index, "date", date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePastInjury(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Surgeries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past Surgeries</CardTitle>
                <CardDescription>Record surgical procedures and their dates</CardDescription>
              </div>
              <Button onClick={addPastSurgery} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastSurgeries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No past surgeries yet. Click "Add" to record previous surgeries.
              </p>
            ) : (
              pastSurgeries.map((surgery, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Enter surgery description"
                      value={surgery.name}
                      onChange={(e) => updatePastSurgery(index, "name", e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">Surgery Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !surgery.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {surgery.date ? format(surgery.date, "PP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={surgery.date}
                            onSelect={(date) => updatePastSurgery(index, "date", date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePastSurgery(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Inflammations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past Inflammations</CardTitle>
                <CardDescription>Track inflammatory conditions and their dates</CardDescription>
              </div>
              <Button onClick={addPastInflammation} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastInflammations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No past inflammations yet. Click "Add" to record previous inflammations.
              </p>
            ) : (
              pastInflammations.map((inflammation, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Enter inflammation description"
                      value={inflammation.name}
                      onChange={(e) => updatePastInflammation(index, "name", e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">Date Diagnosed</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !inflammation.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {inflammation.date ? format(inflammation.date, "PP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={inflammation.date}
                            onSelect={(date) => updatePastInflammation(index, "date", date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePastInflammation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Workout Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workout Profile</CardTitle>
                <CardDescription>Track your training and physical activities</CardDescription>
              </div>
              <Button onClick={addWorkoutActivity} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workoutActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workout activities yet. Click "Add" to record training sessions.
              </p>
            ) : (
              workoutActivities.map((workout, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Enter activity type"
                        value={workout.activityType}
                        onChange={(e) => updateWorkoutActivity(index, "activityType", e.target.value)}
                      />
                      <Input
                        placeholder="Enter duration"
                        value={workout.duration}
                        onChange={(e) => updateWorkoutActivity(index, "duration", e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Enter location or coach name"
                      value={workout.location}
                      onChange={(e) => updateWorkoutActivity(index, "location", e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">Workout Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !workout.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {workout.date ? format(workout.date, "PP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={workout.date}
                            onSelect={(date) => updateWorkoutActivity(index, "date", date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWorkoutActivity(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Health Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Health Goals</CardTitle>
            <CardDescription>What are you working towards?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="goals">Your Goals</Label>
              <Textarea
                id="goals"
                placeholder="Add your health and fitness goals (one per line)"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-between items-center">
          <Button 
            variant="destructive" 
            onClick={async () => {
              await signOut();
              toast({ title: "Signed out successfully" });
              navigate("/");
            }}
          >
            Sign Out
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;