
CREATE TABLE IF NOT EXISTS public.meta_connection_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used BOOLEAN NOT NULL DEFAULT false
);

-- Add RLS policies to protect state data
ALTER TABLE public.meta_connection_states ENABLE ROW LEVEL SECURITY;

-- Only allow users to access their own connection states
CREATE POLICY "Users can only see their own connection states" 
  ON public.meta_connection_states 
  FOR ALL 
  USING (auth.uid() = user_id);
