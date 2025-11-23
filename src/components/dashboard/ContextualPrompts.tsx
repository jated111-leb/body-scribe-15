import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { getContextualPrompts } from "@/lib/achievementsEnhanced";
import { supabase } from "@/integrations/supabase/client";

export function ContextualPrompts({ userId }: { userId: string }) {
  const [prompts, setPrompts] = useState<string[]>([]);

  useEffect(() => {
    loadPrompts();
  }, [userId]);

  // Realtime subscription to refresh prompts when achievements or progress changes
  useEffect(() => {
    const achievementsChannel = supabase
      .channel('contextual-prompts-achievements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadPrompts();
        }
      )
      .subscribe();

    const progressChannel = supabase
      .channel('contextual-prompts-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievement_progress',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(achievementsChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [userId]);

  const loadPrompts = async () => {
    const newPrompts = await getContextualPrompts(userId);
    setPrompts(newPrompts);
  };

  if (prompts.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="space-y-3">
          {prompts.map((prompt, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{prompt}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}