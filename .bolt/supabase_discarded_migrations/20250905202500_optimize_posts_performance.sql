-- Migration to optimize post fetching performance
-- 1. Add composite indexes for better query performance
-- 2. Create triggers to update counters when likes/comments change

-- Composite index for pagination queries (created_at, id)
CREATE INDEX IF NOT EXISTS idx_racer_posts_created_at_id ON racer_posts(created_at DESC, id DESC);

-- Composite index for user's posts
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_id_created_at ON racer_posts(user_id, created_at DESC);

-- Composite index for visibility and created_at (for public feeds)
CREATE INDEX IF NOT EXISTS idx_racer_posts_visibility_created_at ON racer_posts(visibility, created_at DESC);

-- Create or replace function to increment comment count
CREATE OR REPLACE FUNCTION increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE racer_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE racer_posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to increment like count
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE racer_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to decrement like count
CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE racer_posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post_comments table
DROP TRIGGER IF EXISTS trig_increment_comment_count ON post_comments;
CREATE TRIGGER trig_increment_comment_count
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comment_count();

DROP TRIGGER IF EXISTS trig_decrement_comment_count ON post_comments;
CREATE TRIGGER trig_decrement_comment_count
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comment_count();

-- Create triggers for post_likes table
DROP TRIGGER IF EXISTS trig_increment_like_count ON post_likes;
CREATE TRIGGER trig_increment_like_count
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION increment_post_like_count();

DROP TRIGGER IF EXISTS trig_decrement_like_count ON post_likes;
CREATE TRIGGER trig_decrement_like_count
AFTER DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_post_like_count();

-- Create RPC functions for incrementing/decrementing like counts
CREATE OR REPLACE FUNCTION increment_post_likes(post_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE racer_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id_param
  RETURNING likes_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE racer_posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id_param
  RETURNING likes_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
