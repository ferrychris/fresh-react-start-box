-- Enable RLS (no-op if already enabled)
ALTER TABLE IF EXISTS fan_streaks ENABLE ROW LEVEL SECURITY;

-- Unique constraint on fan_id to support safe upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'fan_streaks_fan_id_unique'
  ) THEN
    ALTER TABLE fan_streaks ADD CONSTRAINT fan_streaks_fan_id_unique UNIQUE (fan_id);
  END IF;
END $$;

-- Allow authenticated users to read their own streak
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'fan_streaks' 
      AND policyname = 'fan_streaks_select_own'
  ) THEN
    CREATE POLICY "fan_streaks_select_own"
      ON public.fan_streaks
      FOR SELECT
      TO authenticated
      USING (fan_id = auth.uid());
  END IF;
END $$;

-- Allow authenticated users to insert their own streak row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'fan_streaks' 
      AND policyname = 'fan_streaks_insert_own'
  ) THEN
    CREATE POLICY "fan_streaks_insert_own"
      ON public.fan_streaks
      FOR INSERT
      TO authenticated
      WITH CHECK (fan_id = auth.uid());
  END IF;
END $$;

-- Allow authenticated users to update their own streak row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'fan_streaks' 
      AND policyname = 'fan_streaks_update_own'
  ) THEN
    CREATE POLICY "fan_streaks_update_own"
      ON public.fan_streaks
      FOR UPDATE
      TO authenticated
      USING (fan_id = auth.uid())
      WITH CHECK (fan_id = auth.uid());
  END IF;
END $$;
