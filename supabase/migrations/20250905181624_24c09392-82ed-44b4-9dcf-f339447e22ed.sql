-- Create teams table
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name text NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  founded_year integer,
  headquarters text,
  website text,
  social_links jsonb DEFAULT '{}',
  contact_email text,
  contact_phone text,
  racing_classes text[] DEFAULT '{}',
  featured_racers uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  follower_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Anyone can read teams" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Teams can manage own data" 
ON public.teams 
FOR ALL 
USING (false) -- No one can modify for now, we'll add admin later
WITH CHECK (false);

-- Create team_followers table for users to follow teams
CREATE TABLE public.team_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  followed_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Enable RLS on team_followers
ALTER TABLE public.team_followers ENABLE ROW LEVEL SECURITY;

-- Create policies for team_followers
CREATE POLICY "Users can manage own team follows" 
ON public.team_followers 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read team followers for public data" 
ON public.team_followers 
FOR SELECT 
USING (is_active = true);

-- Create function to get follower count for teams
CREATE OR REPLACE FUNCTION public.get_team_follower_count(team_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM team_followers
    WHERE team_id = team_uuid
    AND is_active = true
  );
END;
$function$;

-- Create function to toggle team follow
CREATE OR REPLACE FUNCTION public.toggle_team_follow(p_user_id uuid, p_team_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  existing_follow team_followers%ROWTYPE;
  result json;
BEGIN
  -- Check if follow exists
  SELECT * INTO existing_follow
  FROM team_followers
  WHERE user_id = p_user_id AND team_id = p_team_id;

  IF existing_follow.id IS NOT NULL THEN
    -- Toggle existing follow
    UPDATE team_followers
    SET is_active = NOT is_active,
        updated_at = now()
    WHERE id = existing_follow.id;
    
    result := json_build_object(
      'following', NOT existing_follow.is_active,
      'follower_count', get_team_follower_count(p_team_id)
    );
  ELSE
    -- Create new follow
    INSERT INTO team_followers (user_id, team_id, is_active)
    VALUES (p_user_id, p_team_id, true);
    
    result := json_build_object(
      'following', true,
      'follower_count', get_team_follower_count(p_team_id)
    );
  END IF;

  -- Update team follower count
  UPDATE teams 
  SET follower_count = get_team_follower_count(p_team_id),
      updated_at = now()
  WHERE id = p_team_id;

  RETURN result;
END;
$function$;

-- Insert some sample teams
INSERT INTO public.teams (team_name, description, racing_classes, founded_year, headquarters) VALUES
('Thunder Racing', 'Professional sprint car racing team with multiple championship wins', '{"Sprint Car", "Midget"}', 2015, 'Indianapolis, IN'),
('Lightning Motorsports', 'Elite late model racing organization focused on dirt track excellence', '{"Late Model", "Modified"}', 2018, 'Charlotte, NC'),
('Velocity Racing Team', 'Multi-class racing team specializing in street stock and modified divisions', '{"Street Stock", "Modified"}', 2020, 'Phoenix, AZ'),
('Apex Racing Group', 'Championship-winning team across multiple racing series', '{"Sprint Car", "Late Model"}', 2012, 'Tulsa, OK');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_teams_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_teams_updated_at();