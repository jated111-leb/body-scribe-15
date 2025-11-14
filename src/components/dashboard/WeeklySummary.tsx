import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Utensils, 
  Activity, 
  Pill,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";

interface WeeklySummaryProps {
  userId?: string; // Optional: for viewing other users' summaries (dieticians)
}

interface Summary {
  id: string;
  week_start_date: string;
  week_end_date: string;
  summary_text: string;
  total_events: number;
  meal_count: number;
  workout_count: number;
  medication_count: number;
  generated_at: string;
}

export const WeeklySummary = ({ userId }: WeeklySummaryProps) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadSummaries();
    }
  }, [targetUserId]);

  useEffect(() => {
    // Subscribe to realtime updates
    if (!targetUserId) return;

    const channel = supabase
      .channel("weekly-summaries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_summaries",
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          loadSummaries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  const loadSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_summaries")
        .select("*")
        .eq("user_id", targetUserId)
        .order("week_start_date", { ascending: false })
        .limit(10);

      if (error) throw error;

      setSummaries(data || []);
    } catch (error) {
      console.error("Error loading summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const targetDate = addWeeks(today, currentWeekOffset);
    const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday
    return { start, end };
  };

  const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekDates();

  const currentSummary = summaries.find(
    s => s.week_start_date === format(currentWeekStart, "yyyy-MM-dd")
  );

  const handleGenerateSummary = async () => {
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-summary", {
        body: {
          userId: userId, // Only pass userId if viewing another user's summary
          weekStartDate: currentWeekStart.toISOString(),
        },
      });

      if (error) throw error;

      toast({
        title: "Summary generated!",
        description: "Your weekly health summary is ready",
      });

      loadSummaries();
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast({
        title: "Failed to generate summary",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
  const goToNextWeek = () => {
    if (currentWeekOffset < 0) {
      setCurrentWeekOffset(currentWeekOffset + 1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Week's Rhythm
            </CardTitle>
            <CardDescription>
              Patterns and insights from your health signals
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center px-3">
              <div className="text-sm font-medium">
                {format(currentWeekStart, "MMM d")} - {format(currentWeekEnd, "MMM d, yyyy")}
              </div>
              {currentWeekOffset === 0 && (
                <Badge variant="secondary" className="mt-1">Current Week</Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              disabled={currentWeekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentSummary ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Events</span>
                </div>
                <div className="text-2xl font-bold">{currentSummary.total_events}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Utensils className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Meals</span>
                </div>
                <div className="text-2xl font-bold">{currentSummary.meal_count}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Workouts</span>
                </div>
                <div className="text-2xl font-bold">{currentSummary.workout_count}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Medications</span>
                </div>
                <div className="text-2xl font-bold">{currentSummary.medication_count}</div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {currentSummary.summary_text}
                </div>
              </div>
            </div>

            {/* Generated timestamp */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Generated {new Date(currentSummary.generated_at).toLocaleString()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generating}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Understanding Awaits</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aura will interpret this week's signals into clear, meaningful insights
            </p>
            <Button
              onClick={handleGenerateSummary}
              disabled={generating}
              className="bg-gradient-primary shadow-glow"
            >
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Interpreting signals...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Rhythm Summary
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
