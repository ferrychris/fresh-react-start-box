-- Fix image upload and comment count functionality

-- 1. Ensure comment count field exists and is properly maintained
ALTER TABLE IF EXISTS public.racer_posts 
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0 NOT NULL;

-- 2. Create function to automatically update comment count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count
    UPDATE public.racer_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count
    UPDATE public.racer_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for automatic comment count updates
DROP TRIGGER IF EXISTS trigger_update_comment_count ON public.post_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comment_count();

-- 4. Initialize comment counts for existing posts
UPDATE public.racer_posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM public.post_comments 
  WHERE post_comments.post_id = racer_posts.id
)
WHERE comments_count = 0;

-- 5. Create function for real-time comment count updates with RPC
CREATE OR REPLACE FUNCTION public.get_post_comment_count(post_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.post_comments
    WHERE post_id = post_uuid
  );
END;
$$;

-- 6. Create function to sync comment counts
CREATE OR REPLACE FUNCTION public.sync_comment_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.racer_posts
  SET comments_count = (
    SELECT COUNT(*)
    FROM public.post_comments
    WHERE post_comments.post_id = racer_posts.id
  );
END;
$$;