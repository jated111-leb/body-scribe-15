import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Utensils, 
  Activity, 
  Pill, 
  AlertCircle, 
  TrendingDown,
  Sparkles,
  FileText,
  Droplets
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Achievement {
  id: string;
  type: "consistency" | "reduction" | "correlation" | "lifestyle";
  category: string;
  start_date: string;
  current_streak: number;
  last_event_date: string | null;
  insight_text: string;
  status: "active" | "expired";
}

const CATEGORY_CONFIG: Record<string, { icon: any; label: string }> = {
  workout: { icon: Activity, label: "Movement" },
  meal: { icon: Utensils, label: "Nutrition" },
  medication: { icon: Pill, label: "Medication" },
  symptom: { icon: AlertCircle, label: "Symptom Tracking" },
  note: { icon: FileText, label: "Journaling" },
  alcohol_free: { icon: Droplets, label: "Lifestyle Shift" },
  flexibility_pain: { icon: Sparkles, label: "Correlation Insight" },
};

const TYPE_COLORS: Record<string, string> = {
  consistency: "text-[#6CB792]",
  reduction: "text-[#6CB792]",
  correlation: "text-[#6CB792]",
  lifestyle: "text-[#6CB792]",
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
        .eq("status", "active")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAchievements((data || []) as Achievement[]);
    } catch (error: any) {
      console.error("Error loading achievements:", error);
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
      <Card className="bg-[#F7F8F8] border-[#E6E8E8]">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Aura Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading your milestones...</p>
        </CardContent>
      </Card>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card className="bg-[#F7F8F8] border-[#E6E8E8]">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Aura Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No achievements yet. Track your rhythm and Aura will highlight meaningful milestones.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#F7F8F8] border-[#E6E8E8]">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Aura Achievements</CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized insights from your health patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => {
          const config = CATEGORY_CONFIG[achievement.category] || {
            icon: Sparkles,
            label: achievement.category,
          };
          const Icon = config.icon;
          const colorClass = TYPE_COLORS[achievement.type] || "text-[#6CB792]";

          return (
            <div
              key={achievement.id}
              className="group p-4 rounded-lg border border-[#E6E8E8] bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className={`h-5 w-5 ${colorClass}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-base leading-tight">
                        {getAchievementTitle(achievement)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.label}
                      </p>
                    </div>
                    {achievement.current_streak > 0 && (
                      <div className="flex-shrink-0 px-2 py-1 rounded-md bg-[#6CB792]/10 text-[#6CB792] text-xs font-medium">
                        {achievement.current_streak}{" "}
                        {achievement.type === "consistency" ? "days" : "events"}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {achievement.insight_text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Since {format(new Date(achievement.start_date), "MMM d, yyyy")}
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

/**
 * Generate meaningful achievement titles based on type and category
 */
function getAchievementTitle(achievement: Achievement): string {
  const { type, category, current_streak } = achievement;

  if (type === "consistency") {
    const labels: Record<string, string> = {
      workout: "Movement Consistency",
      meal: "Nutrition Tracking",
      medication: "Medication Adherence",
      symptom: "Health Awareness",
      note: "Reflective Practice",
    };
    return labels[category] || "Consistent Tracking";
  }

  if (type === "reduction") {
    return "Symptom Improvement";
  }

  if (type === "correlation") {
    if (category.includes("flexibility")) {
      return "Mind-Body Connection";
    }
    return "Behavioral Insight";
  }

  if (type === "lifestyle") {
    if (category.includes("alcohol")) {
      return "Mindful Moderation";
    }
    return "Lifestyle Evolution";
  }

  return "Health Milestone";
}
