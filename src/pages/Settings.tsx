import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
    allergies: "",
  });

  const [goals, setGoals] = useState("");

  const handleSave = () => {
    // Save to localStorage for demo
    localStorage.setItem("userProfile", JSON.stringify({
      ...profile,
      health,
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

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                placeholder="e.g., Metformin 500mg, Lisinopril 10mg (comma separated)"
                value={health.medications}
                onChange={(e) => setHealth({ ...health, medications: e.target.value })}
                rows={3}
              />
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