-- Enable RLS for fan_connections and create policies to allow any authenticated user to follow/unfollow any racer
alter table if exists public.fan_connections enable row level security;

-- Allow public to read by racer for follower counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fan_connections' AND policyname='fan_connections_select_public'
  ) THEN
    CREATE POLICY fan_connections_select_public
    ON public.fan_connections
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- Allow authenticated users to insert a follow for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fan_connections' AND policyname='fan_connections_insert_own'
  ) THEN
    CREATE POLICY fan_connections_insert_own
    ON public.fan_connections
    FOR INSERT
    TO authenticated
    WITH CHECK (fan_id = auth.uid());
  END IF;
END $$;

-- Allow authenticated users to delete their own follow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fan_connections' AND policyname='fan_connections_delete_own'
  ) THEN
    CREATE POLICY fan_connections_delete_own
    ON public.fan_connections
    FOR DELETE
    TO authenticated
    USING (fan_id = auth.uid());
  END IF;
END $$;

-- Unique index to prevent duplicate follows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='fan_connections' AND indexname='fan_connections_unique_fan_racer'
  ) THEN
    CREATE UNIQUE INDEX fan_connections_unique_fan_racer ON public.fan_connections (fan_id, racer_id);
  END IF;
END $$;
