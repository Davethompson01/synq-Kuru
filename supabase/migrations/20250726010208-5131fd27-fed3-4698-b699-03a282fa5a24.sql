
-- Create table for synchronized voting rounds
CREATE TABLE public.voting_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number SERIAL,
  token_symbol TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user votes
CREATE TABLE public.user_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES public.voting_rounds(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  vote_direction TEXT NOT NULL CHECK (vote_direction IN ('up', 'down')),
  token_symbol TEXT NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(round_id, user_address)
);

-- Create table for real-time user activity (auto-cleanup after 10 minutes)
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('join', 'vote_up', 'vote_down', 'buy')),
  token_symbol TEXT,
  amount DECIMAL,
  round_id UUID REFERENCES public.voting_rounds(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.voting_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for voting_rounds (public read, no auth required for this use case)
CREATE POLICY "Anyone can view voting rounds" 
  ON public.voting_rounds 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert voting rounds" 
  ON public.voting_rounds 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update voting rounds" 
  ON public.voting_rounds 
  FOR UPDATE 
  USING (true);

-- Create policies for user_votes (public read, anyone can vote)
CREATE POLICY "Anyone can view votes" 
  ON public.user_votes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert votes" 
  ON public.user_votes 
  FOR INSERT 
  WITH CHECK (true);

-- Create policies for user_activity (public read, anyone can add activity)
CREATE POLICY "Anyone can view user activity" 
  ON public.user_activity 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert user activity" 
  ON public.user_activity 
  FOR INSERT 
  WITH CHECK (true);

-- Function to automatically cleanup old user activity (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_activity 
  WHERE created_at < now() - interval '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end expired rounds
CREATE OR REPLACE FUNCTION end_expired_rounds()
RETURNS void AS $$
BEGIN
  UPDATE public.voting_rounds 
  SET is_active = false 
  WHERE is_active = true AND end_time <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for all tables
ALTER TABLE public.voting_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.user_votes REPLICA IDENTITY FULL; 
ALTER TABLE public.user_activity REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.voting_rounds;
ALTER publication supabase_realtime ADD TABLE public.user_votes;
ALTER publication supabase_realtime ADD TABLE public.user_activity;
