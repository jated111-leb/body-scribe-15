import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

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
              Your personal
              <span className="bg-gradient-primary bg-clip-text text-transparent"> operating system</span> for health
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform raw health inputs into a continuous, contextual, actionable timeline. 
              Log naturally, understand deeply, optimize intelligently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
                onClick={() => navigate('/auth')}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Activity className="h-8 w-8 text-primary" />}
            title="Quick Capture"
            description="Log meals, symptoms, workouts, and more in natural language. We parse and organize everything."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title="Smart Timeline"
            description="Beautiful calendar view with heatmaps, trackers, and daily snapshots of your health journey."
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8 text-primary" />}
            title="AI Assistant"
            description="Ask questions, get summaries, receive personalized recommendations based on your data."
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-primary" />}
            title="Trend Analysis"
            description="Spot patterns, track progress, and understand what's working—or what needs attention."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card border-y">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to take control of your health?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands using Lovable OS to build better health habits through intelligent logging and insights.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90"
          >
            Start Your Journey
          </Button>
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
