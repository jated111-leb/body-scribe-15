import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to listen for and display achievement notifications in realtime
 */
export function useAchievementNotifications(userId: string | undefined) {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new achievement notifications
    const channel = supabase
      .channel("achievement-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "achievement_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Display toast based on notification type
          const icons = {
            unlock: "🌱",
            progress: "💫",
            shift: "🔄",
            correlation: "🔍",
          };

          const titles = {
            unlock: "New Pattern Detected",
            progress: "Almost There",
            shift: "Pattern Shifted",
            correlation: "Connection Discovered",
          };

          toast({
            title: `${icons[notification.notification_type as keyof typeof icons]} ${
              titles[notification.notification_type as keyof typeof titles]
            }`,
            description: notification.message,
            duration: 5000,
          });

          // Mark notification as read
          supabase
            .from("achievement_notifications")
            .update({ read: true })
            .eq("id", notification.id)
            .then();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);
}