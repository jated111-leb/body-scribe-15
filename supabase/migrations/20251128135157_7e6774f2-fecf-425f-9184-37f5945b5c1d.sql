-- Add source field to timeline_events to prevent data loss
ALTER TABLE public.timeline_events 
ADD COLUMN source TEXT DEFAULT 'manual' 
CHECK (source IN ('manual', 'settings', 'import'));

-- Create index for faster queries on source field
CREATE INDEX idx_timeline_events_source ON public.timeline_events(source);

-- Add comment explaining the field
COMMENT ON COLUMN public.timeline_events.source IS 'Distinguishes between manually entered events, settings-managed events, and imported data';
