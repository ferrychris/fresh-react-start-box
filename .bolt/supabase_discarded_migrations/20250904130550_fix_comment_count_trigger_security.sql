-- Ensure comment count trigger can update racer_posts under RLS
-- Root cause: addCommentToPost inserts into post_comments, whose AFTER INSERT trigger
-- updates public.racer_posts.comments_count. That UPDATE ran as the caller and
-- hit RLS on racer_posts. Make the trigger function SECURITY DEFINER so it runs as owner.

-- Recreate function with SECURITY DEFINER and safe search_path
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.racer_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.racer_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate trigger to ensure it points at the updated function (idempotent)
DROP TRIGGER IF EXISTS trigger_update_comment_count ON public.post_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comment_count();

-- Optional hardening: grant only what is necessary to authenticated role
-- Column-level update is not needed since updates are performed by the trigger owner.
-- But ensure authenticated can insert/select/delete on post_comments per policies.
