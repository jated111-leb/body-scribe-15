-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Create dietician_profiles table for practice information
CREATE TABLE public.dietician_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  practice_name TEXT,
  specialty_areas TEXT[],
  years_experience INTEGER,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on dietician_profiles
ALTER TABLE public.dietician_profiles ENABLE ROW LEVEL SECURITY;

-- Dieticians can view their own profile
CREATE POLICY "Dieticians can view own profile"
ON public.dietician_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Dieticians can insert their own profile
CREATE POLICY "Dieticians can insert own profile"
ON public.dietician_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Dieticians can update their own profile
CREATE POLICY "Dieticians can update own profile"
ON public.dietician_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_dietician_profiles_updated_at
BEFORE UPDATE ON public.dietician_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();