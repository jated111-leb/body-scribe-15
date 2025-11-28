-- Create dietician_notes table for private notes on weekly summaries
CREATE TABLE public.dietician_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_summary_id UUID REFERENCES public.weekly_summaries(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on dietician_notes
ALTER TABLE public.dietician_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Dieticians can manage their own notes for their clients
CREATE POLICY "Dieticians can manage their notes"
ON public.dietician_notes FOR ALL
USING (
  auth.uid() = dietician_id 
  AND has_role(auth.uid(), 'dietician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.dietician_clients 
    WHERE client_id = dietician_notes.client_id 
    AND dietician_id = auth.uid()
    AND status = 'active'
  )
)
WITH CHECK (
  auth.uid() = dietician_id 
  AND has_role(auth.uid(), 'dietician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.dietician_clients 
    WHERE client_id = dietician_notes.client_id 
    AND dietician_id = auth.uid()
    AND status = 'active'
  )
);

-- Create client_alerts table for tracking alerts
CREATE TABLE public.client_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ
);

-- Enable RLS on client_alerts
ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;

-- RLS: Dieticians can manage their alerts
CREATE POLICY "Dieticians can manage their alerts"
ON public.client_alerts FOR ALL
USING (auth.uid() = dietician_id AND has_role(auth.uid(), 'dietician'::app_role))
WITH CHECK (auth.uid() = dietician_id AND has_role(auth.uid(), 'dietician'::app_role));

-- Add is_pinned column to dietician_clients
ALTER TABLE public.dietician_clients ADD COLUMN is_pinned BOOLEAN DEFAULT false;

-- Create trigger for updating dietician_notes updated_at
CREATE TRIGGER update_dietician_notes_updated_at
BEFORE UPDATE ON public.dietician_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_dietician_notes_dietician ON public.dietician_notes(dietician_id);
CREATE INDEX idx_dietician_notes_client ON public.dietician_notes(client_id);
CREATE INDEX idx_dietician_notes_summary ON public.dietician_notes(weekly_summary_id);
CREATE INDEX idx_client_alerts_dietician ON public.client_alerts(dietician_id);
CREATE INDEX idx_client_alerts_client ON public.client_alerts(client_id);
CREATE INDEX idx_client_alerts_dismissed ON public.client_alerts(is_dismissed);
CREATE INDEX idx_dietician_clients_pinned ON public.dietician_clients(is_pinned);