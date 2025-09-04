-- Optimize public feed keyset pagination
-- Partial index to accelerate queries filtering visibility='public' and ordering by created_at DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_racer_posts_public_created_id
ON public.racer_posts (created_at DESC, id DESC)
WHERE visibility = 'public';
