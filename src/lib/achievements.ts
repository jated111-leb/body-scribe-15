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

/**
 * Main function to calculate and update achievements for a user
 * Called after any timeline event is logged
 */
export async function updateAchievementsForUser(userId: string) {
  try {
    // Fetch last 30 days of events
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const { data: events, error: eventsError } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .gte("event_date", thirtyDaysAgo)
      .order("event_date", { ascending: false });

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return;

    // Fetch existing achievements
    const { data: existingAchievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId);

    if (achievementsError) throw achievementsError;

    const achievementMap = new Map(
      (existingAchievements || []).map((a) => [
        `${a.type}_${a.category}`,
        a,
      ])
    );

    // Calculate different achievement types
    await calculateConsistencyAchievements(userId, events, achievementMap);
    await calculateReductionAchievements(userId, events, achievementMap);
    await calculateCorrelationAchievements(userId, events, achievementMap);
    await calculateLifestyleShiftAchievements(userId, events, achievementMap);

    // Expire achievements that are no longer valid
    await expireInvalidAchievements(userId, events, achievementMap);
  } catch (error) {
    console.error("Error updating achievements:", error);
  }
}

/**
 * Calculate consistency achievements (≥3 days of logging a category)
 */
async function calculateConsistencyAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
) {
  const categories = ["workout", "meal", "medication", "symptom", "note"];

  for (const category of categories) {
    const categoryEvents = events.filter((e) => e.event_type === category);
    if (categoryEvents.length < 3) continue;

    // Get unique days logged
    const uniqueDays = new Set(
      categoryEvents.map((e) => format(new Date(e.event_date), "yyyy-MM-dd"))
    );

    if (uniqueDays.size >= 3) {
      // Calculate consecutive streak
      const streak = calculateConsecutiveStreak(categoryEvents);
      
      if (streak >= 3) {
        const key = `consistency_${category}`;
        const existing = achievementMap.get(key);
        const oldestEvent = categoryEvents[categoryEvents.length - 1];
        const newestEvent = categoryEvents[0];

        const insightText = generateConsistencyInsight(category, streak);

        if (existing) {
          // Update existing achievement
          if (existing.current_streak !== streak || existing.status !== "active") {
            await supabase
              .from("achievements")
              .update({
                current_streak: streak,
                last_event_date: newestEvent.event_date.split("T")[0],
                status: "active",
                insight_text: insightText,
              })
              .eq("id", existing.id);
          }
        } else {
          // Create new achievement
          await supabase.from("achievements").insert({
            user_id: userId,
            type: "consistency",
            category,
            start_date: oldestEvent.event_date.split("T")[0],
            current_streak: streak,
            last_event_date: newestEvent.event_date.split("T")[0],
            insight_text: insightText,
            status: "active",
          });
        }
      }
    }
  }
}

/**
 * Calculate reduction achievements (symptom frequency/severity drops)
 */
async function calculateReductionAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
) {
  const symptoms = events.filter((e) => e.event_type === "symptom");
  if (symptoms.length < 4) return;

  // Split into current week and previous week
  const sevenDaysAgo = subDays(new Date(), 7);
  const fourteenDaysAgo = subDays(new Date(), 14);

  const currentWeek = symptoms.filter(
    (e) => new Date(e.event_date) >= sevenDaysAgo
  );
  const previousWeek = symptoms.filter(
    (e) =>
      new Date(e.event_date) >= fourteenDaysAgo &&
      new Date(e.event_date) < sevenDaysAgo
  );

  if (currentWeek.length === 0 || previousWeek.length === 0) return;

  // Check if symptom frequency decreased
  if (currentWeek.length < previousWeek.length) {
    const reduction = previousWeek.length - currentWeek.length;
    const key = "reduction_symptom";
    const existing = achievementMap.get(key);

    const insightText = `Symptom frequency decreased by ${reduction} events compared to the previous week.`;

    if (existing) {
      await supabase
        .from("achievements")
        .update({
          current_streak: reduction,
          last_event_date: currentWeek[0].event_date.split("T")[0],
          status: "active",
          insight_text: insightText,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("achievements").insert({
        user_id: userId,
        type: "reduction",
        category: "symptom",
        start_date: currentWeek[currentWeek.length - 1].event_date.split("T")[0],
        current_streak: reduction,
        last_event_date: currentWeek[0].event_date.split("T")[0],
        insight_text: insightText,
        status: "active",
      });
    }
  }
}

/**
 * Calculate correlation achievements (X behavior → Y improvement)
 */
async function calculateCorrelationAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
) {
  const workouts = events.filter((e) => e.event_type === "workout");
  const symptoms = events.filter((e) => e.event_type === "symptom");

  if (workouts.length < 2 || symptoms.length < 2) return;

  // Check if yoga/stretching correlates with reduced pain symptoms
  const flexibility = workouts.filter(
    (e) =>
      e.activity_type === "yoga" ||
      e.activity_type === "pilates" ||
      e.activity_type === "stretching"
  );

  if (flexibility.length >= 2) {
    // Check if symptoms decreased on days with flexibility work
    const flexDates = new Set(
      flexibility.map((e) => format(new Date(e.event_date), "yyyy-MM-dd"))
    );

    let painReductions = 0;
    flexDates.forEach((date) => {
      const nextDay = format(
        new Date(new Date(date).getTime() + 86400000),
        "yyyy-MM-dd"
      );
      const symptomsOnNextDay = symptoms.filter(
        (s) => format(new Date(s.event_date), "yyyy-MM-dd") === nextDay
      );

      if (symptomsOnNextDay.length === 0 || symptomsOnNextDay.every(s => s.severity === "mild")) {
        painReductions++;
      }
    });

    if (painReductions >= 2) {
      const key = "correlation_flexibility_pain";
      const existing = achievementMap.get(key);

      const activityName =
        flexibility[0].activity_type === "yoga"
          ? "yoga"
          : flexibility[0].activity_type === "pilates"
          ? "pilates"
          : "stretching";

      const insightText = `${
        activityName.charAt(0).toUpperCase() + activityName.slice(1)
      } practice correlates with reduced pain symptoms.`;

      if (existing) {
        await supabase
          .from("achievements")
          .update({
            current_streak: painReductions,
            last_event_date: flexibility[0].event_date.split("T")[0],
            status: "active",
            insight_text: insightText,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("achievements").insert({
          user_id: userId,
          type: "correlation",
          category: "flexibility_pain",
          start_date: flexibility[flexibility.length - 1].event_date.split("T")[0],
          current_streak: painReductions,
          last_event_date: flexibility[0].event_date.split("T")[0],
          insight_text: insightText,
          status: "active",
        });
      }
    }
  }
}

/**
 * Calculate lifestyle shift achievements (intentional absence tracking)
 * Only if behavior is explicitly tracked
 */
async function calculateLifestyleShiftAchievements(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
) {
  // Check for notes explicitly mentioning absence behaviors
  const notes = events.filter((e) => e.event_type === "note");
  
  for (const note of notes) {
    const description = (note.description || "").toLowerCase();
    
    // Check for alcohol-free mentions
    if (description.includes("no alcohol") || description.includes("alcohol-free")) {
      const alcoholFreeNotes = notes.filter(
        (n) =>
          ((n.description || "").toLowerCase().includes("no alcohol") ||
          (n.description || "").toLowerCase().includes("alcohol-free"))
      );

      if (alcoholFreeNotes.length >= 3) {
        const key = "lifestyle_alcohol_free";
        const existing = achievementMap.get(key);
        const streak = calculateConsecutiveStreak(alcoholFreeNotes);

        const insightText = `Intentionally tracking alcohol-free days for ${streak} consecutive days.`;

        if (existing) {
          await supabase
            .from("achievements")
            .update({
              current_streak: streak,
              last_event_date: alcoholFreeNotes[0].event_date.split("T")[0],
              status: "active",
              insight_text: insightText,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("achievements").insert({
            user_id: userId,
            type: "lifestyle",
            category: "alcohol_free",
            start_date: alcoholFreeNotes[alcoholFreeNotes.length - 1].event_date.split("T")[0],
            current_streak: streak,
            last_event_date: alcoholFreeNotes[0].event_date.split("T")[0],
            insight_text: insightText,
            status: "active",
          });
        }
      }
    }
  }
}

/**
 * Expire achievements that no longer have supporting data
 */
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

    // Expire if no activity in the category for 7+ days
    if (lastEventDate && lastEventDate < sevenDaysAgo) {
      await supabase
        .from("achievements")
        .update({ status: "expired" })
        .eq("id", achievement.id);
    }
  }
}

/**
 * Calculate consecutive streak from events
 */
function calculateConsecutiveStreak(events: TimelineEvent[]): number {
  if (events.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(
      events.map((e) => format(new Date(e.event_date), "yyyy-MM-dd"))
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const diff = differenceInDays(
      new Date(uniqueDays[i]),
      new Date(uniqueDays[i + 1])
    );
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generate contextual insight text for consistency achievements
 */
function generateConsistencyInsight(category: string, streak: number): string {
  const insights: Record<string, string> = {
    workout: `Consistent movement tracked for ${streak} consecutive days.`,
    meal: `Regular nutrition logging for ${streak} consecutive days.`,
    medication: `Medication adherence maintained for ${streak} consecutive days.`,
    symptom: `Actively tracking health patterns for ${streak} consecutive days.`,
    note: `Journaling your health rhythm for ${streak} consecutive days.`,
  };

  return insights[category] || `Tracking ${category} consistently for ${streak} days.`;
}
