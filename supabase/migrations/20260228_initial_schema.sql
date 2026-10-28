-- ==============================================================================
-- DATA HEIST: COLLEGE SYMPOSIUM CHALLENGE PORTAL
-- PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum
CREATE TYPE user_role AS ENUM ('participant', 'organizer');
CREATE TYPE review_status AS ENUM ('none', 'pending', 'approved', 'rejected');
CREATE TYPE event_status AS ENUM ('upcoming', 'active', 'paused', 'ended');

-- 3. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'participant',
  team_name TEXT,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  current_challenge_index INT NOT NULL DEFAULT 1 CHECK (current_challenge_index BETWEEN 1 AND 11),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ, -- Authoritative server clock timestamp for Challenge 10
  review_status review_status NOT NULL DEFAULT 'none',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  map_eligible BOOLEAN NOT NULL DEFAULT FALSE, -- Granted ONLY to the first 6 approved teams
  finish_rank INT, -- 1 through 6 (or > 6 if verified after quota full)
  score INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  last_solved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
  id INT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INT NOT NULL DEFAULT 100,
  description TEXT NOT NULL,
  clue TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'terminal_log',
  artifact_content TEXT NOT NULL,
  answer_format_hint TEXT,
  has_hint BOOLEAN NOT NULL DEFAULT TRUE,
  hint_penalty_seconds INT NOT NULL DEFAULT 60,
  -- RESTRICTED COLUMNS: Never exposed to client queries via RLS view
  accepted_answers TEXT[] NOT NULL,
  answer_hash_sha256 TEXT NOT NULL,
  hint_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Submissions Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenge_id INT NOT NULL REFERENCES public.challenges(id),
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Hints Unlocked Table
CREATE TABLE IF NOT EXISTS public.hints_unlocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenge_id INT NOT NULL REFERENCES public.challenges(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, challenge_id)
);

-- 8. Event Configuration Table
CREATE TABLE IF NOT EXISTS public.event_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  name TEXT NOT NULL DEFAULT 'DATA HEIST 2026',
  status event_status NOT NULL DEFAULT 'active',
  duration_minutes INT NOT NULL DEFAULT 90,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 minutes'),
  venue_name TEXT NOT NULL DEFAULT 'Advanced Programming Lab',
  venue_room TEXT NOT NULL DEFAULT 'Lab 304 - Cyber Enclave',
  map_quota INT NOT NULL DEFAULT 6,
  hints_allowed BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hints_unlocked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile; organizers can read all
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Organizers view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')
  );

-- Teams: Participants can view their own team; public can view leaderboard projection; organizers view all
CREATE POLICY "Teams view own data" ON public.teams
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public leaderboard view" ON public.teams
  FOR SELECT USING (TRUE);

CREATE POLICY "Organizers manage all teams" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')
  );

-- Challenges: Participants can view active challenge definitions, but NOT answers or hints
CREATE POLICY "Participants view challenge briefings" ON public.challenges
  FOR SELECT USING (TRUE);

-- Event Config: Public read-only
CREATE POLICY "Anyone can view event config" ON public.event_config
  FOR SELECT USING (TRUE);

CREATE POLICY "Organizers update event config" ON public.event_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')
  );

-- ==============================================================================
-- RACE-SAFE STORED PROCEDURE: TOP 6 VENUE MAP APPROVAL
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.approve_team_completion(
  p_team_id UUID,
  p_organizer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_approved_count INT;
  v_map_quota INT;
  v_team RECORD;
  v_is_eligible BOOLEAN;
  v_finish_rank INT;
BEGIN
  -- Verify organizer clearance
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_organizer_id AND role = 'organizer') THEN
    RAISE EXCEPTION 'Unauthorized: Only symposium organizers may approve completions.';
  END IF;

  -- Lock team row
  SELECT * INTO v_team FROM public.teams WHERE id = p_team_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found.';
  END IF;

  IF NOT v_team.is_completed OR v_team.review_status != 'pending' THEN
    RAISE EXCEPTION 'Team is not currently awaiting review.';
  END IF;

  -- Get map quota (6)
  SELECT map_quota INTO v_map_quota FROM public.event_config WHERE id = 'main';
  IF v_map_quota IS NULL THEN v_map_quota := 6; END IF;

  -- Count currently approved teams that received the map (atomic row locking)
  SELECT COUNT(*) INTO v_current_approved_count 
  FROM public.teams 
  WHERE review_status = 'approved' AND map_eligible = TRUE;

  IF v_current_approved_count < v_map_quota THEN
    v_is_eligible := TRUE;
    v_finish_rank := v_current_approved_count + 1;
  ELSE
    v_is_eligible := FALSE;
    v_finish_rank := v_current_approved_count + 1;
  END IF;

  -- Update team
  UPDATE public.teams
  SET review_status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_organizer_id,
      map_eligible = v_is_eligible,
      finish_rank = v_finish_rank
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'map_eligible', v_is_eligible,
    'finish_rank', v_finish_rank,
    'message', CASE 
      WHEN v_is_eligible THEN 'Approved. Team awarded Venue Map clearance (Slot ' || v_finish_rank || '/' || v_map_quota || ').'
      ELSE 'Approved. Challenge 10 verified, but top 6 map quota was already fulfilled.'
    END
  );
END;
$$;
