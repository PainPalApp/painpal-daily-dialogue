-- Extend profiles table with onboarding data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS diagnosis text,
ADD COLUMN IF NOT EXISTS pain_is_consistent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_medications jsonb DEFAULT '[]'::jsonb;

-- Update the existing default_pain_locations to be more comprehensive
-- (keeping existing column as-is for compatibility)