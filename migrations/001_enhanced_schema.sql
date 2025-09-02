-- Enhanced Database Schema for ALX Polly
-- This migration implements all security and validation requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table with proper constraints
CREATE TABLE public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 500),
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE CHECK (expires_at > NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options with constraints
CREATE TABLE public.poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (length(trim(text)) > 0 AND length(text) <= 200),
  votes INTEGER DEFAULT 0 CHECK (votes >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table with unique constraint
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Vote logs for audit trail
CREATE TABLE public.vote_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_ip INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_polls_created_by ON public.polls(created_by);
CREATE INDEX idx_polls_is_active ON public.polls(is_active);
CREATE INDEX idx_polls_expires_at ON public.polls(expires_at);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);
CREATE INDEX idx_vote_logs_poll_id ON public.vote_logs(poll_id);
CREATE INDEX idx_vote_logs_user_id ON public.vote_logs(user_id);
CREATE INDEX idx_vote_logs_created_at ON public.vote_logs(created_at);
CREATE INDEX idx_vote_logs_user_ip ON public.vote_logs(user_ip);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls policies
CREATE POLICY "Users can view all active polls" ON public.polls
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own polls" ON public.polls
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls" ON public.polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own polls" ON public.polls
  FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Users can view poll options for active polls" ON public.poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.is_active = true
    )
  );

CREATE POLICY "Users can view poll options for their own polls" ON public.poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Users can view votes for active polls" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true
    )
  );

CREATE POLICY "Users can vote once per poll" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM public.votes 
      WHERE votes.poll_id = votes.poll_id 
      AND votes.user_id = auth.uid()
    )
  );

-- Vote logs policies (admin only)
CREATE POLICY "Only admins can view vote logs" ON public.vote_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "System can insert vote logs" ON public.vote_logs
  FOR INSERT WITH CHECK (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_poll_option_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.poll_options 
        SET votes = votes + 1 
        WHERE id = NEW.option_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.poll_options 
        SET votes = votes - 1 
        WHERE id = OLD.option_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update vote counts
CREATE TRIGGER update_vote_counts
    AFTER INSERT OR DELETE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION update_poll_option_votes();

-- Function to validate poll expiration
CREATE OR REPLACE FUNCTION validate_poll_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Poll expiration date must be in the future';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to validate poll expiration
CREATE TRIGGER validate_poll_expiration_trigger
    BEFORE INSERT OR UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION validate_poll_expiration();

-- Function to check for duplicate poll options
CREATE OR REPLACE FUNCTION check_duplicate_poll_options()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.poll_options 
        WHERE poll_id = NEW.poll_id 
        AND LOWER(trim(text)) = LOWER(trim(NEW.text))
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Poll options must be unique';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check for duplicate poll options
CREATE TRIGGER check_duplicate_poll_options_trigger
    BEFORE INSERT OR UPDATE ON public.poll_options
    FOR EACH ROW EXECUTE FUNCTION check_duplicate_poll_options();

-- Views for common queries
CREATE VIEW active_polls_with_stats AS
SELECT 
    p.*,
    u.name as creator_name,
    COUNT(DISTINCT po.id) as option_count,
    COUNT(DISTINCT v.id) as vote_count,
    COUNT(DISTINCT v.user_id) as unique_voters
FROM public.polls p
LEFT JOIN public.users u ON p.created_by = u.id
LEFT JOIN public.poll_options po ON p.id = po.poll_id
LEFT JOIN public.votes v ON p.id = v.poll_id
WHERE p.is_active = true
GROUP BY p.id, u.name;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
