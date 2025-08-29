-- Update the functional_impact constraint to allow the new values from the UI
ALTER TABLE public.pain_logs DROP CONSTRAINT IF EXISTS pain_logs_functional_impact_check;

-- Add the updated constraint with the new values
ALTER TABLE public.pain_logs ADD CONSTRAINT pain_logs_functional_impact_check 
CHECK (functional_impact = ANY (ARRAY['none'::text, 'work'::text, 'driving'::text, 'sleep'::text, 'exercise'::text, 'household'::text, 'mood'::text, 'other'::text]));