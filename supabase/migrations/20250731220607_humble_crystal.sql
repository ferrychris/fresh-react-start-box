/*
  # Track Followers System

  1. New Tables
    - `track_followers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `track_id` (uuid, foreign key to track_profiles)
      - `followed_at` (timestamp)
      - `is_active` (boolean)

  2. Functions
    - `get_track_follower_count` - Returns real follower count
    - `follow_track` - Follow/unfollow functionality
    - `get_user_track_follows` - Get tracks a user follows

  3. Security
    - Enable RLS on `track_followers` table
    - Add policies for users to manage their own follows
    - Add policies for tracks to read their follower data
*/

-- Create track_followers table
CREATE TABLE IF NOT EXISTS track_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES track_profiles(id) ON DELETE CASCADE,
  followed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS
ALTER TABLE track_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage own track follows" ON track_followers;
CREATE POLICY "Users can manage own track follows"
  ON track_followers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tracks can read their followers" ON track_followers;
CREATE POLICY "Tracks can read their followers"
  ON track_followers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM track_profiles 
    WHERE track_profiles.id = track_followers.track_id 
    AND track_profiles.id = auth.uid()
  ));

DROP POLICY IF EXISTS "Anyone can read active follows for public data" ON track_followers;
CREATE POLICY "Anyone can read active follows for public data"
  ON track_followers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Function to get track follower count
CREATE OR REPLACE FUNCTION get_track_follower_count(track_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM track_followers
    WHERE track_id = track_uuid
    AND is_active = true
  );
END;
$$;

-- Function to follow/unfollow track
CREATE OR REPLACE FUNCTION toggle_track_follow(p_user_id uuid, p_track_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_follow track_followers%ROWTYPE;
  result json;
BEGIN
  -- Check if follow exists
  SELECT * INTO existing_follow
  FROM track_followers
  WHERE user_id = p_user_id AND track_id = p_track_id;

  IF existing_follow.id IS NOT NULL THEN
    -- Toggle existing follow
    UPDATE track_followers
    SET is_active = NOT is_active,
        updated_at = now()
    WHERE id = existing_follow.id;
    
    result := json_build_object(
      'following', NOT existing_follow.is_active,
      'follower_count', get_track_follower_count(p_track_id)
    );
  ELSE
    -- Create new follow
    INSERT INTO track_followers (user_id, track_id, is_active)
    VALUES (p_user_id, p_track_id, true);
    
    result := json_build_object(
      'following', true,
      'follower_count', get_track_follower_count(p_track_id)
    );
  END IF;

  RETURN result;
END;
$$;

-- Function to check if user follows track
CREATE OR REPLACE FUNCTION check_track_follow(p_user_id uuid, p_track_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM track_followers
    WHERE user_id = p_user_id
    AND track_id = p_track_id
    AND is_active = true
  );
END;
$$;

-- Function to get tracks a user follows
CREATE OR REPLACE FUNCTION get_user_track_follows(p_user_id uuid)
RETURNS TABLE (
  track_id uuid,
  track_name text,
  track_type text,
  location text,
  track_logo_url text,
  followed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id,
    tp.track_name,
    tp.track_type,
    tp.location,
    tp.track_logo_url,
    tf.followed_at
  FROM track_followers tf
  JOIN track_profiles tp ON tp.id = tf.track_id
  WHERE tf.user_id = p_user_id
  AND tf.is_active = true
  ORDER BY tf.followed_at DESC;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_track_followers_updated_at
  BEFORE UPDATE ON track_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_followers_user_id ON track_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_track_followers_track_id ON track_followers(track_id);
CREATE INDEX IF NOT EXISTS idx_track_followers_active ON track_followers(is_active);

-- Add missing fields to racer_profiles table
ALTER TABLE racer_profiles 
ADD COLUMN IF NOT EXISTS career_wins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS podiums integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS championships integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS years_racing integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_published boolean DEFAULT false;

-- Add index for better performance on profile queries
CREATE INDEX IF NOT EXISTS idx_racer_profiles_published ON racer_profiles(profile_published) WHERE profile_published = true;

-- Add index for race schedules
CREATE INDEX IF NOT EXISTS idx_race_schedules_racer_date ON race_schedules(racer_id, event_date);

-- Ensure fan_connections table has proper structure for subscriber management
CREATE TABLE IF NOT EXISTS fan_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid REFERENCES racer_profiles(id) ON DELETE CASCADE,
  fan_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  amount_cents integer NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(racer_id, fan_id)
);

-- Enable RLS on fan_connections
ALTER TABLE fan_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for fan_connections (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Racers can view their own fan connections" ON fan_connections;
CREATE POLICY "Racers can view their own fan connections"
  ON fan_connections
  FOR SELECT
  TO authenticated
  USING (racer_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Fans can view their own connections" ON fan_connections;
CREATE POLICY "Fans can view their own connections"
  ON fan_connections
  FOR SELECT
  TO authenticated
  USING (fan_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own connections" ON fan_connections;
CREATE POLICY "Users can insert their own connections"
  ON fan_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (fan_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own connections" ON fan_connections;
CREATE POLICY "Users can update their own connections"
  ON fan_connections
  FOR UPDATE
  TO authenticated
  USING (fan_id::text = auth.uid()::text OR racer_id::text = auth.uid()::text);

-- Create user_tokens table for token management
CREATE TABLE IF NOT EXISTS user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token_balance integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_tokens
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tokens (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_tokens;
CREATE POLICY "Users can view their own tokens"
  ON user_tokens
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own tokens" ON user_tokens;
CREATE POLICY "Users can insert their own tokens"
  ON user_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own tokens" ON user_tokens;
CREATE POLICY "Users can update their own tokens"
  ON user_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);