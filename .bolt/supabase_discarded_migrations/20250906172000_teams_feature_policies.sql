-- Enable RLS
alter table if exists public.teams enable row level security;
alter table if exists public.team_followers enable row level security;

-- Unique constraint to avoid duplicate follows
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and tablename = 'team_followers' and indexname = 'team_followers_unique_user_team'
  ) then
    create unique index team_followers_unique_user_team on public.team_followers (user_id, team_id);
  end if;
end $$;

-- Policies for team_followers
-- Select: allow public read by team for counts, and own rows for users
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'team_followers' and policyname = 'team_followers_select_public'
  ) then
    create policy "team_followers_select_public"
    on public.team_followers
    for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'team_followers' and policyname = 'team_followers_insert_own'
  ) then
    create policy "team_followers_insert_own"
    on public.team_followers
    for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'team_followers' and policyname = 'team_followers_update_own'
  ) then
    create policy "team_followers_update_own"
    on public.team_followers
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'team_followers' and policyname = 'team_followers_delete_own'
  ) then
    create policy "team_followers_delete_own"
    on public.team_followers
    for delete
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;

-- Optional: maintain teams.follower_count via trigger
create or replace function public.bump_team_followers()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.teams set follower_count = coalesce(follower_count,0) + 1 where id = new.team_id;
  elsif tg_op = 'DELETE' then
    update public.teams set follower_count = greatest(coalesce(follower_count,0) - 1, 0) where id = old.team_id;
  end if;
  return null;
end $$;

drop trigger if exists team_followers_counter on public.team_followers;
create trigger team_followers_counter
  after insert or delete on public.team_followers
  for each row execute function public.bump_team_followers();
