-- Enable realtime for weekly_summaries and timeline_events so UI updates without manual refresh
-- Ensure full row data is published for updates
ALTER TABLE public.weekly_summaries REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_events REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (idempotent via exception handling)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_summaries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;