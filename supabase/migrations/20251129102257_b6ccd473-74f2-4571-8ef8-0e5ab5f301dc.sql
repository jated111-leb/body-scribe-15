-- Drop the existing check constraint
ALTER TABLE public.timeline_events 
DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;

-- Re-add with 'moment' included
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
  'supplement',
  'moment'
));