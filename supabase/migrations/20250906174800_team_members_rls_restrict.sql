-- Tighten RLS for team_members to require manager/owner for add/remove; allow self-remove

-- Drop permissive policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='team_members_insert_authenticated'
  ) THEN
    DROP POLICY "team_members_insert_authenticated" ON public.team_members;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='team_members_update_authenticated'
  ) THEN
    DROP POLICY "team_members_update_authenticated" ON public.team_members;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='team_members_delete_authenticated'
  ) THEN
    DROP POLICY "team_members_delete_authenticated" ON public.team_members;
  END IF;
END $$;

-- Insert: only managers or owners of the same team may add members
CREATE POLICY team_members_insert_mgr_owner
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.racer_id = auth.uid()
      AND tm.role IN ('manager','owner')
  )
);

-- Update: only managers or owners of the same team may modify rows
CREATE POLICY team_members_update_mgr_owner
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.racer_id = auth.uid()
      AND tm.role IN ('manager','owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.racer_id = auth.uid()
      AND tm.role IN ('manager','owner')
  )
);

-- Delete: managers/owners OR self-remove allowed
CREATE POLICY team_members_delete_mgr_owner_or_self
ON public.team_members
FOR DELETE
TO authenticated
USING (
  team_members.racer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
      AND tm.racer_id = auth.uid()
      AND tm.role IN ('manager','owner')
  )
);
