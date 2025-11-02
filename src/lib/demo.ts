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

// Default guest events (your personal information)
const getDefaultGuestEvents = (): TimelineEvent[] => [
  {
    id: 'guest-1',
    event_type: 'medication',
    title: 'Suprax (Antibiotic)',
    event_date: new Date(2025, 11, 6, 9, 0, 0).toISOString(),
    medication_name: 'Suprax',
    prescription_start: '2025-12-06',
    prescription_end: '2025-12-11',
    description: 'Taking Suprax for 6 days',
  },
  {
    id: 'guest-2',
    event_type: 'injury',
    title: 'Right Hip labrum tear',
    event_date: new Date(2022, 9, 20, 12, 0, 0).toISOString(),
    description: 'Right Hip labrum tear',
  },
  {
    id: 'guest-3',
    event_type: 'injury',
    title: 'Right shoulder discomfort',
    event_date: new Date(2025, 9, 19, 18, 30, 0).toISOString(),
    description: 'Right shoulder discomfort',
  },
  {
    id: 'guest-4',
    event_type: 'injury',
    title: 'Right shoulder Labrum tear',
    event_date: new Date(2025, 9, 26, 14, 0, 0).toISOString(),
    description: 'Right shoulder Labrum tear',
  },
  {
    id: 'guest-5',
    event_type: 'surgery',
    title: 'Deviated Septum Surgery',
    event_date: new Date(2025, 2, 10, 8, 0, 0).toISOString(),
    description: 'Deviated Septum Surgery',
  },
  {
    id: 'guest-6',
    event_type: 'illness',
    title: 'Diverticulitis - ER Visit',
    event_date: new Date(2025, 9, 6, 20, 0, 0).toISOString(),
    description: 'ER Visit for Diverticulitis',
    severity: 'high',
  },
];

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
