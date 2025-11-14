import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfDay } from "date-fns";

interface TimelineEvent {
  event_type: string;
  event_date: string;
  metadata?: any;
}

export async function updateAchievementsForUser(userId: string) {
  try {
    // Get recent timeline events for the user
    const { data: events, error: eventsError } = await supabase
      .from("timeline_events")
      .select("event_type, event_date, title, description")
      .eq("user_id", userId)
      .order("event_date", { ascending: false })
      .limit(100);

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) return;

    // Get existing achievements
    const { data: existingAchievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", userId);

    const achievementMap = new Map(
      existingAchievements?.map((a) => [a.type, a]) || []
    );

    // Track streaks based on event patterns
    await trackAlcoholFreeStreak(userId, events, achievementMap);
    await trackSugarFreeStreak(userId, events, achievementMap);
    await trackExerciseStreak(userId, events, achievementMap);
    await trackSupplementConsistency(userId, events, achievementMap);
    await trackSymptomTracking(userId, events, achievementMap);
  } catch (error) {
    console.error("Error updating achievements:", error);
  }
}

async function trackAlcoholFreeStreak(
  userId: string,
  events: any[],
  achievementMap: Map<string, any>
) {
  // Check for alcohol-related events
  const alcoholEvents = events.filter(
    (e) =>
      e.event_type === "meal" &&
      (e.title?.toLowerCase().includes("alcohol") ||
        e.description?.toLowerCase().includes("alcohol"))
  );

  const hasRecentAlcohol = alcoholEvents.some((e) => {
    const daysDiff = differenceInDays(new Date(), new Date(e.event_date));
    return daysDiff <= 1;
  });

  if (!hasRecentAlcohol) {
    await updateOrCreateAchievement(
      userId,
      "alcohol_free",
      events,
      achievementMap,
      (e) => !e.title?.toLowerCase().includes("alcohol")
    );
  }
}

async function trackSugarFreeStreak(
  userId: string,
  events: any[],
  achievementMap: Map<string, any>
) {
  const sugarEvents = events.filter(
    (e) =>
      e.event_type === "meal" &&
      (e.title?.toLowerCase().includes("sugar") ||
        e.title?.toLowerCase().includes("dessert") ||
        e.title?.toLowerCase().includes("candy"))
  );

  const hasRecentSugar = sugarEvents.some((e) => {
    const daysDiff = differenceInDays(new Date(), new Date(e.event_date));
    return daysDiff <= 1;
  });

  if (!hasRecentSugar && events.some((e) => e.event_type === "meal")) {
    await updateOrCreateAchievement(
      userId,
      "sugar_free",
      events.filter((e) => e.event_type === "meal"),
      achievementMap,
      (e) => !e.title?.toLowerCase().includes("sugar")
    );
  }
}

async function trackExerciseStreak(
  userId: string,
  events: any[],
  achievementMap: Map<string, any>
) {
  const exerciseEvents = events.filter((e) => e.event_type === "exercise");

  if (exerciseEvents.length > 0) {
    await updateOrCreateAchievement(
      userId,
      "exercise_streak",
      exerciseEvents,
      achievementMap
    );
  }
}

async function trackSupplementConsistency(
  userId: string,
  events: any[],
  achievementMap: Map<string, any>
) {
  const supplementEvents = events.filter((e) => e.event_type === "supplement");

  if (supplementEvents.length > 0) {
    await updateOrCreateAchievement(
      userId,
      "supplement_consistency",
      supplementEvents,
      achievementMap
    );
  }
}

async function trackSymptomTracking(
  userId: string,
  events: any[],
  achievementMap: Map<string, any>
) {
  const symptomEvents = events.filter((e) => e.event_type === "symptom");

  if (symptomEvents.length > 0) {
    await updateOrCreateAchievement(
      userId,
      "symptom_tracking",
      symptomEvents,
      achievementMap
    );
  }
}

async function updateOrCreateAchievement(
  userId: string,
  type: string,
  events: any[],
  achievementMap: Map<string, any>,
  filterFn?: (e: any) => boolean
) {
  const filteredEvents = filterFn ? events.filter(filterFn) : events;
  if (filteredEvents.length === 0) return;

  // Calculate streak
  const sortedEvents = filteredEvents.sort(
    (a, b) =>
      new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  let currentStreak = 0;
  let lastDate = startOfDay(new Date());

  for (const event of sortedEvents) {
    const eventDate = startOfDay(new Date(event.event_date));
    const daysDiff = differenceInDays(lastDate, eventDate);

    if (daysDiff <= 1) {
      currentStreak++;
      lastDate = eventDate;
    } else {
      break;
    }
  }

  const existing = achievementMap.get(type);
  const startDate = sortedEvents[sortedEvents.length - 1].event_date;

  if (existing) {
    // Update existing achievement
    await supabase
      .from("achievements")
      .update({
        current_streak: currentStreak,
        last_event_date: sortedEvents[0].event_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new achievement
    await supabase.from("achievements").insert({
      user_id: userId,
      type,
      start_date: startDate,
      current_streak: currentStreak,
      last_event_date: sortedEvents[0].event_date,
    });
  }
}
