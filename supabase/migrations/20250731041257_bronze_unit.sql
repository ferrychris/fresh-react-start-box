/*
  # Create racer posts table

  1. New Tables
    - `racer_posts`
      - `id` (uuid, primary key)
      - `racer_id` (uuid, foreign key to racer_profiles)
      - `content` (text)
      - `media_urls` (jsonb array)
      - `post_type` (text enum)
      - `visibility` (text enum)
      - `allow_tips` (boolean)
      - `total_tips` (integer)
      - `likes_count` (integer)
      - `comments_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `racer_posts` table
    - Add policies for racers to manage their own posts
    - Add policies for users to read posts based on visibility

  3. Indexes
    - Index on racer_id for efficient queries
    - Index on created_at for chronological ordering
    - Index on visibility for filtering
*/

CREATE TABLE IF NOT EXISTS racer_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id uuid NOT NULL REFERENCES racer_profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  media_urls jsonb DEFAULT '[]'::jsonb,
  post_type text DEFAULT 'text' CHECK (post_type IN ('text', 'photo', 'video', 'gallery')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'fans_only')),
  allow_tips boolean DEFAULT true,
  total_tips integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE racer_posts ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_racer_posts_racer_id ON racer_posts(racer_id);
CREATE INDEX IF NOT EXISTS idx_racer_posts_created_at ON racer_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_racer_posts_visibility ON racer_posts(visibility);

-- RLS Policies
CREATE POLICY "Racers can manage own posts"
  ON racer_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = racer_id)
  WITH CHECK (auth.uid() = racer_id);

CREATE POLICY "Anyone can read public posts"
  ON racer_posts
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Fans can read fans-only posts"
  ON racer_posts
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'fans_only' AND (
      auth.uid() = racer_id OR
      EXISTS (
        SELECT 1 FROM fan_connections 
        WHERE fan_id = auth.uid() 
        AND racer_id = racer_posts.racer_id
      )
    )
  );

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_racer_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_racer_posts_updated_at
      BEFORE UPDATE ON racer_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;