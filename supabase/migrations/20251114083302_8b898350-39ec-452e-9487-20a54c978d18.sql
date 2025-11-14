-- Create achievements table with proper user isolation
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  last_event_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Users can manage their own achievements
CREATE POLICY "Users can view own achievements"
  ON public.achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON public.achievements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Dieticians can view their clients achievements
CREATE POLICY "Dieticians can view client achievements"
  ON public.achievements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dietician_clients
      WHERE dietician_clients.client_id = achievements.user_id
        AND dietician_clients.dietician_id = auth.uid()
        AND dietician_clients.status = 'active'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();