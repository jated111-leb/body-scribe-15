import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize user achievement preferences if they don't exist
 * Should be called after user signs up or first logs in
 */
export async function initializeUserPreferences(userId: string) {
  try {
    // Check if preferences already exist
    const { data: existing, error: fetchError } = await supabase
      .from("user_achievement_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking user preferences:", fetchError);
      throw fetchError;
    }

    if (existing) {
      console.log("User preferences already exist");
      return;
    }

    // Create default preferences
    const { error } = await supabase.from("user_achievement_preferences").insert({
      user_id: userId,
      notifications_enabled: true,
      notification_frequency: "realtime",
      progressive_complexity: 1, // Start at week 1 level
    });

    if (error) {
      console.error("Error creating user preferences:", error);
      throw error;
    }

    console.log("User preferences initialized successfully");
  } catch (error) {
    console.error("Error in initializeUserPreferences:", error);
  }
}

/**
 * Update user's progressive complexity level (week advancement)
 * Called automatically based on account age or manually triggered
 */
export async function updateProgressiveComplexity(userId: string, level: number) {
  try {
    const { error } = await supabase
      .from("user_achievement_preferences")
      .update({ progressive_complexity: level })
      .eq("user_id", userId);

    if (error) throw error;

    console.log(`Progressive complexity updated to level ${level}`);
  } catch (error) {
    console.error("Error updating progressive complexity:", error);
  }
}