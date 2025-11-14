-- Drop the old check constraint
ALTER TABLE public.timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;

-- Add updated check constraint with more event types including 'note'
ALTER TABLE public.timeline_events
ADD CONSTRAINT timeline_events_event_type_check 
CHECK (event_type IN (
  'meal',
  'workout', 
  'medication',
  'doctor_visit',
  'symptom',
  'physiotherapy',
  'injury',
  'freetext',
  'note',
  'appointment',
  'lab_result',
  'vitals',
  'mood',
  'sleep',
  'water',
  'supplement'
));