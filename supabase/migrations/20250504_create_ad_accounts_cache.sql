
-- Create a table to cache ad accounts data
CREATE TABLE IF NOT EXISTS public.ad_accounts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security
ALTER TABLE public.ad_accounts_cache ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own cache
CREATE POLICY "Users can view their own ad accounts cache" 
ON public.ad_accounts_cache 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can insert/update/delete cache
CREATE POLICY "Service role can manage ad accounts cache" 
ON public.ad_accounts_cache 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
