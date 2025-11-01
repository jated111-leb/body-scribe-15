export type TimelineEvent = {
  id: string;
  user_id?: string | null;
  event_type: 'medication' | 'injury' | 'surgery' | 'illness' | string;
  title: string;
  event_date: string; // ISO string
  description?: string | null;
  medication_name?: string | null;
  prescription_start?: string | null; // YYYY-MM-DD
  prescription_end?: string | null;   // YYYY-MM-DD
  severity?: string | null;
};

// Guest demo events derived from your personal information
export const getGuestEvents = (): TimelineEvent[] => [
  // Medication: Suprax (Antibiotic) Oct 6-12, 2025
  {
    id: 'guest-1',
    event_type: 'medication',
    title: 'Suprax (Antibiotic)',
    event_date: new Date(2025, 9, 6, 9, 0, 0).toISOString(), // Oct is 9 index
    medication_name: 'Suprax',
    prescription_start: '2025-10-06',
    prescription_end: '2025-10-12',
    description: 'Course of antibiotic',
    severity: null,
  },
  // Injuries
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
  // Surgery
  {
    id: 'guest-5',
    event_type: 'surgery',
    title: 'Deviated Septum Surgery',
    event_date: new Date(2025, 2, 10, 8, 0, 0).toISOString(),
    description: 'Deviated Septum Surgery',
  },
  // Inflammation/illness
  {
    id: 'guest-6',
    event_type: 'illness',
    title: 'Diverticulitis - ER Visit',
    event_date: new Date(2025, 9, 6, 20, 0, 0).toISOString(),
    description: 'ER Visit for Diverticulitis',
    severity: 'high',
  },
];

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
