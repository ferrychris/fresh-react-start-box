-- Enable RLS on racer_posts table and fix security issues
ALTER TABLE racer_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can read public posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON racer_posts;

-- Create comprehensive RLS policies for the unified posts table
CREATE POLICY "Anyone can read public posts" ON racer_posts
FOR SELECT USING (
  visibility = 'public' OR 
  (auth.uid() = user_id) OR
  (visibility = 'fans_only' AND user_type = 'racer' AND EXISTS (
    SELECT 1 FROM fan_connections 
    WHERE fan_id = auth.uid() 
    AND racer_id = racer_posts.racer_id
  ))
);

CREATE POLICY "Users can create their own posts" ON racer_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON racer_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON racer_posts
FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_id ON racer_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_type ON racer_posts(user_type);
CREATE INDEX IF NOT EXISTS idx_racer_posts_visibility ON racer_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_racer_posts_created_at ON racer_posts(created_at DESC);