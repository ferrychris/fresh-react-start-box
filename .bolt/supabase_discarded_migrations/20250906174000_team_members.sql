-- Create team_members table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  racer_id uuid not null references public.racer_profiles(id) on delete cascade,
  role text not null default 'member', -- member | manager | owner
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(team_id, racer_id)
);

-- Enable RLS
alter table public.team_members enable row level security;

-- RLS policies
-- Members of a team can view membership; allow public read if you prefer discovery
create policy team_members_select_public
on public.team_members
for select
to anon, authenticated
using (true);

-- Only authenticated users can insert membership where they are the inviter OR self-join via app logic
create policy team_members_insert_authenticated
on public.team_members
for insert
to authenticated
with check (true);

-- Only allow updates by authenticated users; app-side can restrict by role
create policy team_members_update_authenticated
on public.team_members
for update
to authenticated
using (true)
with check (true);

-- Allow deletes by authenticated; app-side restrict to managers/owners
create policy team_members_delete_authenticated
on public.team_members
for delete
to authenticated
using (true);

-- Helper trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();
