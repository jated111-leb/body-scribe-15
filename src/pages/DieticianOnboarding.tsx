import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, Users, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const TOTAL_STEPS = 4;

const SPECIALTIES = [
  "Weight Management",
  "Sports Nutrition",
  "Clinical Nutrition",
  "Pediatric Nutrition",
  "Geriatric Nutrition",
  "Diabetes Management",
  "Cardiovascular Health",
  "Digestive Health",
  "Plant-Based Nutrition",
  "General Wellness"
];

const DieticianOnboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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
        navigate("/dietician-dashboard", { replace: true });
      }
    };
    
    checkOnboarding();
  }, [user, navigate]);

  const [profile, setProfile] = useState({
    name: "",
    practice_name: "",
    years_experience: "",
    bio: "",
    specialties: [] as string[],
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [skipInvite, setSkipInvite] = useState(false);

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const toggleSpecialty = (specialty: string) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const validatePracticeSetup = () => {
    if (!profile.name?.trim()) {
      toast({ 
        title: "Name required", 
        description: "Please enter your name",
        variant: "destructive" 
      });
      return false;
    }
    
    if (!profile.practice_name?.trim()) {
      toast({ 
        title: "Practice name required", 
        description: "Please enter your practice or business name",
        variant: "destructive" 
      });
      return false;
    }
    
    if (profile.specialties.length === 0) {
      toast({ 
        title: "Select at least one specialty", 
        description: "Choose areas you specialize in",
        variant: "destructive" 
      });
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    if (step === 2 && !validatePracticeSetup()) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      if (user) {
        // Update profiles table
        await supabase.from("profiles").update({
          full_name: profile.name,
          onboarding_completed: true,
        }).eq("id", user.id);

        // Create dietician profile
        await supabase.from("dietician_profiles").insert({
          user_id: user.id,
          practice_name: profile.practice_name,
          specialty_areas: profile.specialties,
          years_experience: profile.years_experience ? parseInt(profile.years_experience) : null,
          bio: profile.bio,
        });

        // Send invitation if provided
        if (inviteEmail && !skipInvite) {
          await supabase.functions.invoke("send-client-invitation", {
            body: { clientEmail: inviteEmail }
          });
        }
      }
      
      toast({
        title: "Welcome to your practice dashboard!",
        description: "You're all set to start managing clients.",
      });
      navigate("/dietician-dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="shadow-lg">
          {step === 1 && <WelcomeStep />}
          {step === 2 && (
            <PracticeSetupStep 
              profile={profile} 
              setProfile={setProfile}
              toggleSpecialty={toggleSpecialty}
            />
          )}
          {step === 3 && (
            <InviteClientStep 
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              skipInvite={skipInvite}
              setSkipInvite={setSkipInvite}
            />
          )}
          {step === 4 && <FeatureTourStep />}

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
                    Get Started <Check className="ml-2 h-4 w-4" />
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
  <CardHeader className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <CardTitle className="text-3xl">Welcome to Your Practice</CardTitle>
    </div>
    
    <CardDescription className="text-base leading-relaxed space-y-4">
      <p className="text-foreground font-medium">
        Transform how you manage client health journeys
      </p>
      
      <div className="space-y-3 pt-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Centralized Client Management</p>
            <p className="text-sm">All your clients' health data, progress, and communications in one place</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Automated Weekly Summaries</p>
            <p className="text-sm">AI-powered insights on each client's nutrition, activity, and medication adherence</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">Smart Pattern Detection</p>
            <p className="text-sm">Get alerts on concerning trends before they become problems</p>
          </div>
        </div>
      </div>

      <p className="text-sm pt-4 border-t">
        Let's set up your practice in just 3 minutes.
      </p>
    </CardDescription>
  </CardHeader>
);

const PracticeSetupStep = ({ profile, setProfile, toggleSpecialty }: any) => (
  <>
    <CardHeader>
      <CardTitle>Set Up Your Practice</CardTitle>
      <CardDescription>Tell us about your practice and areas of expertise</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="name">Your Full Name</Label>
        <Input
          id="name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="Dr. Sarah Johnson"
        />
      </div>
      
      <div>
        <Label htmlFor="practice_name">Practice/Business Name</Label>
        <Input
          id="practice_name"
          value={profile.practice_name}
          onChange={(e) => setProfile({ ...profile, practice_name: e.target.value })}
          placeholder="Johnson Nutrition Clinic"
        />
      </div>
      
      <div>
        <Label htmlFor="years_experience">Years of Experience (Optional)</Label>
        <Input
          id="years_experience"
          type="number"
          value={profile.years_experience}
          onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
          placeholder="5"
        />
      </div>
      
      <div>
        <Label>Specialties (Select all that apply)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SPECIALTIES.map(specialty => (
            <Badge
              key={specialty}
              variant={profile.specialties.includes(specialty) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSpecialty(specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell clients about your approach and philosophy..."
          rows={3}
        />
      </div>
    </CardContent>
  </>
);

const InviteClientStep = ({ inviteEmail, setInviteEmail, skipInvite, setSkipInvite }: any) => (
  <>
    <CardHeader>
      <CardTitle>Invite Your First Client</CardTitle>
      <CardDescription>Get started by inviting a client to join your practice</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="client_email">Client Email Address</Label>
        <Input
          id="client_email"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="client@example.com"
          disabled={skipInvite}
        />
        <p className="text-sm text-muted-foreground mt-2">
          They'll receive an invitation link to create their account and connect with you
        </p>
      </div>
      
      <div className="flex items-center space-x-2 pt-4">
        <input
          type="checkbox"
          id="skip_invite"
          checked={skipInvite}
          onChange={(e) => setSkipInvite(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="skip_invite" className="cursor-pointer font-normal">
          Skip for now, I'll invite clients later
        </Label>
      </div>
    </CardContent>
  </>
);

const FeatureTourStep = () => (
  <>
    <CardHeader>
      <CardTitle>You're All Set!</CardTitle>
      <CardDescription>Here's what you can do in your dashboard</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-1">Client Overview</h4>
          <p className="text-sm text-muted-foreground">
            See all your active clients, their recent activity, and any alerts that need attention
          </p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-1">Weekly Summaries</h4>
          <p className="text-sm text-muted-foreground">
            Review AI-generated summaries of each client's week, including meals, workouts, and medications
          </p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-1">Add Notes & Flags</h4>
          <p className="text-sm text-muted-foreground">
            Document observations and flag important items for follow-up
          </p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-1">Invite More Clients</h4>
          <p className="text-sm text-muted-foreground">
            Easily invite new clients via email - they'll be guided through setup
          </p>
        </div>
      </div>
    </CardContent>
  </>
);

export default DieticianOnboarding;