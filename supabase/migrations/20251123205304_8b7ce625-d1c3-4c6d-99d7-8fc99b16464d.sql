-- Update achievements table schema for insight-driven system
ALTER TABLE public.achievements
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS insight_text text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'expired'));

-- Add index for active achievements queries
CREATE INDEX IF NOT EXISTS idx_achievements_user_status ON public.achievements(user_id, status);

-- Update existing achievements to have status
UPDATE public.achievements SET status = 'active' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.achievements.type IS 'Achievement type: consistency | reduction | correlation | lifestyle';
COMMENT ON COLUMN public.achievements.category IS 'Category: workout | symptom | supplement | mood | diet | sleep';
COMMENT ON COLUMN public.achievements.insight_text IS 'Personalized insight explanation for the achievement';
COMMENT ON COLUMN public.achievements.status IS 'Status: active (currently valid) | expired (pattern broken)';
