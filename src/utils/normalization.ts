/**
 * Type Normalization Utilities
 * 
 * Ensures all timeline events use canonical enum values that match
 * the database constraints. All values are lowercase and snake_case.
 */

// Canonical Event Types - NEVER modify without database migration
export const CANONICAL_EVENT_TYPES = [
  'meal',
  'workout',
  'medication',
  'symptom',
  'doctor_visit',
  'injury',
  'note',
] as const;

export type CanonicalEventType = typeof CANONICAL_EVENT_TYPES[number];

// Canonical Meal Types
export const CANONICAL_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'beverage',
  'dessert',
] as const;

export type CanonicalMealType = typeof CANONICAL_MEAL_TYPES[number];

// Canonical Workout Types
export const CANONICAL_WORKOUT_TYPES = [
  'aerobic',
  'strength',
  'mobility',
  'stretching',
  'hiit',
  'walking',
] as const;

export type CanonicalWorkoutType = typeof CANONICAL_WORKOUT_TYPES[number];

// Canonical Symptom Types
export const CANONICAL_SYMPTOM_TYPES = [
  'pain',
  'fatigue',
  'headache',
  'injury_related',
  'digestive',
  'respiratory',
  'skin',
  'mood',
  'sleep',
] as const;

export type CanonicalSymptomType = typeof CANONICAL_SYMPTOM_TYPES[number];

// Event Type Mappings
const EVENT_TYPE_MAPPINGS: Record<string, CanonicalEventType> = {
  // Direct mappings
  'meal': 'meal',
  'meals': 'meal',
  'food': 'meal',
  'eating': 'meal',
  'ate': 'meal',
  
'workout': 'workout',
'exercise': 'workout',
'activity': 'workout',
'training': 'workout',
'gym': 'workout',
  
  'medication': 'medication',
  'medicine': 'medication',
  'pill': 'medication',
  'drug': 'medication',
  'prescription': 'medication',
  
  'symptom': 'symptom',
  'symptoms': 'symptom',
  'feeling': 'symptom',
  'pain': 'symptom',
  
  'doctor': 'doctor_visit',
  'doctor visit': 'doctor_visit',
  'appointment': 'doctor_visit',
  'checkup': 'doctor_visit',
  'consultation': 'doctor_visit',
  
  'injury': 'injury',
  'hurt': 'injury',
  'injured': 'injury',
  
  'note': 'note',
  'notes': 'note',
  'quick log': 'note',
  'log': 'note',
};

// Meal Type Mappings
const MEAL_TYPE_MAPPINGS: Record<string, CanonicalMealType> = {
  'breakfast': 'breakfast',
  'brunch': 'lunch',
  'lunch': 'lunch',
  'dinner': 'dinner',
  'supper': 'dinner',
  'snack': 'snack',
  'late-night snack': 'snack',
  'midnight snack': 'snack',
  'beverage': 'beverage',
  'drink': 'beverage',
  'coffee': 'beverage',
  'tea': 'beverage',
  'juice': 'beverage',
  'smoothie': 'beverage',
  'dessert': 'dessert',
  'sweet': 'dessert',
  'cake': 'dessert',
  'cookie': 'dessert',
  'ice cream': 'dessert',
};

// Workout Type Mappings
const WORKOUT_TYPE_MAPPINGS: Record<string, CanonicalWorkoutType> = {
  'aerobic': 'aerobic',
  'cardio': 'aerobic',
  'running': 'aerobic',
  'cycling': 'aerobic',
  'swimming': 'aerobic',
  
  'strength': 'strength',
  'weights': 'strength',
  'lifting': 'strength',
  'resistance': 'strength',
  'functional strength': 'strength',
  
  'mobility': 'mobility',
  'flexibility': 'mobility',
  
  'stretching': 'stretching',
  'stretch': 'stretching',
  
  'hiit': 'hiit',
  'high intensity': 'hiit',
  'interval': 'hiit',
  
  'walking': 'walking',
  'walk': 'walking',
  'stroll': 'walking',
  
  'yoga': 'mobility',
  'pilates': 'mobility',
  'basketball': 'aerobic',
  'soccer': 'aerobic',
  'tennis': 'aerobic',
};

// Symptom Type Mappings
const SYMPTOM_TYPE_MAPPINGS: Record<string, CanonicalSymptomType> = {
  'pain': 'pain',
  'ache': 'pain',
  'sore': 'pain',
  'hurt': 'pain',
  'shoulder pain': 'pain',
  'neck pain': 'pain',
  'back pain': 'pain',
  'headache': 'headache',
  'migraine': 'headache',
  
  'fatigue': 'fatigue',
  'tired': 'fatigue',
  'exhausted': 'fatigue',
  'low energy': 'fatigue',
  
  'injury': 'injury_related',
  'injury related': 'injury_related',
  'sprain': 'injury_related',
  'strain': 'injury_related',
  
  'digestive': 'digestive',
  'stomach': 'digestive',
  'bloated': 'digestive',
  'nausea': 'digestive',
  'indigestion': 'digestive',
  
  'respiratory': 'respiratory',
  'breathing': 'respiratory',
  'cough': 'respiratory',
  'congestion': 'respiratory',
  
  'skin': 'skin',
  'rash': 'skin',
  'itchy': 'skin',
  'acne': 'skin',
  
  'mood': 'mood',
  'anxious': 'mood',
  'anxiety': 'mood',
  'depressed': 'mood',
  'stressed': 'mood',
  
  'sleep': 'sleep',
  'insomnia': 'sleep',
  'bad sleep': 'sleep',
  'restless': 'sleep',
};

/**
 * Normalize event type to canonical form
 */
export function normalizeEventType(input: string): CanonicalEventType {
  const normalized = input.toLowerCase().trim();
  return EVENT_TYPE_MAPPINGS[normalized] || 'note';
}

/**
 * Normalize meal type to canonical form
 */
export function normalizeMealType(input: string): CanonicalMealType {
  const normalized = input.toLowerCase().trim();
  return MEAL_TYPE_MAPPINGS[normalized] || 'snack';
}

/**
 * Normalize workout type to canonical form
 */
export function normalizeWorkoutType(input: string): CanonicalWorkoutType {
  const normalized = input.toLowerCase().trim();
  return WORKOUT_TYPE_MAPPINGS[normalized] || 'aerobic';
}

/**
 * Normalize symptom type to canonical form
 */
export function normalizeSymptomType(input: string): CanonicalSymptomType {
  const normalized = input.toLowerCase().trim();
  
  // Try to infer from text
  for (const [key, value] of Object.entries(SYMPTOM_TYPE_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'pain'; // Default fallback
}

/**
 * Validate that a value is a canonical event type
 */
export function isValidEventType(value: string): value is CanonicalEventType {
  return CANONICAL_EVENT_TYPES.includes(value as CanonicalEventType);
}

/**
 * Validate that a value is a canonical meal type
 */
export function isValidMealType(value: string): value is CanonicalMealType {
  return CANONICAL_MEAL_TYPES.includes(value as CanonicalMealType);
}

/**
 * Validate that a value is a canonical workout type
 */
export function isValidWorkoutType(value: string): value is CanonicalWorkoutType {
  return CANONICAL_WORKOUT_TYPES.includes(value as CanonicalWorkoutType);
}

/**
 * Validate that a value is a canonical symptom type
 */
export function isValidSymptomType(value: string): value is CanonicalSymptomType {
  return CANONICAL_SYMPTOM_TYPES.includes(value as CanonicalSymptomType);
}

/**
 * Get display name for canonical event type
 */
export function getEventTypeDisplay(type: CanonicalEventType): string {
  const displays: Record<CanonicalEventType, string> = {
    'meal': 'Meal',
    'workout': 'Workout',
    'medication': 'Medication',
    'symptom': 'Symptom',
    'doctor_visit': 'Doctor Visit',
    'injury': 'Injury',
    'note': 'Note',
  };
  return displays[type];
}

/**
 * Get display name for canonical meal type
 */
export function getMealTypeDisplay(type: CanonicalMealType): string {
  const displays: Record<CanonicalMealType, string> = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
    'snack': 'Snack',
    'beverage': 'Beverage',
    'dessert': 'Dessert',
  };
  return displays[type];
}
