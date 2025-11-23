import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subDays, format } from "date-fns";

interface TimelineEvent {
  id: string;
  event_type: string;
  event_date: string;
  description?: string;
  severity?: string;
  activity_type?: string;
  meal_type?: string;
  structured_data?: any;
}

interface LifestyleFocus {
  id: string;
  focus_type: string;
  status: string;
  confidence: number;
}

interface LifestyleAchievement {
  user_id: string;
  focus_id?: string;
  achievement_type: "lifestyle_shift" | "avoidance" | "recovery_safe" | "restart";
  title: string;
  insight_text: string;
  confidence: number;
  metadata?: any;
}

/**
 * Calculate lifestyle achievements based on user's declared goals and inferred patterns
 */
export async function calculateLifestyleAchievements(
  userId: string
): Promise<LifestyleAchievement[]> {
  const achievements: LifestyleAchievement[] = [];

  try {
    console.log('🌱 Starting lifestyle achievement calculation for user:', userId);
    
    // Get user's active lifestyle focuses
    const { data: focuses } = await supabase
      .from("lifestyle_focus")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "user_declared"]);

    if (!focuses || focuses.length === 0) {
      console.log('⚠️ No active lifestyle focuses found');
      return achievements;
    }
    
    console.log(`🎯 Found ${focuses.length} active lifestyle focuses:`, focuses.map(f => f.focus_type));

    // Get recent events (last 14 days)
    const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
    const { data: events } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .gte("event_date", fourteenDaysAgo)
      .order("event_date", { ascending: false });

    if (!events || events.length === 0) {
      console.log('⚠️ No recent events found');
      return achievements;
    }
    
    console.log(`📅 Analyzing ${events.length} recent events`);

    // Process each focus
    for (const focus of focuses as LifestyleFocus[]) {
      console.log(`  → Checking focus: ${focus.focus_type}`);
      
      // Lifestyle Shift achievements
      const shiftAchievements = await detectLifestyleShift(
        userId,
        focus,
        events as TimelineEvent[]
      );
      if (shiftAchievements.length > 0) {
        console.log(`    ✓ Detected ${shiftAchievements.length} lifestyle shift(s)`);
      }
      achievements.push(...shiftAchievements);

      // Avoidance achievements
      const avoidanceAchievements = await detectAvoidance(
        userId,
        focus,
        events as TimelineEvent[]
      );
      if (avoidanceAchievements.length > 0) {
        console.log(`    ✓ Detected ${avoidanceAchievements.length} avoidance(s)`);
      }
      achievements.push(...avoidanceAchievements);

      // Recovery-safe achievements
      const recoverySafeAchievements = await detectRecoverySafe(
        userId,
        focus,
        events as TimelineEvent[]
      );
      if (recoverySafeAchievements.length > 0) {
        console.log(`    ✓ Detected ${recoverySafeAchievements.length} recovery-safe achievement(s)`);
      }
      achievements.push(...recoverySafeAchievements);

      // Restart achievements
      const restartAchievements = await detectRestart(
        userId,
        focus,
        events as TimelineEvent[]
      );
      if (restartAchievements.length > 0) {
        console.log(`    ✓ Detected ${restartAchievements.length} restart(s)`);
      }
      achievements.push(...restartAchievements);
    }

    console.log(`✅ Lifestyle achievement calculation complete: ${achievements.length} total achievements`);

    // Save new achievements
    for (const achievement of achievements) {
      await supabase.from("lifestyle_achievements").insert(achievement);
    }

    return achievements;
  } catch (error) {
    console.error("❌ Error calculating lifestyle achievements:", error);
    return [];
  }
}

/**
 * Detect lifestyle shift: User shows aligned behavior (even just 1 day)
 */
async function detectLifestyleShift(
  userId: string,
  focus: LifestyleFocus,
  events: TimelineEvent[]
): Promise<LifestyleAchievement[]> {
  const achievements: LifestyleAchievement[] = [];

  // Check if we already created a shift achievement for this focus recently
  const { data: existing } = await supabase
    .from("lifestyle_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("focus_id", focus.id)
    .eq("achievement_type", "lifestyle_shift")
    .gte("date_triggered", subDays(new Date(), 3).toISOString())
    .maybeSingle();

  if (existing) return achievements;

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEvents = events.filter((e) => format(new Date(e.event_date), "yyyy-MM-dd") === today);

  let aligned = false;
  let insightText = "";

  switch (focus.focus_type) {
    case "alcohol_free":
      // Check for moment logs or explicit alcohol-free notes
      const alcoholFreeToday = todayEvents.some(
        (e) =>
          (e.event_type === "moment" && 
            typeof e.structured_data === 'object' && 
            e.structured_data !== null && 
            'moment_type' in e.structured_data && 
            e.structured_data.moment_type === "alcohol_free") ||
          (e.event_type === "note" &&
            (e.description?.toLowerCase().includes("no alcohol") ||
              e.description?.toLowerCase().includes("alcohol-free")))
      );
      if (alcoholFreeToday) {
        aligned = true;
        insightText =
          "You chose no alcohol today — Aura will observe how this affects your sleep rhythm.";
      }
      break;

    case "reduce_sugar":
      // Check for low-sugar meal tags or mentions
      const lowSugarMeals = todayEvents.filter(
        (e) =>
          e.event_type === "meal" &&
          (typeof e.structured_data === 'object' && 
            e.structured_data !== null && 
            'sugar_level' in e.structured_data && 
            e.structured_data.sugar_level === "low" ||
            e.description?.toLowerCase().includes("no sugar") ||
            e.description?.toLowerCase().includes("low sugar") ||
            e.description?.toLowerCase().includes("sugar-free"))
      );
      if (lowSugarMeals.length > 0) {
        aligned = true;
        insightText = "Low-sugar choices today — let's observe how your energy responds.";
      }
      break;

    case "improve_sleep":
      // Check for early bed time notes
      const sleepNotes = todayEvents.filter(
        (e) =>
          e.event_type === "note" &&
          (e.description?.toLowerCase().includes("early bed") ||
            e.description?.toLowerCase().includes("sleep") ||
            e.description?.toLowerCase().includes("rest"))
      );
      if (sleepNotes.length > 0) {
        aligned = true;
        insightText = "Earlier rest tonight — Aura will watch how this shapes your rhythm.";
      }
      break;

    case "reduce_caffeine":
      // Check for caffeine skip moment or caffeine-free mentions
      const caffeineFree = todayEvents.some(
        (e) =>
          (e.event_type === "moment" && 
            typeof e.structured_data === 'object' && 
            e.structured_data !== null && 
            'moment_type' in e.structured_data && 
            e.structured_data.moment_type === "caffeine_skip") ||
          (e.event_type === "note" &&
            (e.description?.toLowerCase().includes("no caffeine") ||
              e.description?.toLowerCase().includes("caffeine-free")))
      );
      if (caffeineFree) {
        aligned = true;
        insightText = "Caffeine-free today — we'll observe your sleep quality tonight.";
      }
      break;

    case "reduce_late_meals":
      // Check for early dinner or no late meal notes
      const earlyMeals = todayEvents.some(
        (e) =>
          e.event_type === "note" &&
          (e.description?.toLowerCase().includes("early dinner") ||
            e.description?.toLowerCase().includes("no late meal"))
      );
      if (earlyMeals) {
        aligned = true;
        insightText = "Earlier eating window today — digestion will appreciate the rest.";
      }
      break;

    case "gut_health":
      // Check for gut-friendly foods
      const gutFriendly = todayEvents.some(
        (e) =>
          e.event_type === "meal" &&
          (e.description?.toLowerCase().includes("fiber") ||
            e.description?.toLowerCase().includes("vegetables") ||
            e.description?.toLowerCase().includes("probiotic"))
      );
      if (gutFriendly) {
        aligned = true;
        insightText = "Gut-supporting choices today — steady changes reshape your microbiome.";
      }
      break;
  }

  if (aligned) {
    achievements.push({
      user_id: userId,
      focus_id: focus.id,
      achievement_type: "lifestyle_shift",
      title: "Intention in Action",
      insight_text: insightText,
      confidence: 0.6,
      metadata: { focus_type: focus.focus_type, date: today },
    });
  }

  return achievements;
}

/**
 * Detect avoidance: User avoided a tracked harmful behavior
 */
async function detectAvoidance(
  userId: string,
  focus: LifestyleFocus,
  events: TimelineEvent[]
): Promise<LifestyleAchievement[]> {
  const achievements: LifestyleAchievement[] = [];

  const { data: existing } = await supabase
    .from("lifestyle_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("focus_id", focus.id)
    .eq("achievement_type", "avoidance")
    .gte("date_triggered", subDays(new Date(), 1).toISOString())
    .maybeSingle();

  if (existing) return achievements;

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEvents = events.filter((e) => format(new Date(e.event_date), "yyyy-MM-dd") === today);

  let avoided = false;
  let insightText = "";

  if (focus.focus_type === "reduce_late_meals") {
    // Check if last meal was before 8pm or explicitly noted
    const lateMealAvoided = todayEvents.some(
      (e) =>
        e.event_type === "note" &&
        (e.description?.toLowerCase().includes("no late meal") ||
          e.description?.toLowerCase().includes("stopped eating early"))
    );
    if (lateMealAvoided) {
      avoided = true;
      insightText = "No late meals today — easier digestion expected tonight.";
    }
  }

  if (focus.focus_type === "reduce_caffeine") {
    const caffeineFree = todayEvents.some(
      (e) =>
        e.description?.toLowerCase().includes("no coffee") ||
        e.description?.toLowerCase().includes("skipped caffeine")
    );
    if (caffeineFree) {
      avoided = true;
      insightText = "No caffeine today — calmer nervous system ahead.";
    }
  }

  if (avoided) {
    achievements.push({
      user_id: userId,
      focus_id: focus.id,
      achievement_type: "avoidance",
      title: "Safe Choice",
      insight_text: insightText,
      confidence: 0.7,
      metadata: { focus_type: focus.focus_type, date: today },
    });
  }

  return achievements;
}

/**
 * Detect recovery-safe: User avoided risky activity due to injury/symptom
 */
async function detectRecoverySafe(
  userId: string,
  focus: LifestyleFocus,
  events: TimelineEvent[]
): Promise<LifestyleAchievement[]> {
  const achievements: LifestyleAchievement[] = [];

  // Check for recent symptoms or injuries
  const threeDaysAgo = subDays(new Date(), 3);
  const recentSymptoms = events.filter(
    (e) =>
      e.event_type === "symptom" &&
      new Date(e.event_date) >= threeDaysAgo &&
      (e.severity === "severe" || e.severity === "moderate")
  );

  if (recentSymptoms.length === 0) return achievements;

  const { data: existing } = await supabase
    .from("lifestyle_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_type", "recovery_safe")
    .gte("date_triggered", subDays(new Date(), 2).toISOString())
    .maybeSingle();

  if (existing) return achievements;

  const today = format(new Date(), "yyyy-MM-dd");
  const todayWorkouts = events.filter(
    (e) => e.event_type === "workout" && format(new Date(e.event_date), "yyyy-MM-dd") === today
  );

  // Check if user avoided high-intensity or risky movements
  const avoidedRiskyActivity = todayWorkouts.length === 0 || todayWorkouts.every((w) => w.activity_type === "yoga" || w.activity_type === "stretching" || w.activity_type === "walking");

  const restNote = events.some(
    (e) =>
      e.event_type === "note" &&
      format(new Date(e.event_date), "yyyy-MM-dd") === today &&
      (e.description?.toLowerCase().includes("rest day") ||
        e.description?.toLowerCase().includes("taking it easy") ||
        e.description?.toLowerCase().includes("recovery"))
  );

  if (avoidedRiskyActivity || restNote) {
    const symptomType = recentSymptoms[0].description || "discomfort";
    achievements.push({
      user_id: userId,
      achievement_type: "recovery_safe",
      title: "Recovery-Minded",
      insight_text: `You honored your body's need for rest — stronger recovery from ${symptomType} ahead.`,
      confidence: 0.75,
      metadata: { symptom_type: symptomType, date: today },
    });
  }

  return achievements;
}

/**
 * Detect restart: User resumed activity after ≥3 days break
 */
async function detectRestart(
  userId: string,
  focus: LifestyleFocus,
  events: TimelineEvent[]
): Promise<LifestyleAchievement[]> {
  const achievements: LifestyleAchievement[] = [];

  const { data: existing } = await supabase
    .from("lifestyle_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("focus_id", focus.id)
    .eq("achievement_type", "restart")
    .gte("date_triggered", subDays(new Date(), 7).toISOString())
    .maybeSingle();

  if (existing) return achievements;

  // Detect category based on focus type
  let categoryToCheck = "";
  if (focus.focus_type.includes("workout") || focus.focus_type.includes("movement")) {
    categoryToCheck = "workout";
  } else if (focus.focus_type.includes("meal") || focus.focus_type.includes("nutrition")) {
    categoryToCheck = "meal";
  }

  if (!categoryToCheck) return achievements;

  const categoryEvents = events.filter((e) => e.event_type === categoryToCheck);
  if (categoryEvents.length === 0) return achievements;

  // Sort by date
  const sortedEvents = categoryEvents.sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const today = new Date();
  const mostRecentEvent = new Date(sortedEvents[0].event_date);

  // Check if today's event is a restart (≥3 days since previous)
  if (differenceInDays(today, mostRecentEvent) <= 1 && sortedEvents.length > 1) {
    const previousEvent = new Date(sortedEvents[1].event_date);
    const daysSinceLastActivity = differenceInDays(mostRecentEvent, previousEvent);

    if (daysSinceLastActivity >= 3) {
      const activityLabel = categoryToCheck === "workout" ? "movement" : "tracking";
      achievements.push({
        user_id: userId,
        focus_id: focus.id,
        achievement_type: "restart",
        title: "Welcome Back",
        insight_text: `You returned to ${activityLabel} — we'll continue learning your rhythm.`,
        confidence: 0.65,
        metadata: {
          category: categoryToCheck,
          days_away: daysSinceLastActivity,
          date: format(today, "yyyy-MM-dd"),
        },
      });
    }
  }

  return achievements;
}

/**
 * Infer lifestyle patterns from user behavior (for Aura inference)
 */
export async function inferLifestylePatterns(userId: string): Promise<
  {
    pattern_type: string;
    detection_count: number;
    confidence: number;
    message: string;
  }[]
> {
  const patterns: {
    pattern_type: string;
    detection_count: number;
    confidence: number;
    message: string;
  }[] = [];

  try {
    const tenDaysAgo = subDays(new Date(), 10).toISOString();
    const { data: events } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .gte("event_date", tenDaysAgo)
      .order("event_date", { ascending: false });

    if (!events || events.length === 0) return patterns;

    // Detect alcohol-free pattern (3+ moments or mentions)
    const alcoholFreeMentions = events.filter(
      (e) =>
        (e.event_type === "moment" && 
          typeof e.structured_data === 'object' && 
          e.structured_data !== null && 
          'moment_type' in e.structured_data && 
          e.structured_data.moment_type === "alcohol_free") ||
        (e.event_type === "note" &&
          (e.description?.toLowerCase().includes("no alcohol") ||
            e.description?.toLowerCase().includes("alcohol-free")))
    );
    if (alcoholFreeMentions.length >= 3) {
      patterns.push({
        pattern_type: "alcohol_free",
        detection_count: alcoholFreeMentions.length,
        confidence: Math.min(0.5 + alcoholFreeMentions.length * 0.1, 0.9),
        message: "It looks like you're choosing alcohol-free days. Want Aura to observe this?",
      });
    }

    // Detect caffeine reduction pattern
    const caffeineSkips = events.filter(
      (e) => e.event_type === "moment" && 
        typeof e.structured_data === 'object' && 
        e.structured_data !== null && 
        'moment_type' in e.structured_data && 
        e.structured_data.moment_type === "caffeine_skip"
    );
    if (caffeineSkips.length >= 3) {
      patterns.push({
        pattern_type: "reduce_caffeine",
        detection_count: caffeineSkips.length,
        confidence: Math.min(0.5 + caffeineSkips.length * 0.1, 0.9),
        message: "It looks like you're reducing caffeine. Want Aura to observe this?",
      });
    }

    // Detect tea substitution pattern
    const teaMoments = events.filter(
      (e) => e.event_type === "moment" && 
        typeof e.structured_data === 'object' && 
        e.structured_data !== null && 
        'moment_type' in e.structured_data && 
        e.structured_data.moment_type === "tea"
    );
    if (teaMoments.length >= 3) {
      patterns.push({
        pattern_type: "reduce_caffeine",
        detection_count: teaMoments.length,
        confidence: Math.min(0.4 + teaMoments.length * 0.08, 0.8),
        message: "It looks like you're choosing tea more often. Want Aura to observe this shift?",
      });
    }

    // Detect early sleep pattern
    const earlySleepMentions = events.filter(
      (e) =>
        e.event_type === "note" &&
        (e.description?.toLowerCase().includes("early bed") ||
          e.description?.toLowerCase().includes("earlier sleep"))
    );
    if (earlySleepMentions.length >= 3) {
      patterns.push({
        pattern_type: "improve_sleep",
        detection_count: earlySleepMentions.length,
        confidence: Math.min(0.5 + earlySleepMentions.length * 0.1, 0.9),
        message: "It looks like you're choosing earlier sleep. Want Aura to observe this?",
      });
    }

    // Detect high-vegetable meals or low-sugar patterns
    const vegMeals = events.filter(
      (e) =>
        e.event_type === "meal" &&
        (e.description?.toLowerCase().includes("vegetables") ||
          e.description?.toLowerCase().includes("salad") ||
          e.description?.toLowerCase().includes("greens"))
    );
    if (vegMeals.length >= 3) {
      patterns.push({
        pattern_type: "gut_health",
        detection_count: vegMeals.length,
        confidence: Math.min(0.5 + vegMeals.length * 0.1, 0.9),
        message:
          "It looks like you're increasing vegetable intake. Want Aura to observe gut health?",
      });
    }

    // Detect low-sugar meal pattern
    const lowSugarMeals = events.filter(
      (e) => e.event_type === "meal" && 
        typeof e.structured_data === 'object' && 
        e.structured_data !== null && 
        'sugar_level' in e.structured_data && 
        e.structured_data.sugar_level === "low"
    );
    if (lowSugarMeals.length >= 3) {
      patterns.push({
        pattern_type: "reduce_sugar",
        detection_count: lowSugarMeals.length,
        confidence: Math.min(0.5 + lowSugarMeals.length * 0.1, 0.9),
        message: "It looks like you're choosing lower sugar meals. Want Aura to observe this?",
      });
    }

    // Store inferred patterns
    for (const pattern of patterns) {
      await supabase
        .from("inferred_patterns")
        .upsert(
          {
            user_id: userId,
            pattern_type: pattern.pattern_type,
            detection_count: pattern.detection_count,
            last_detected: new Date().toISOString(),
          },
          { onConflict: "user_id,pattern_type" }
        );
    }

    return patterns;
  } catch (error) {
    console.error("Error inferring lifestyle patterns:", error);
    return [];
  }
}