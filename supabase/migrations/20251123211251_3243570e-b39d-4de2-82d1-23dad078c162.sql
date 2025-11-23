-- Create lifestyle_focus table for user-declared and inferred intentions
CREATE TABLE IF NOT EXISTS public.lifestyle_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  focus_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'user_declared' CHECK (status IN ('active', 'inferred', 'user_declared', 'ignored', 'removed')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_detected TIMESTAMP WITH TIME ZONE,
  insight_reference TEXT,
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, focus_type, status)
);

-- Enable RLS
ALTER TABLE public.lifestyle_focus ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lifestyle focus"
  ON public.lifestyle_focus
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle focus"
  ON public.lifestyle_focus
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifestyle focus"
  ON public.lifestyle_focus
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lifestyle focus"
  ON public.lifestyle_focus
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create lifestyle_achievements table (separate from main achievements)
CREATE TABLE IF NOT EXISTS public.lifestyle_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  focus_id UUID REFERENCES public.lifestyle_focus(id) ON DELETE SET NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('lifestyle_shift', 'avoidance', 'recovery_safe', 'restart')),
  title TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  date_triggered TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lifestyle_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lifestyle achievements"
  ON public.lifestyle_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle achievements"
  ON public.lifestyle_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Dieticians can view client lifestyle data
CREATE POLICY "Dieticians can view client lifestyle focus"
  ON public.lifestyle_focus
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dietician_clients
    WHERE dietician_clients.client_id = lifestyle_focus.user_id
    AND dietician_clients.dietician_id = auth.uid()
    AND dietician_clients.status = 'active'
  ));

CREATE POLICY "Dieticians can view client lifestyle achievements"
  ON public.lifestyle_achievements
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dietician_clients
    WHERE dietician_clients.client_id = lifestyle_achievements.user_id
    AND dietician_clients.dietician_id = auth.uid()
    AND dietician_clients.status = 'active'
  ));

-- Create inferred_patterns table for Aura's pattern detection
CREATE TABLE IF NOT EXISTS public.inferred_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  detection_count INTEGER NOT NULL DEFAULT 1,
  first_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmation_shown BOOLEAN DEFAULT false,
  user_response TEXT CHECK (user_response IN ('accepted', 'ignored', 'dismissed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inferred_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inferred patterns"
  ON public.inferred_patterns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inferred patterns"
  ON public.inferred_patterns
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_lifestyle_focus_updated_at
  BEFORE UPDATE ON public.lifestyle_focus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lifestyle_focus_user_id ON public.lifestyle_focus(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lifestyle_achievements_user_id ON public.lifestyle_achievements(user_id, date_triggered DESC);
CREATE INDEX IF NOT EXISTS idx_inferred_patterns_user_id ON public.inferred_patterns(user_id, confirmation_shown);