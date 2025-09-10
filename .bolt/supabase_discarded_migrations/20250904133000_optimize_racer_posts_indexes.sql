-- Performance indexes for faster post loading and pagination

-- 1) General ordering index for keyset pagination regardless of filter
CREATE INDEX IF NOT EXISTS idx_racer_posts_created_id
ON public.racer_posts (created_at DESC, id DESC);

-- 2) Partial index for public feed (already exists in a separate migration, keep as idempotent)
CREATE INDEX IF NOT EXISTS idx_racer_posts_public_created_id
ON public.racer_posts (created_at DESC, id DESC)
WHERE visibility = 'public';

-- 3) Per-user posts (fans) ordered newest first
CREATE INDEX IF NOT EXISTS idx_racer_posts_user_created_id
ON public.racer_posts (user_id, created_at DESC, id DESC);

-- 4) Per-racer posts ordered newest first
CREATE INDEX IF NOT EXISTS idx_racer_posts_racer_created_id
ON public.racer_posts (racer_id, created_at DESC, id DESC);

-- 5) Visibility + ordering for private/fans_only views, if used
CREATE INDEX IF NOT EXISTS idx_racer_posts_visibility_created_id
ON public.racer_posts (visibility, created_at DESC, id DESC);
