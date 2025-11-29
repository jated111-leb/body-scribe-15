// Master emoji mapping for the entire app
export const EVENT_EMOJIS = {
  // Main event types
  meal: '🍽️',
  workout: '🏃',
  medication: '💊',
  symptom: '🩺',
  doctor_visit: '👨‍⚕️',
  injury: '🤕',
  note: '📝',
  moment: '✨',
  
  // Moment subtypes
  coffee: '☕',
  tea: '🍵',
  energy_drink: '⚡',
  caffeine_skip: '🚫',
  alcohol_free: '🍷',
  
  // Other types
  sleep: '😴',
  mood: '🧠',
  vitals: '💓',
  water: '💧',
  freetext: '📝',
} as const;

export const EVENT_TYPE_CONFIG = {
  meal: { emoji: '🍽️', label: 'Meals' },
  workout: { emoji: '🏃', label: 'Workouts' },
  medication: { emoji: '💊', label: 'Medications' },
  symptom: { emoji: '🩺', label: 'Symptoms' },
  doctor_visit: { emoji: '👨‍⚕️', label: 'Doctor Visits' },
  injury: { emoji: '🤕', label: 'Injuries' },
  note: { emoji: '📝', label: 'Notes' },
  moment: { emoji: '✨', label: 'Moments' },
  sleep: { emoji: '😴', label: 'Sleep' },
  mood: { emoji: '🧠', label: 'Mood' },
  vitals: { emoji: '💓', label: 'Vitals' },
  water: { emoji: '💧', label: 'Water' },
} as const;
