import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimelineEvent {
  id: string;
  event_type: string;
  event_date: string;
  activity_type?: string;
  severity?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users who have logged events in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers, error: usersError } = await supabase
      .from("timeline_events")
      .select("user_id")
      .gte("created_at", oneDayAgo);

    if (usersError) {
      console.error("Error fetching active users:", usersError);
      throw usersError;
    }

    const uniqueUserIds = Array.from(new Set(activeUsers?.map((u) => u.user_id) || []));
    console.log(`Processing achievements for ${uniqueUserIds.length} users`);

    const results = [];

    for (const userId of uniqueUserIds) {
      try {
        // Get user preferences
        const { data: preferences } = await supabase
          .from("user_achievement_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (preferences && !preferences.notifications_enabled) {
          console.log(`Skipping user ${userId} - notifications disabled`);
          continue;
        }

        // Fetch last 30 days of events
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: events, error: eventsError } = await supabase
          .from("timeline_events")
          .select("*")
          .eq("user_id", userId)
          .gte("event_date", thirtyDaysAgo)
          .order("event_date", { ascending: false });

        if (eventsError || !events || events.length === 0) {
          console.log(`No events for user ${userId}`);
          continue;
        }

        // Calculate achievements (simplified for edge function)
        const { data: existingAchievements } = await supabase
          .from("achievements")
          .select("*")
          .eq("user_id", userId);

        const newAchievements = await calculateAchievements(
          userId,
          events as TimelineEvent[],
          existingAchievements || [],
          preferences?.progressive_complexity || 1
        );

        // Create notifications for new achievements
        for (const achievement of newAchievements) {
          await supabase.from("achievement_notifications").insert({
            user_id: userId,
            achievement_id: achievement.id,
            notification_type: "unlock",
            message: achievement.insight_text,
          });
        }

        results.push({ userId, newAchievements: newAchievements.length });
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: uniqueUserIds.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in calculate-user-achievements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function calculateAchievements(
  userId: string,
  events: TimelineEvent[],
  existingAchievements: any[],
  progressLevel: number
): Promise<any[]> {
  const newAchievements: any[] = [];
  const categories = ["workout", "meal", "medication", "symptom", "note"];

  // Only calculate consistency for now (can be expanded)
  for (const category of categories) {
    const categoryEvents = events.filter((e) => e.event_type === category);
    if (categoryEvents.length < 3) continue;

    const uniqueDays = new Set(
      categoryEvents.map((e) => {
        const date = new Date(e.event_date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`;
      })
    );

    if (uniqueDays.size >= 3) {
      const existing = existingAchievements.find(
        (a) => a.type === "consistency" && a.category === category
      );

      if (!existing) {
        const oldestEvent = categoryEvents[categoryEvents.length - 1];
        const newestEvent = categoryEvents[0];

        newAchievements.push({
          id: crypto.randomUUID(),
          user_id: userId,
          type: "consistency",
          category,
          start_date: oldestEvent.event_date.split("T")[0],
          current_streak: uniqueDays.size,
          last_event_date: newestEvent.event_date.split("T")[0],
          insight_text: `${category.charAt(0).toUpperCase() + category.slice(
            1
          )} tracking established: ${uniqueDays.size} days logged.`,
          status: "active",
        });
      }
    }
  }

  return newAchievements;
}