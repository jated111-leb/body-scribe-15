import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Heart, Shield, Sparkles } from "lucide-react";
import { format } from "date-fns";

const ACHIEVEMENT_ICONS = {
  lifestyle_shift: Leaf,
  avoidance: Shield,
  recovery_safe: Heart,
  restart: Sparkles,
};

const ACHIEVEMENT_COLORS = {
  lifestyle_shift: "text-[#6CB792]",
  avoidance: "text-[#6CB792]",
  recovery_safe: "text-[#6CB792]",
  restart: "text-[#6CB792]",
};

export function LifestyleAchievements({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("lifestyle-achievements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lifestyle_achievements",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("lifestyle_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("date_triggered", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error loading lifestyle achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (achievements.length === 0) return null;

  return (
    <Card className="border-[#6CB792]/20 bg-gradient-to-br from-[#6CB792]/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="h-5 w-5 text-[#6CB792]" />
          Lifestyle Observations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quiet validations of intentional choices
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => {
          const Icon = ACHIEVEMENT_ICONS[achievement.achievement_type as keyof typeof ACHIEVEMENT_ICONS] || Leaf;
          const colorClass = ACHIEVEMENT_COLORS[achievement.achievement_type as keyof typeof ACHIEVEMENT_COLORS];

          return (
            <div
              key={achievement.id}
              className="p-4 rounded-lg border border-[#6CB792]/20 bg-white/50 hover:bg-white/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className={`h-5 w-5 ${colorClass}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-tight">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {achievement.insight_text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(achievement.date_triggered), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}