-- Allow dieticians to view their clients' profiles
CREATE POLICY "Dieticians can view their clients profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dietician_clients
      WHERE dietician_clients.client_id = profiles.id
        AND dietician_clients.dietician_id = auth.uid()
        AND dietician_clients.status = 'active'
    )
  );

-- Allow dieticians to view their clients' timeline events
CREATE POLICY "Dieticians can view their clients events"
  ON public.timeline_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dietician_clients
      WHERE dietician_clients.client_id = timeline_events.user_id
        AND dietician_clients.dietician_id = auth.uid()
        AND dietician_clients.status = 'active'
    )
  );

-- Enable realtime for timeline_events
ALTER TABLE public.timeline_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;