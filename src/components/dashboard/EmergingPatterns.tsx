import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AchievementProgress {
  type: string;
  category: string;
  current_count: number;
  required_count: number;
  progress_message: string;
}

export function EmergingPatterns({ userId }: { userId: string }) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("achievement-progress-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "achievement_progress",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("achievement_progress")
        .select("*")
        .eq("user_id", userId)
        .order("current_count", { ascending: false });

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || progress.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Emerging Patterns
        </CardTitle>
        <p className="text-sm text-muted-foreground">You're building new health rhythms</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.map((item, idx) => {
          const percentage = (item.current_count / item.required_count) * 100;
          
          return (
            <div
              key={`${item.type}_${item.category}_${idx}`}
              className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-relaxed">{item.progress_message}</p>
                </div>
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              </div>
              <div className="space-y-1">
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {item.current_count} / {item.required_count}
                  </span>
                  <span>{Math.round(percentage)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}