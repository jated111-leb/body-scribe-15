import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, TrendingUp, Sparkles } from "lucide-react";

interface AchievementDetailModalProps {
  achievement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementDetailModal({
  achievement,
  open,
  onOpenChange,
}: AchievementDetailModalProps) {
  if (!achievement) return null;

  const getAchievementTitle = () => {
    if (achievement.type === "consistency") {
      const labels: Record<string, string> = {
        workout: "Movement Consistency",
        meal: "Nutrition Tracking",
        medication: "Medication Adherence",
        symptom: "Health Awareness",
        note: "Reflective Practice",
      };
      return labels[achievement.category] || "Consistent Tracking";
    }
    if (achievement.type === "reduction") return "Symptom Improvement";
    if (achievement.type === "correlation") return "Mind-Body Connection";
    if (achievement.type === "lifestyle") return "Mindful Moderation";
    return "Health Milestone";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {getAchievementTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievement Badge */}
          <div className="flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              {achievement.current_streak > 0 && (
                <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary">
                  <span className="text-3xl font-bold">{achievement.current_streak}</span>
                  <span className="ml-2 text-lg self-end">
                    {achievement.type === "consistency" ? "days" : "events"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Insight Text */}
          <div className="p-6 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              What This Means
            </h3>
            <p className="text-muted-foreground leading-relaxed">{achievement.insight_text}</p>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">Started</div>
                <div className="font-medium">
                  {format(new Date(achievement.start_date), "MMM d, yyyy")}
                </div>
              </div>
              {achievement.last_event_date && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Last Event</div>
                  <div className="font-medium">
                    {format(new Date(achievement.last_event_date), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Status: {achievement.status === "active" ? "✓ Active" : "Expired"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}