/**
 * Achievement System - Enhanced Tracking Module
 * 
 * This module handles pattern-based achievements for general health behaviors:
 * - Consistency streaks (e.g., daily logging, regular meals)
 * - Reduction patterns (e.g., decreasing symptom severity)
 * - Correlation detection (e.g., workout -> mood improvements)
 * 
 * Works alongside lifestyleAchievements.ts which handles lifestyle-specific goals.
 * 
 * Architecture:
 * - Processes timeline_events to detect patterns
 * - Creates/updates entries in achievements table
 * - Generates progress updates in achievement_progress table
 * - Creates notifications in achievement_notifications table
 * 
 * Called asynchronously after timeline events are saved (non-blocking).
 */

import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subDays, format } from "date-fns";

interface TimelineEvent {
  id: string;
  event_type: string;
  event_date: string;
  activity_type?: string;
  severity?: string;
  meal_type?: string;
  medication_name?: string;
  structured_data?: any;
  description?: string;
}

interface Achievement {
  id?: string;
  user_id: string;
  type: "consistency" | "reduction" | "correlation" | "lifestyle";
  category: string;
  start_date: string;
  current_streak: number;
  last_event_date: string | null;
  metadata?: any;
  insight_text: string;
  status: "active" | "expired";
}

interface AchievementProgress {
  type: string;
  category: string;
  current_count: number;
  required_count: number;
  progress_message: string;
}

/**
 * Enhanced function to calculate achievements and progress
 * Returns notification data if new achievements are unlocked
 */
export async function updateAchievementsEnhanced(userId: string): Promise<{
  newAchievements: Achievement[];
  progressUpdates: AchievementProgress[];
}> {
  try {
    console.log('🎯 Starting achievement calculation for user:', userId);
    
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const { data: events, error: eventsError } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .gte("event_date", thirtyDaysAgo)
      .order("event_date", { ascending: false });

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      console.log('⚠️ No events found for user');
      return { newAchievements: [], progressUpdates: [] };
    }
    
    console.log(`📅 Found ${events.length} events in last 30 days`);

    // Fetch existing achievements
    const { data: existingAchievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId);

    console.log(`🏆 Existing achievements: ${existingAchievements?.length || 0}`);

    const achievementMap = new Map(
      (existingAchievements || []).map((a) => [`${a.type}_${a.category}`, a])
    );

    // Get user preferences for progressive disclosure
    const { data: preferences } = await supabase
      .from("user_achievement_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const progressLevel = preferences?.progressive_complexity || 1;
    console.log(`📊 Progress level: ${progressLevel} (Week ${progressLevel})`);

    const newAchievements: Achievement[] = [];
    const progressUpdates: AchievementProgress[] = [];

    // Week 1: Only consistency
    if (progressLevel >= 1) {
      console.log('🔄 Calculating consistency achievements...');
      const { achievements, progress } = await calculateConsistencyWithProgress(
        userId,
        events,
        achievementMap
      );
      newAchievements.push(...achievements);
      progressUpdates.push(...progress);
      console.log(`  ✓ Consistency: ${achievements.length} new, ${progress.length} in progress`);
    }

    // Week 2: Add reduction
    if (progressLevel >= 2) {
      console.log('📉 Calculating reduction achievements...');
      const reductionAchievements = await calculateReductionAchievements(
        userId,
        events,
        achievementMap
      );
      newAchievements.push(...reductionAchievements);
      console.log(`  ✓ Reduction: ${reductionAchievements.length} new`);
    }

    // Week 3+: Add correlation
    if (progressLevel >= 3) {
      console.log('🔗 Calculating correlation achievements...');
      const correlationAchievements = await calculateCorrelationAchievements(
        userId,
        events,
        achievementMap
      );
      newAchievements.push(...correlationAchievements);
      console.log(`  ✓ Correlation: ${correlationAchievements.length} new`);
    }

    // Week 4+: Full lifestyle shift
    if (progressLevel >= 4) {
      console.log('🌟 Calculating lifestyle shift achievements...');
      const lifestyleAchievements = await calculateLifestyleShiftAchievements(
        userId,
        events,
        achievementMap
      );
      newAchievements.push(...lifestyleAchievements);
      console.log(`  ✓ Lifestyle: ${lifestyleAchievements.length} new`);
    }

    await expireInvalidAchievements(userId, events, achievementMap);

    // Save progress updates
    if (progressUpdates.length > 0) {
      await saveProgressUpdates(userId, progressUpdates);
    }

    console.log(`✅ Achievement calculation complete: ${newAchievements.length} new achievements, ${progressUpdates.length} progress updates`);

    return { newAchievements, progressUpdates };
  } catch (error) {
    console.error("❌ Error updating achievements:", error);
    return { newAchievements: [], progressUpdates: [] };
  }
}

async function calculateConsistencyWithProgress(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
): Promise<{ achievements: Achievement[]; progress: AchievementProgress[] }> {
  const categories = ["workout", "meal", "medication", "symptom", "note"];
  const achievements: Achievement[] = [];
  const progress: AchievementProgress[] = [];

  for (const category of categories) {
    const categoryEvents = events.filter((e) => e.event_type === category);
    const uniqueDays = new Set(
      categoryEvents.map((e) => format(new Date(e.event_date), "yyyy-MM-dd"))
    );

    const streak = calculateConsecutiveStreak(categoryEvents);
    const key = `consistency_${category}`;
    const existing = achievementMap.get(key);

    if (streak >= 3) {
      // Unlocked achievement
      if (!existing) {
        const oldestEvent = categoryEvents[categoryEvents.length - 1];
        const newestEvent = categoryEvents[0];
        const insightText = generateConsistencyInsight(category, streak);

        const achievement: Achievement = {
          user_id: userId,
          type: "consistency",
          category,
          start_date: oldestEvent.event_date.split("T")[0],
          current_streak: streak,
          last_event_date: newestEvent.event_date.split("T")[0],
          insight_text: insightText,
          status: "active",
        };

        await supabase.from("achievements").insert(achievement);
        achievements.push(achievement);
      } else if (existing.current_streak !== streak) {
        await supabase
          .from("achievements")
          .update({
            current_streak: streak,
            last_event_date: categoryEvents[0].event_date.split("T")[0],
            status: "active",
          })
          .eq("id", existing.id);
      }
    } else if (streak === 2) {
      // Almost there - show progress
      progress.push({
        type: "consistency",
        category,
        current_count: streak,
        required_count: 3,
        progress_message: `1 more ${getCategoryLabel(category)} day to unlock a ${getCategoryLabel(category)} pattern insight`,
      });
    } else if (uniqueDays.size > 0) {
      // Just started - encourage
      progress.push({
        type: "consistency",
        category,
        current_count: uniqueDays.size,
        required_count: 3,
        progress_message: `${3 - uniqueDays.size} more days to unlock ${getCategoryLabel(category)} insights`,
      });
    }
  }

  return { achievements, progress };
}

async function calculateReductionAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
): Promise<Achievement[]> {
  const achievements: Achievement[] = [];
  const symptoms = events.filter((e) => e.event_type === "symptom");
  if (symptoms.length < 4) return achievements;

  const sevenDaysAgo = subDays(new Date(), 7);
  const fourteenDaysAgo = subDays(new Date(), 14);

  const currentWeek = symptoms.filter((e) => new Date(e.event_date) >= sevenDaysAgo);
  const previousWeek = symptoms.filter(
    (e) => new Date(e.event_date) >= fourteenDaysAgo && new Date(e.event_date) < sevenDaysAgo
  );

  if (currentWeek.length === 0 || previousWeek.length === 0) return achievements;

  if (currentWeek.length < previousWeek.length) {
    const reduction = previousWeek.length - currentWeek.length;
    const key = "reduction_symptom";
    const existing = achievementMap.get(key);

    const insightText = `Your symptoms decreased by ${reduction} events this week. Your body is responding positively.`;

    if (!existing) {
      const achievement: Achievement = {
        user_id: userId,
        type: "reduction",
        category: "symptom",
        start_date: currentWeek[currentWeek.length - 1].event_date.split("T")[0],
        current_streak: reduction,
        last_event_date: currentWeek[0].event_date.split("T")[0],
        insight_text: insightText,
        status: "active",
      };

      await supabase.from("achievements").insert(achievement);
      achievements.push(achievement);
    }
  }

  return achievements;
}

async function calculateCorrelationAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
): Promise<Achievement[]> {
  const achievements: Achievement[] = [];
  const workouts = events.filter((e) => e.event_type === "workout");
  const symptoms = events.filter((e) => e.event_type === "symptom");

  if (workouts.length < 2 || symptoms.length < 2) return achievements;

  const flexibility = workouts.filter(
    (e) =>
      e.activity_type === "yoga" ||
      e.activity_type === "pilates" ||
      e.activity_type === "stretching"
  );

  if (flexibility.length >= 2) {
    const flexDates = new Set(
      flexibility.map((e) => format(new Date(e.event_date), "yyyy-MM-dd"))
    );

    let painReductions = 0;
    flexDates.forEach((date) => {
      const nextDay = format(new Date(new Date(date).getTime() + 86400000), "yyyy-MM-dd");
      const symptomsOnNextDay = symptoms.filter(
        (s) => format(new Date(s.event_date), "yyyy-MM-dd") === nextDay
      );

      if (symptomsOnNextDay.length === 0 || symptomsOnNextDay.every((s) => s.severity === "mild")) {
        painReductions++;
      }
    });

    if (painReductions >= 2) {
      const key = "correlation_flexibility_pain";
      const existing = achievementMap.get(key);

      const activityName = flexibility[0].activity_type || "stretching";
      const insightText = `${
        activityName.charAt(0).toUpperCase() + activityName.slice(1)
      } sessions correlate with fewer symptoms the following day.`;

      if (!existing) {
        const achievement: Achievement = {
          user_id: userId,
          type: "correlation",
          category: "flexibility_pain",
          start_date: flexibility[flexibility.length - 1].event_date.split("T")[0],
          current_streak: painReductions,
          last_event_date: flexibility[0].event_date.split("T")[0],
          insight_text: insightText,
          status: "active",
        };

        await supabase.from("achievements").insert(achievement);
        achievements.push(achievement);
      }
    }
  }

  return achievements;
}

async function calculateLifestyleShiftAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
): Promise<Achievement[]> {
  const achievements: Achievement[] = [];
  const notes = events.filter((e) => e.event_type === "note");

  for (const note of notes) {
    const description = (note.description || "").toLowerCase();

    if (description.includes("no alcohol") || description.includes("alcohol-free")) {
      const alcoholFreeNotes = notes.filter(
        (n) =>
          (n.description || "").toLowerCase().includes("no alcohol") ||
          (n.description || "").toLowerCase().includes("alcohol-free")
      );

      if (alcoholFreeNotes.length >= 3) {
        const key = "lifestyle_alcohol_free";
        const existing = achievementMap.get(key);
        const streak = calculateConsecutiveStreak(alcoholFreeNotes);

        const insightText = `Intentionally tracking ${streak} alcohol-free days. This mindful choice supports your health goals.`;

        if (!existing) {
          const achievement: Achievement = {
            user_id: userId,
            type: "lifestyle",
            category: "alcohol_free",
            start_date: alcoholFreeNotes[alcoholFreeNotes.length - 1].event_date.split("T")[0],
            current_streak: streak,
            last_event_date: alcoholFreeNotes[0].event_date.split("T")[0],
            insight_text: insightText,
            status: "active",
          };

          await supabase.from("achievements").insert(achievement);
          achievements.push(achievement);
        }
      }
    }
  }

  return achievements;
}

async function expireInvalidAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
) {
  const sevenDaysAgo = subDays(new Date(), 7);

  for (const [key, achievement] of achievementMap.entries()) {
    if (achievement.status === "expired") continue;

    const lastEventDate = achievement.last_event_date
      ? new Date(achievement.last_event_date)
      : null;

    if (lastEventDate && lastEventDate < sevenDaysAgo) {
      await supabase.from("achievements").update({ status: "expired" }).eq("id", achievement.id);
    }
  }
}

function calculateConsecutiveStreak(events: TimelineEvent[]): number {
  if (events.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(events.map((e) => format(new Date(e.event_date), "yyyy-MM-dd")))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const diff = differenceInDays(new Date(uniqueDays[i]), new Date(uniqueDays[i + 1]));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateConsistencyInsight(category: string, streak: number): string {
  const insights: Record<string, string> = {
    workout: `Your movement rhythm is established: ${streak} consecutive days of physical activity.`,
    meal: `Nutrition tracking is becoming routine: ${streak} consecutive days logged.`,
    medication: `Medication adherence is strong: ${streak} consecutive days maintained.`,
    symptom: `Health awareness is consistent: ${streak} consecutive days of symptom tracking.`,
    note: `Reflective practice is taking root: ${streak} consecutive days of journaling.`,
  };

  return insights[category] || `${category} tracking maintained for ${streak} days.`;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    workout: "movement",
    meal: "nutrition",
    medication: "medication",
    symptom: "symptom",
    note: "journaling",
  };
  return labels[category] || category;
}

async function saveProgressUpdates(userId: string, progressUpdates: AchievementProgress[]) {
  for (const progress of progressUpdates) {
    await supabase
      .from("achievement_progress")
      .upsert(
        {
          user_id: userId,
          type: progress.type,
          category: progress.category,
          current_count: progress.current_count,
          required_count: progress.required_count,
          progress_message: progress.progress_message,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,type,category" }
      );
  }
}

/**
 * Get contextual prompts based on user's data gaps
 */
export async function getContextualPrompts(userId: string): Promise<string[]> {
  const prompts: string[] = [];
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const { data: events } = await supabase
    .from("timeline_events")
    .select("event_type")
    .eq("user_id", userId)
    .gte("event_date", sevenDaysAgo);

  if (!events) return prompts;

  const eventTypes = new Set(events.map((e) => e.event_type));

  // Check for workouts but no symptoms
  if (eventTypes.has("workout") && !eventTypes.has("symptom")) {
    prompts.push("Tracking symptoms alongside workouts could reveal recovery patterns.");
  }

  // Check for symptoms but no meals
  if (eventTypes.has("symptom") && !eventTypes.has("meal")) {
    prompts.push("Logging meals with symptoms might uncover dietary connections.");
  }

  // Check for meals but no workouts
  if (eventTypes.has("meal") && !eventTypes.has("workout") && events.length > 3) {
    prompts.push("Adding movement tracking completes your health picture.");
  }

  return prompts;
}