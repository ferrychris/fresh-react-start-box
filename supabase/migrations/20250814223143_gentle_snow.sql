/*
  # Create fan posts table

  1. New Tables
    - `fan_posts`
      - `id` (uuid, primary key)
      - `fan_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `media_urls` (jsonb array)
      - `post_type` (text: text, photo, video, gallery)
      - `visibility` (text: public, community)
      - `likes_count` (integer)
      - `comments_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `fan_posts` table
    - Add policies for fans to manage their own posts
    - Add policies for public reading of fan posts
*/

CREATE TABLE IF NOT EXISTS fan_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  media_urls jsonb DEFAULT '[]'::jsonb,
  post_type text DEFAULT 'text' CHECK (post_type IN ('text', 'photo', 'video', 'gallery')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'community')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fan_posts ENABLE ROW LEVEL SECURITY;

-- Policies for fan posts
CREATE POLICY "Fans can create their own posts"
  ON fan_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "Fans can read their own posts"
  ON fan_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Fans can update their own posts"
  ON fan_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = fan_id)
  WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "Fans can delete their own posts"
  ON fan_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = fan_id);

CREATE POLICY "Anyone can read public fan posts"
  ON fan_posts
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fan_posts_fan_id ON fan_posts(fan_id);
CREATE INDEX IF NOT EXISTS idx_fan_posts_created_at ON fan_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_posts_visibility ON fan_posts(visibility);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_fan_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fan_posts_updated_at
  BEFORE UPDATE ON fan_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_posts_updated_at();