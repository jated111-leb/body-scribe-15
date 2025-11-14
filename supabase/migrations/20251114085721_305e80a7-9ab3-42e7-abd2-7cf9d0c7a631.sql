-- Add structured_data field to support flexible metadata for all entry types
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS structured_data jsonb DEFAULT '{}'::jsonb;