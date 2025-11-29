import { supabase } from "@/integrations/supabase/client";

export interface UserDataExport {
  exportDate: string;
  profile: any;
  timelineEvents: any[];
  achievements: any[];
  achievementProgress: any[];
  lifestyleAchievements: any[];
  lifestyleFocus: any[];
  weeklySummaries: any[];
  inferredPatterns: any[];
  userPreferences: any;
}

export const exportUserData = async (userId: string): Promise<UserDataExport> => {
  // Fetch all user data from various tables
  const [
    { data: profile },
    { data: timelineEvents },
    { data: achievements },
    { data: achievementProgress },
    { data: lifestyleAchievements },
    { data: lifestyleFocus },
    { data: weeklySummaries },
    { data: inferredPatterns },
    { data: userPreferences },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("timeline_events").select("*").eq("user_id", userId).order("event_date", { ascending: false }),
    supabase.from("achievements").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("achievement_progress").select("*").eq("user_id", userId),
    supabase.from("lifestyle_achievements").select("*").eq("user_id", userId).order("date_triggered", { ascending: false }),
    supabase.from("lifestyle_focus").select("*").eq("user_id", userId),
    supabase.from("weekly_summaries").select("*").eq("user_id", userId).order("week_start_date", { ascending: false }),
    supabase.from("inferred_patterns").select("*").eq("user_id", userId),
    supabase.from("user_achievement_preferences").select("*").eq("user_id", userId).single(),
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile: profile || {},
    timelineEvents: timelineEvents || [],
    achievements: achievements || [],
    achievementProgress: achievementProgress || [],
    lifestyleAchievements: lifestyleAchievements || [],
    lifestyleFocus: lifestyleFocus || [],
    weeklySummaries: weeklySummaries || [],
    inferredPatterns: inferredPatterns || [],
    userPreferences: userPreferences || {},
  };
};

export const downloadDataExport = async (userId: string) => {
  const data = await exportUserData(userId);
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aura-health-data-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
