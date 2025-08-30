/*
  # Create post interactions table

  1. New Tables
    - `post_interactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to racer_posts)
      - `user_id` (uuid, foreign key to profiles)
      - `interaction_type` (text enum)
      - `tip_amount` (integer, nullable)
      - `comment_text` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `post_interactions` table
    - Add policies for users to manage their own interactions
    - Add policies for post owners to read interactions

  3. Indexes
    - Index on post_id for efficient queries
    - Index on user_id for user activity
    - Composite index on post_id and interaction_type
*/

CREATE TABLE IF NOT EXISTS post_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES racer_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'tip', 'comment')),
  tip_amount integer DEFAULT NULL,
  comment_text text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_type ON post_interactions(post_id, interaction_type);

-- RLS Policies
CREATE POLICY "Users can manage own interactions"
  ON post_interactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Post owners can read interactions"
  ON post_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM racer_posts 
      WHERE id = post_interactions.post_id 
      AND racer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read public interactions"
  ON post_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM racer_posts 
      WHERE id = post_interactions.post_id 
      AND visibility = 'public'
    )
  );