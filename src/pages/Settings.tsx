import { useState } from "react";
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

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: "Elias",
    age: "36",
    sex: "",
    height: "176",
    weight: "73",
  });

  const [health, setHealth] = useState({
    conditions: "",
    medications: "",
    supplements: "Vitamin D3 & K2 (NOW brand) - 1000 IU D3 + 45 mcg K2, 1 capsule daily, started 1 August 2025\nZinc Picolinate (NOW brand) - 50 mg, 1 capsule daily, started 1 August 2025\nFolic Acid - 5 mg, twice per week (Tuesday & Friday), started 1 August 2025\nCreatine (Vitobest Creapure) - 5 g, once daily, started 9 September 2025",
    allergies: "",
  });

  const [pastMedications, setPastMedications] = useState<Array<{
    name: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>>([
    {
      name: "Suprax (Antibiotic)",
      startDate: new Date(2025, 9, 6), // October 6, 2025
      endDate: new Date(2025, 9, 12), // 6 days later (October 12, 2025)
    }
  ]);

  const [pastInjuries, setPastInjuries] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([
    {
      name: "Right Hip labrum tear",
      date: new Date(2022, 9, 20), // October 20, 2022
    },
    {
      name: "Right shoulder discomfort",
      date: new Date(2025, 9, 19), // October 19, 2025
    },
    {
      name: "Right shoulder Labrum tear",
      date: new Date(2025, 9, 26), // October 26, 2025
    }
  ]);

  const [pastSurgeries, setPastSurgeries] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([
    {
      name: "Deviated Septum Surgery",
      date: new Date(2025, 2, 10), // March 10, 2025
    }
  ]);

  const [pastInflammations, setPastInflammations] = useState<Array<{
    name: string;
    date: Date | undefined;
  }>>([
    {
      name: "Diverticulitis - ER Visit",
      date: new Date(2025, 9, 6), // October 6, 2025
    }
  ]);


  const [goals, setGoals] = useState("Maintain mobility & flexibility\nMaintenance plus gaining muscle weight");

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


  const handleSave = () => {
    // Save to localStorage for demo
    localStorage.setItem("userProfile", JSON.stringify({
      ...profile,
      health,
      pastMedications,
      pastInjuries,
      pastSurgeries,
      pastInflammations,
      goals,
    }));

    toast({
      title: "Profile saved!",
      description: "Your health information has been updated.",
    });
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
                placeholder="John Doe"
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
                  placeholder="30"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={profile.sex} onValueChange={(value) => setProfile({ ...profile, sex: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
                  placeholder="175"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
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
                placeholder="e.g., Diabetes, Hypertension (comma separated)"
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
                  placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                  value={health.medications}
                  onChange={(e) => setHealth({ ...health, medications: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplements">Current Supplements</Label>
                <Textarea
                  id="supplements"
                  placeholder="e.g., Vitamin D 2000IU, Omega-3"
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
                placeholder="e.g., Penicillin, Peanuts (comma separated)"
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
                No past medications added. Click "Add" to record previous medications.
              </p>
            ) : (
              pastMedications.map((med, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Medication name and dosage"
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
                No past injuries added. Click "Add" to record previous injuries.
              </p>
            ) : (
              pastInjuries.map((injury, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Injury description (e.g., Right ankle sprain)"
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
                No past surgeries added. Click "Add" to record previous surgeries.
              </p>
            ) : (
              pastSurgeries.map((surgery, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Surgery description (e.g., Appendectomy)"
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
                No past inflammations added. Click "Add" to record previous inflammations.
              </p>
            ) : (
              pastInflammations.map((inflammation, index) => (
                <div key={index} className="flex gap-2 items-start border rounded-lg p-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Inflammation description (e.g., Tennis elbow)"
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
                placeholder="e.g., Lose 5kg, Run 5km, Lower blood pressure (comma separated)"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
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
  );
};

export default Settings;