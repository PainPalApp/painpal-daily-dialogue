-- Add new fields to pain_logs table for enhanced pain tracking
ALTER TABLE public.pain_logs 
ADD COLUMN pain_strategies text[] DEFAULT '{}',
ADD COLUMN journal_entry text,
ADD COLUMN strategy_effectiveness_score integer;