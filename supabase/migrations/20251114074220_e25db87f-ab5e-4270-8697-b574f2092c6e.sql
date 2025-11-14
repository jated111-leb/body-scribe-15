-- Create weekly summaries table
CREATE TABLE public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  total_events INTEGER DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  workout_count INTEGER DEFAULT 0,
  medication_count INTEGER DEFAULT 0,
  health_notes TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own summaries"
  ON public.weekly_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries"
  ON public.weekly_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
  ON public.weekly_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
  ON public.weekly_summaries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow dieticians to view their clients' summaries
CREATE POLICY "Dieticians can view their clients summaries"
  ON public.weekly_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dietician_clients
      WHERE dietician_clients.client_id = weekly_summaries.user_id
        AND dietician_clients.dietician_id = auth.uid()
        AND dietician_clients.status = 'active'
    )
  );

-- Enable realtime
ALTER TABLE public.weekly_summaries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_summaries;