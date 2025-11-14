import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading } = useUserRole();
  const [roleSelected, setRoleSelected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRoleSelected = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role_selected")
          .eq("id", user.id)
          .single();
        
        setRoleSelected(data?.role_selected ?? false);
      }
    };

    checkRoleSelected();
  }, [user]);

  useEffect(() => {
    if (!loading && user && roleSelected !== null) {
      // Only redirect to role-selection if user hasn't selected a role yet
      if (!role && !roleSelected) {
        navigate("/role-selection");
      } else if (role === "dietician") {
        navigate("/dietician-dashboard");
      } else if (role === "client") {
        navigate("/dashboard");
      }
    }
  }, [user, role, loading, roleSelected, navigate]);

  if (loading || roleSelected === null) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
                onClick={() => navigate('/auth')}
              >
                Explore Aura <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
              >
                For Professionals
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
              onClick={() => navigate('/auth')}
            >
              Start with Aura <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
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
