import { supabase } from "@/integrations/supabase/client";

export type TimelineEvent = {
  id: string;
  user_id?: string | null;
  event_type: 'medication' | 'injury' | 'surgery' | 'illness' | 'workout' | string;
  title: string;
  event_date: string; // ISO string
  description?: string | null;
  medication_name?: string | null;
  prescription_start?: string | null; // YYYY-MM-DD
  prescription_end?: string | null;   // YYYY-MM-DD
  severity?: string | null;
  activity_type?: string | null;
  duration?: number | null;
  attachment_urls?: string[] | null;
  created_at?: string | null;
  meal_type?: string | null;
};

// Get guest events from localStorage or defaults
const getGuestEventsFromStorage = (): TimelineEvent[] => {
  const stored = localStorage.getItem('guestProfile');
  if (!stored) return getDefaultGuestEvents();

  try {
    const data = JSON.parse(stored);
    const events: TimelineEvent[] = [];

    // Build events from stored data
    if (data.pastMedications) {
      data.pastMedications.forEach((med: any, idx: number) => {
        if (med.name && med.startDate) {
          events.push({
            id: `guest-med-${idx}`,
            event_type: 'medication',
            title: med.name,
            event_date: med.startDate,
            medication_name: med.name,
            prescription_start: med.startDate?.split('T')[0],
            prescription_end: med.endDate?.split('T')[0] || null,
          });
        }
      });
    }

    if (data.pastInjuries) {
      data.pastInjuries.forEach((injury: any, idx: number) => {
        if (injury.name && injury.date) {
          events.push({
            id: `guest-injury-${idx}`,
            event_type: 'injury',
            title: injury.name,
            event_date: injury.date,
            description: injury.name,
          });
        }
      });
    }

    if (data.pastSurgeries) {
      data.pastSurgeries.forEach((surgery: any, idx: number) => {
        if (surgery.name && surgery.date) {
          events.push({
            id: `guest-surgery-${idx}`,
            event_type: 'surgery',
            title: surgery.name,
            event_date: surgery.date,
            description: surgery.name,
          });
        }
      });
    }

    if (data.pastInflammations) {
      data.pastInflammations.forEach((inflammation: any, idx: number) => {
        if (inflammation.name && inflammation.date) {
          events.push({
            id: `guest-inflammation-${idx}`,
            event_type: 'illness',
            title: inflammation.name,
            event_date: inflammation.date,
            description: inflammation.name,
            severity: 'high',
          });
        }
      });
    }

    if (data.workoutActivities) {
      data.workoutActivities.forEach((workout: any, idx: number) => {
        if (workout.activityType && workout.date) {
          const durationInMinutes = workout.duration ? parseInt(workout.duration.replace(/[^\d]/g, '')) * 60 : null;
          events.push({
            id: `guest-workout-${idx}`,
            event_type: 'workout',
            title: workout.activityType,
            event_date: workout.date,
            activity_type: workout.activityType,
            duration: durationInMinutes,
            description: workout.location,
          });
        }
      });
    }

    return events.length > 0 ? events : getDefaultGuestEvents();
  } catch (e) {
    console.error('Error parsing guest profile:', e);
    return getDefaultGuestEvents();
  }
};

// Default guest events (empty for new users)
const getDefaultGuestEvents = (): TimelineEvent[] => [];

export const getGuestEvents = (): TimelineEvent[] => getGuestEventsFromStorage();

export const getGuestEventDates = (): Date[] =>
  getGuestEvents().map((e) => new Date(e.event_date));

export const getGuestEventsForRange = (start: Date, end: Date): TimelineEvent[] => {
  const s = start.getTime();
  const e = end.getTime();
  return getGuestEvents().filter((ev) => {
    const t = new Date(ev.event_date).getTime();
    return t >= s && t <= e;
  });
};

// Test data seeding functions
interface SeedOptions {
  clientCount?: number;
  dieticianCount?: number;
  eventsPerUser?: number;
}

interface SeedResult {
  success: boolean;
  message: string;
  credentials?: {
    password: string;
  };
  userIds?: {
    clients: string[];
    dieticians: string[];
  };
  error?: string;
}

export async function seedTestData(options: SeedOptions = {}): Promise<SeedResult> {
  const { clientCount = 3, dieticianCount = 1, eventsPerUser = 30 } = options;

  const { data, error } = await supabase.functions.invoke('seed-test-data', {
    body: { clientCount, dieticianCount, eventsPerUser }
  });

  if (error) {
    return { success: false, message: 'Failed to seed test data', error: error.message };
  }

  return data as SeedResult;
}

// Quick function to seed default test data
export async function quickSeed(): Promise<SeedResult> {
  return seedTestData({ clientCount: 3, dieticianCount: 1, eventsPerUser: 30 });
}
