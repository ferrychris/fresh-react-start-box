-- Backfill racer_posts to ensure correct racer_id and user_type flags
-- 1) Set racer_id to user_id for racer-authored posts where missing, only when a racer_profile exists
UPDATE racer_posts rp
SET racer_id = rp.user_id
FROM racer_profiles r
WHERE rp.user_type = 'racer'
  AND rp.racer_id IS NULL
  AND r.id = rp.user_id;

-- 2) If user_type is missing but racer_id is present, set user_type = 'racer'
UPDATE racer_posts
SET user_type = 'racer'
WHERE user_type IS NULL
  AND racer_id IS NOT NULL;

-- 3) Normalize any legacy visibility values
UPDATE racer_posts
SET visibility = 'fans_only'
WHERE visibility = 'community';

-- 4) For posts authored by fans (profiles.user_type = 'fan') ensure user_type = 'fan'
UPDATE racer_posts rp
SET user_type = 'fan'
FROM profiles p
WHERE (rp.user_type IS NULL OR rp.user_type <> 'racer')
  AND rp.racer_id IS NULL
  AND p.id = rp.user_id
  AND LOWER(p.user_type) = 'fan';
