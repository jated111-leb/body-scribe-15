-- Create achievement_progress table for "almost there" states
CREATE TABLE IF NOT EXISTS public.achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  required_count INTEGER NOT NULL,
  progress_message TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, type, category)
);

-- Enable RLS
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own progress"
  ON public.achievement_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.achievement_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.achievement_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.achievement_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_achievement_preferences table
CREATE TABLE IF NOT EXISTS public.user_achievement_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'daily', 'weekly')),
  progressive_complexity INTEGER DEFAULT 1 CHECK (progressive_complexity BETWEEN 1 AND 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievement_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON public.user_achievement_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_achievement_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_achievement_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_achievement_preferences_updated_at
  BEFORE UPDATE ON public.user_achievement_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create achievement_notifications table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.achievement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('unlock', 'progress', 'shift', 'correlation')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievement_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.achievement_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.achievement_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON public.achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_user_id ON public.achievement_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_achievements_user_status ON public.achievements(user_id, status);