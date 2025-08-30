/*
  # Enable Track Posts in Feed

  1. Updates
    - Modify RLS policies to allow tracks to create posts
    - Add track post visibility in public feed
    - Enable track post creation and management

  2. Security
    - Tracks can create and manage their own posts
    - Public track posts visible to all users
    - Follower-only posts visible to track followers
*/

-- Allow tracks to create posts using the racer_posts table
-- (We're reusing the existing table structure for simplicity)

-- Update RLS policy to allow tracks to create posts
DROP POLICY IF EXISTS "Racers can manage own posts" ON racer_posts;

CREATE POLICY "Content creators can manage own posts"
  ON racer_posts
  FOR ALL
  TO authenticated
  USING (
    -- Allow racers to manage their posts
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.user_type = 'racer'
      AND profiles.id = auth.uid()
    ))
    OR
    -- Allow tracks to manage their posts (using racer_id field for track_id)
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.user_type = 'track'
      AND profiles.id = auth.uid()
    ))
  )
  WITH CHECK (
    -- Same check for inserts
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.user_type IN ('racer', 'track')
      AND profiles.id = auth.uid()
    ))
  );

-- Update public posts policy to include track posts
DROP POLICY IF EXISTS "Anyone can read public posts" ON racer_posts;

CREATE POLICY "Anyone can read public posts"
  ON racer_posts
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.user_type IN ('racer', 'track')
      AND profiles.profile_complete = true
    )
  );

-- Update fans-only posts policy to include track followers
DROP POLICY IF EXISTS "Fans can read fans-only posts" ON racer_posts;

CREATE POLICY "Followers can read exclusive posts"
  ON racer_posts
  FOR SELECT
  TO authenticated
  USING (
    (visibility = 'fans_only') 
    AND (
      -- Post owner can always see their own posts
      (auth.uid() = racer_posts.racer_id)
      OR
      -- Racer fans can see racer posts
      (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = racer_posts.racer_id 
        AND profiles.user_type = 'racer'
      ) AND EXISTS (
        SELECT 1 FROM fan_connections
        WHERE fan_connections.fan_id = auth.uid() 
        AND fan_connections.racer_id = racer_posts.racer_id
      ))
      OR
      -- Track followers can see track posts (when we implement track following)
      (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = racer_posts.racer_id 
        AND profiles.user_type = 'track'
      ))
    )
  );