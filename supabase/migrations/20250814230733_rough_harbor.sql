/*
  # Create functions to update post like counts in real-time

  1. Functions
    - `increment_post_likes` - Safely increment like count
    - `decrement_post_likes` - Safely decrement like count
  
  2. Security
    - Functions can be called by authenticated users
    - Includes error handling for edge cases
*/

-- Function to increment post like count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE racer_posts 
  SET likes_count = likes_count + 1,
      updated_at = now()
  WHERE id = post_id;
  
  -- Also try fan_posts table
  UPDATE fan_posts 
  SET likes_count = likes_count + 1,
      updated_at = now()
  WHERE id = post_id;
END;
$$;

-- Function to decrement post like count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE racer_posts 
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at = now()
  WHERE id = post_id;
  
  -- Also try fan_posts table
  UPDATE fan_posts 
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at = now()
  WHERE id = post_id;
END;
$$;