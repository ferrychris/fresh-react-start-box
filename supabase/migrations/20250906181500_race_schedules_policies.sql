-- RLS policies to allow racers to manage their own schedules and anyone to read
alter table if exists public.race_schedules enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='race_schedules' AND policyname='race_schedules_select_public'
  ) THEN
    CREATE POLICY race_schedules_select_public
    ON public.race_schedules
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='race_schedules' AND policyname='race_schedules_insert_own'
  ) THEN
    CREATE POLICY race_schedules_insert_own
    ON public.race_schedules
    FOR INSERT
    TO authenticated
    WITH CHECK (racer_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='race_schedules' AND policyname='race_schedules_update_own'
  ) THEN
    CREATE POLICY race_schedules_update_own
    ON public.race_schedules
    FOR UPDATE
    TO authenticated
    USING (racer_id = auth.uid())
    WITH CHECK (racer_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='race_schedules' AND policyname='race_schedules_delete_own'
  ) THEN
    CREATE POLICY race_schedules_delete_own
    ON public.race_schedules
    FOR DELETE
    TO authenticated
    USING (racer_id = auth.uid());
  END IF;
END $$;
