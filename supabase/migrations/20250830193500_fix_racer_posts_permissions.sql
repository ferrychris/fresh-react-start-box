-- Fix permissions for tables referenced by racer_posts RLS policies
-- Grants allow RLS policy subqueries to evaluate without permission errors

-- Ensure authenticated role can read profiles and fan_connections used in policies
DO $$
BEGIN
  -- Grant SELECT on profiles
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    GRANT SELECT ON TABLE public.profiles TO authenticated;
  END IF;

  -- Grant SELECT on fan_connections
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fan_connections'
  ) THEN
    GRANT SELECT ON TABLE public.fan_connections TO authenticated;
  END IF;

  -- Grant SELECT on racer_profiles if policies reference it indirectly
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'racer_profiles'
  ) THEN
    GRANT SELECT ON TABLE public.racer_profiles TO authenticated;
  END IF;

  -- Ensure authenticated can SELECT from racer_posts (RLS still applies)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'racer_posts'
  ) THEN
    GRANT SELECT ON TABLE public.racer_posts TO authenticated;
  END IF;
END $$;

-- Optional: Create helpful indexes if missing (no-ops if already exist)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_fan_connections_fan_racer ON public.fan_connections(fan_id, racer_id);
