import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const TOTAL_STEPS = 4;

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Form state (simplified for demo)
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

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      if (user) {
        await supabase.from("profiles").update({
          full_name: profile.name,
          age: parseInt(profile.age),
          sex: profile.sex,
          height: parseFloat(profile.height),
          weight: parseFloat(profile.weight),
          health_conditions: health.conditions ? health.conditions.split(",").map(c => c.trim()) : [],
          medications: health.medications ? health.medications.split(",").map(m => m.trim()) : [],
          allergies: health.allergies ? health.allergies.split(",").map(a => a.trim()) : [],
          goals: goals ? goals.split(",").map(g => g.trim()) : [],
        }).eq("id", user.id);
      }
      toast({
        title: "Welcome to Life Tracker!",
        description: "Your health journey starts now.",
      });
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          {step === 1 && <WelcomeStep />}
          {step === 2 && (
            <ProfileStep profile={profile} setProfile={setProfile} />
          )}
          {step === 3 && (
            <HealthStep health={health} setHealth={setHealth} />
          )}
          {step === 4 && (
            <GoalsStep goals={goals} setGoals={setGoals} />
          )}

          <CardContent className="pt-6 border-t">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="bg-gradient-primary">
                {step === TOTAL_STEPS ? (
                  <>
                    Complete <Check className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const WelcomeStep = () => (
  <CardHeader>
    <CardTitle className="text-3xl">Welcome to Lovable OS</CardTitle>
    <CardDescription className="text-base pt-4 leading-relaxed">
      Let's get to know you and set up your personal health timeline. This will take about 2 minutes.
      <br /><br />
      <strong className="text-foreground">Your data is private and secure.</strong> We'll never share your
      health information without your explicit consent.
    </CardDescription>
  </CardHeader>
);

const ProfileStep = ({ profile, setProfile }: any) => (
  <>
    <CardHeader>
      <CardTitle>Your Profile</CardTitle>
      <CardDescription>Tell us a bit about yourself</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="John Doe"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            placeholder="30"
          />
        </div>
        <div>
          <Label htmlFor="sex">Sex</Label>
          <Input
            id="sex"
            value={profile.sex}
            onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
            placeholder="Male/Female/Other"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            value={profile.height}
            onChange={(e) => setProfile({ ...profile, height: e.target.value })}
            placeholder="175"
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={profile.weight}
            onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
            placeholder="70"
          />
        </div>
      </div>
    </CardContent>
  </>
);

const HealthStep = ({ health, setHealth }: any) => (
  <>
    <CardHeader>
      <CardTitle>Health Baseline</CardTitle>
      <CardDescription>Help us understand your current health status</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="conditions">Existing Conditions</Label>
        <Textarea
          id="conditions"
          value={health.conditions}
          onChange={(e) => setHealth({ ...health, conditions: e.target.value })}
          placeholder="e.g., Diabetes, Hypertension, Asthma (leave blank if none)"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="medications">Current Medications</Label>
        <Textarea
          id="medications"
          value={health.medications}
          onChange={(e) => setHealth({ ...health, medications: e.target.value })}
          placeholder="e.g., Metformin 500mg twice daily (leave blank if none)"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="allergies">Allergies</Label>
        <Input
          id="allergies"
          value={health.allergies}
          onChange={(e) => setHealth({ ...health, allergies: e.target.value })}
          placeholder="e.g., Peanuts, Penicillin (leave blank if none)"
        />
      </div>
    </CardContent>
  </>
);

const GoalsStep = ({ goals, setGoals }: any) => (
  <>
    <CardHeader>
      <CardTitle>Your Health Goals</CardTitle>
      <CardDescription>What would you like to achieve?</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="goals">Primary Goals</Label>
        <Textarea
          id="goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="e.g., Lose 5kg, Improve sleep quality, Reduce shoulder pain, Better blood sugar control"
          rows={5}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Be specific! We'll use these goals to personalize your recommendations.
        </p>
      </div>
    </CardContent>
  </>
);

export default Onboarding;
