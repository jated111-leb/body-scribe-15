import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inferLifestylePatterns } from "@/lib/lifestyleAchievements";

export function InferredPatternPrompt({ userId }: { userId: string }) {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    checkPatterns();
  }, [userId]);

  // Realtime subscription for inferred patterns
  useEffect(() => {
    const channel = supabase
      .channel('inferred-patterns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inferred_patterns',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          checkPatterns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkPatterns = async () => {
    try {
      // Get patterns that haven't been shown yet
      const { data: existing } = await supabase
        .from("inferred_patterns")
        .select("*")
        .eq("user_id", userId)
        .eq("confirmation_shown", false);

      if (existing && existing.length > 0) {
        setPatterns(existing);
        return;
      }

      // Infer new patterns
      const newPatterns = await inferLifestylePatterns(userId);
      if (newPatterns.length > 0) {
        // Only show the first pattern at a time
        setPatterns([newPatterns[0]]);
      }
    } catch (error) {
      console.error("Error checking patterns:", error);
    }
  };

  const handleAccept = async (pattern: any) => {
    try {
      // Create lifestyle focus from inferred pattern
      await supabase.from("lifestyle_focus").insert({
        user_id: userId,
        focus_type: pattern.pattern_type,
        status: "active",
        confidence: pattern.confidence || 0.7,
      });

      // Mark pattern as confirmed
      await supabase
        .from("inferred_patterns")
        .update({
          confirmation_shown: true,
          user_response: "accepted",
        })
        .eq("user_id", userId)
        .eq("pattern_type", pattern.pattern_type);

      setPatterns(patterns.filter((p) => p.pattern_type !== pattern.pattern_type));
    } catch (error) {
      console.error("Error accepting pattern:", error);
    }
  };

  const handleDismiss = async (pattern: any) => {
    try {
      await supabase
        .from("inferred_patterns")
        .update({
          confirmation_shown: true,
          user_response: "dismissed",
        })
        .eq("user_id", userId)
        .eq("pattern_type", pattern.pattern_type);

      setDismissed([...dismissed, pattern.pattern_type]);
      setPatterns(patterns.filter((p) => p.pattern_type !== pattern.pattern_type));
    } catch (error) {
      console.error("Error dismissing pattern:", error);
    }
  };

  const visiblePatterns = patterns.filter((p) => !dismissed.includes(p.pattern_type));

  if (visiblePatterns.length === 0) return null;

  const pattern = visiblePatterns[0];

  return (
    <Card className="border-[#6CB792]/30 bg-[#6CB792]/5">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[#6CB792] flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed">
              {pattern.message || "Aura noticed a pattern in your rhythm."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-[#6CB792] text-[#6CB792] hover:bg-[#6CB792]/10"
                onClick={() => handleAccept(pattern)}
              >
                Yes, observe this
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(pattern)}
                className="text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={() => handleDismiss(pattern)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}