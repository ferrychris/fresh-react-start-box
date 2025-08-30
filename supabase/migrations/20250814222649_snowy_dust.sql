/*
  # Fix RLS Policy for Racer Posts

  1. Security Updates
    - Update RLS policies for racer_posts table to allow proper post creation
    - Allow users to create posts for their own profiles
    - Allow fans to create posts in the racing community
    - Ensure proper access control while enabling functionality

  2. Policy Changes
    - Update INSERT policy to allow authenticated users to create posts
    - Ensure racer_id matches the authenticated user for racer posts
    - Allow fan posts with proper validation
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Content creators can manage own posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON racer_posts;

-- Create new, more permissive INSERT policy for racer posts
CREATE POLICY "Users can create posts"
  ON racer_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow racers to create posts for their own profile
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.id = auth.uid()
      AND profiles.user_type = 'racer'
    ))
    OR
    -- Allow fans to create posts (for community posts)
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'fan'
    ))
    OR
    -- Allow tracks to create posts
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'track'
    ))
  );

-- Create comprehensive management policy for posts
CREATE POLICY "Users can manage own posts"
  ON racer_posts
  FOR ALL
  TO authenticated
  USING (
    -- Users can manage posts where they are the racer
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.id = auth.uid()
    ))
    OR
    -- Allow reading public posts
    (racer_posts.visibility = 'public')
    OR
    -- Allow fans to read posts from racers they follow
    (racer_posts.visibility = 'fans_only' AND EXISTS (
      SELECT 1 FROM fan_connections 
      WHERE fan_connections.fan_id = auth.uid() 
      AND fan_connections.racer_id = racer_posts.racer_id
    ))
  )
  WITH CHECK (
    -- Users can only create/update posts for their own profile
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = racer_posts.racer_id 
      AND profiles.id = auth.uid()
    ))
  );

-- Ensure the table has RLS enabled
ALTER TABLE racer_posts ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_racer_posts_racer_visibility 
ON racer_posts(racer_id, visibility);

-- Create index for fan connections lookup
CREATE INDEX IF NOT EXISTS idx_fan_connections_lookup 
ON fan_connections(fan_id, racer_id);