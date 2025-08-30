-- First, let's add a user_type column to racer_posts to distinguish between racer and fan posts
ALTER TABLE racer_posts ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'racer';

-- Add a generic user_id column that can reference either a racer or fan
ALTER TABLE racer_posts ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update existing racer posts to set user_id = racer_id and user_type = 'racer'
UPDATE racer_posts SET 
  user_id = racer_id,
  user_type = 'racer'
WHERE user_id IS NULL;

-- Migrate any existing fan posts to racer_posts table
INSERT INTO racer_posts (
  user_id,
  user_type,
  content,
  media_urls,
  post_type,
  visibility,
  likes_count,
  comments_count,
  created_at,
  updated_at
)
SELECT 
  fan_id as user_id,
  'fan' as user_type,
  content,
  media_urls,
  post_type,
  visibility,
  likes_count,
  comments_count,
  created_at,
  updated_at
FROM fan_posts
WHERE EXISTS (SELECT 1 FROM fan_posts)
ON CONFLICT DO NOTHING;

-- Update RLS policies for the consolidated table
DROP POLICY IF EXISTS "Allow public read access to racer posts" ON racer_posts;
DROP POLICY IF EXISTS "Allow read for authenticated" ON racer_posts;
DROP POLICY IF EXISTS "Anyone can read public posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can create posts" ON racer_posts;
DROP POLICY IF EXISTS "Users can manage own posts" ON racer_posts;
DROP POLICY IF EXISTS "Allow insert for owner" ON racer_posts;
DROP POLICY IF EXISTS "Allow update for owner" ON racer_posts;
DROP POLICY IF EXISTS "Followers can read exclusive posts" ON racer_posts;

-- Create new consolidated RLS policies
CREATE POLICY "Anyone can read public posts" ON racer_posts
FOR SELECT USING (
  visibility = 'public' OR 
  (auth.uid() = user_id) OR
  (visibility = 'fans_only' AND EXISTS (
    SELECT 1 FROM fan_connections 
    WHERE fan_id = auth.uid() 
    AND racer_id = racer_posts.racer_id
    AND racer_posts.user_type = 'racer'
  ))
);

CREATE POLICY "Users can create their own posts" ON racer_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON racer_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON racer_posts
FOR DELETE USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_id ON racer_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_type ON racer_posts(user_type);
CREATE INDEX IF NOT EXISTS idx_racer_posts_visibility ON racer_posts(visibility);

-- Update the increment/decrement functions to work with the unified table
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE racer_posts 
  SET likes_count = likes_count + 1,
      updated_at = now()
  WHERE id = post_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE racer_posts 
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at = now()
  WHERE id = post_id;
END;
$function$;