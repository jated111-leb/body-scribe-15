import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Droplet, Dumbbell, Moon, Pill, Heart, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Achievement {
  id: string;
  type: string;
  start_date: string;
  current_streak: number;
  last_event_date: string | null;
}

const ACHIEVEMENT_CONFIG = {
  alcohol_free: {
    icon: Droplet,
    label: "Alcohol-Free",
    color: "text-accent",
  },
  sugar_free: {
    icon: Apple,
    label: "Sugar-Free",
    color: "text-accent-warm",
  },
  exercise_streak: {
    icon: Dumbbell,
    label: "Exercise Streak",
    color: "text-primary",
  },
  sleep_streak: {
    icon: Moon,
    label: "Sleep Quality",
    color: "text-primary",
  },
  supplement_consistency: {
    icon: Pill,
    label: "Supplement Adherence",
    color: "text-accent",
  },
  symptom_tracking: {
    icon: Heart,
    label: "Symptom Tracking",
    color: "text-accent-warm",
  },
};

export function Achievements({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("current_streak", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading achievements",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading achievements...</p>
        </CardContent>
      </Card>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start tracking your health activities to unlock achievements and build streaks!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-accent" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => {
          const config = ACHIEVEMENT_CONFIG[achievement.type as keyof typeof ACHIEVEMENT_CONFIG];
          if (!config) return null;

          const Icon = config.icon;
          const streakDays = achievement.current_streak;

          return (
            <div
              key={achievement.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Since {format(new Date(achievement.start_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Flame className="h-3 w-3" />
                {streakDays} {streakDays === 1 ? "day" : "days"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
