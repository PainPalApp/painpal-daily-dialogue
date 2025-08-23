-- Create pain_sessions table
CREATE TABLE public.pain_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  start_level INTEGER NOT NULL,
  end_level INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.pain_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pain_sessions
CREATE POLICY "Users can view their own pain sessions" 
ON public.pain_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pain sessions" 
ON public.pain_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pain sessions" 
ON public.pain_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pain sessions" 
ON public.pain_sessions 
FOR DELETE 
USING (auth.uid() = user_id);