-- Make racer_id nullable to allow fan posts
ALTER TABLE racer_posts ALTER COLUMN racer_id DROP NOT NULL;

-- First, let's add columns if they don't exist
ALTER TABLE racer_posts ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'racer';
ALTER TABLE racer_posts ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update existing racer posts to set user_id = racer_id and user_type = 'racer'
UPDATE racer_posts SET 
  user_id = racer_id,
  user_type = 'racer'
WHERE user_id IS NULL AND racer_id IS NOT NULL;

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
  total_tips,
  allow_tips,
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
  0 as total_tips,
  false as allow_tips,
  created_at,
  updated_at
FROM fan_posts
WHERE EXISTS (SELECT 1 FROM fan_posts LIMIT 1)
ON CONFLICT DO NOTHING;

-- Now we can drop the fan_posts table since it's consolidated
DROP TABLE IF EXISTS fan_posts CASCADE;