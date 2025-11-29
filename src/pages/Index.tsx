import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { LegalFooter } from "@/components/LegalFooter";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, loading } = useUserRole();
  // Navigate based on role
  useEffect(() => {
    if (user && !loading) {
      if (!role) {
        // User is authenticated but has no role - send to role selection
        navigate("/role-selection");
      } else if (role === "dietician") {
        navigate("/dietician-dashboard");
      } else if (role === "client") {
        navigate("/dashboard");
      }
    }
  }, [user, role, loading, navigate]);

  // Show loading while checking auth status
  if (user && loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Aura
          </h1>
          <div className="flex gap-3">
            {!user ? (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth?tab=signup')}
                  className="bg-gradient-primary"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Understanding,
              <span className="bg-gradient-primary bg-clip-text text-transparent"> synchronized</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform scattered health signals into meaningful updates — a shared layer of clarity between you and your care team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
                onClick={() => {
                  if (user) {
                    // User is logged in, go directly to dashboard
                    navigate(role === "dietician" ? "/dietician-dashboard" : "/dashboard");
                  } else {
                    // Not logged in, go to auth
                    navigate('/auth');
                  }
                }}
              >
                {user ? "Go to Dashboard" : "Explore Aura"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  if (user) {
                    handleSignOut();
                  } else {
                    navigate('/auth');
                  }
                }}
              >
                {user ? "Sign Out" : "For Professionals"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Clarity without effort
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aura interprets your nutrition, sleep, and mood into gentle daily summaries — your personal health mirror.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Activity className="h-8 w-8 text-primary" />}
            title="Connect Your Rhythm"
            description="Observe meals, sleep, mood, and vitals. Aura reads your inputs and surfaces what truly matters."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title="Pattern Recognition"
            description="See daily rhythms visualized — steadiness, harmony, and progress in clear context."
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8 text-primary" />}
            title="Gentle Intelligence"
            description="Contextual summaries that feel conversational, not gamified. Understanding, not judgment."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-primary" />}
            title="Shared Clarity"
            description="Collaborate with professionals through instant, consent-based updates. Always aligned, never overwhelmed."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card border-y">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              See the pattern. Share the understanding.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Awareness heals faster than pressure. Aura makes clarity a shared language.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
              onClick={() => {
                if (user) {
                  navigate(role === "dietician" ? "/dietician-dashboard" : "/dashboard");
                } else {
                  navigate('/auth');
                }
              }}
            >
              {user ? "Go to Dashboard" : "Start with Aura"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      <LegalFooter />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card p-6 rounded-xl border hover:shadow-lg transition-all duration-300">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

export default Index;
