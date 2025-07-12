-- Add common_triggers field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN common_triggers TEXT[] DEFAULT '{}'::TEXT[];