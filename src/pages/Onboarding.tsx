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
import { analytics } from "@/lib/analytics";

const TOTAL_STEPS = 4;
const STORAGE_KEY = 'onboarding_progress';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step,
      profile,
      health,
      goals,
    }));
  }, [step, profile, health, goals]);

  // Restore progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { step: savedStep, profile: savedProfile, health: savedHealth, goals: savedGoals } = JSON.parse(saved);
        if (savedStep) setStep(savedStep);
        if (savedProfile) setProfile(savedProfile);
        if (savedHealth) setHealth(savedHealth);
        if (savedGoals) setGoals(savedGoals);
      } catch (error) {
        console.error('Error restoring onboarding progress:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) navigate("/auth");
    
    // Check if already completed onboarding
    const checkOnboarding = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      
      if (profile?.onboarding_completed) {
        navigate("/dashboard", { replace: true });
      }
    };
    
    checkOnboarding();
  }, [user, navigate]);

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const validateProfileStep = () => {
    if (!profile.name?.trim()) {
      toast({ 
        title: "Name required", 
        description: "Please enter your name",
        variant: "destructive" 
      });
      return false;
    }
    
    const age = parseInt(profile.age);
    if (profile.age && (isNaN(age) || age < 0 || age > 150)) {
      toast({ 
        title: "Invalid age", 
        description: "Age must be between 0 and 150", 
        variant: "destructive" 
      });
      return false;
    }
    
    const height = parseFloat(profile.height);
    if (profile.height && (isNaN(height) || height < 50 || height > 300)) {
      toast({ 
        title: "Invalid height", 
        description: "Height must be between 50 and 300 cm", 
        variant: "destructive" 
      });
      return false;
    }
    
    const weight = parseFloat(profile.weight);
    if (profile.weight && (isNaN(weight) || weight < 20 || weight > 500)) {
      toast({ 
        title: "Invalid weight", 
        description: "Weight must be between 20 and 500 kg", 
        variant: "destructive" 
      });
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    // Validate profile step before proceeding
    if (step === 2 && !validateProfileStep()) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      if (user) {
      await supabase.from("profiles").update({
        full_name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        sex: profile.sex,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        health_conditions: health.conditions ? health.conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
        medications: health.medications ? health.medications.split(",").map(m => m.trim()).filter(Boolean) : [],
        allergies: health.allergies ? health.allergies.split(",").map(a => a.trim()).filter(Boolean) : [],
        goals: goals ? goals.split(",").map(g => g.trim()).filter(Boolean) : [],
        onboarding_completed: true,
      }).eq("id", user.id);
      
      // Track onboarding completion
      analytics.track('Onboarding Completed', {
        hasHealthConditions: !!health.conditions,
        hasMedications: !!health.medications,
        hasGoals: !!goals,
      });
      
      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);
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
