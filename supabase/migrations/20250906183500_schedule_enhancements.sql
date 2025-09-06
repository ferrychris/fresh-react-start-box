-- Create lookup tables for race series and tracks
create table if not exists public.race_series (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  created_at timestamptz not null default now()
);

-- Extend race_schedules with series/track references and description + reminders
alter table if exists public.race_schedules
  add column if not exists series_id uuid references public.race_series(id) on delete set null,
  add column if not exists track_id uuid references public.tracks(id) on delete set null,
  add column if not exists description text,
  add column if not exists notify_24h boolean not null default true,
  add column if not exists reminder_24h_sent boolean not null default false;

-- RLS for lookups: read for all; insert/update restricted to authenticated (optional)
alter table if exists public.race_series enable row level security;
alter table if exists public.tracks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='race_series' and policyname='race_series_select'
  ) then
    create policy race_series_select on public.race_series for select to anon, authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tracks' and policyname='tracks_select'
  ) then
    create policy tracks_select on public.tracks for select to anon, authenticated using (true);
  end if;
end $$;

-- Optional seed values
insert into public.race_series (name) values
  ('Cup Series'),
  ('Xfinity Series'),
  ('Truck Series')
  on conflict (name) do nothing;

-- pg_cron for reminder notifications
create extension if not exists pg_cron;

-- Function: send notifications for events happening ~24h from now and not sent yet
create or replace function public.send_race_schedule_reminders()
returns void
language plpgsql
as $$
begin
  with due as (
    select rs.id, rs.racer_id, rs.event_name, rs.event_date, coalesce(t.name, rs.track_name) as track_display
    from public.race_schedules rs
    left join public.tracks t on t.id = rs.track_id
    where rs.notify_24h = true
      and rs.reminder_24h_sent = false
      and rs.event_date between now() + interval '23 hours' and now() + interval '25 hours'
  )
  insert into public.notifications (user_id, title, message, type, read)
  select fc.fan_id,
         'Race starts in 24h',
         d.event_name || ' at ' || d.track_display || ' on ' || to_char(d.event_date, 'Mon DD, HH24:MI'),
         'race_schedule_reminder',
         false
  from due d
  join public.fan_connections fc on fc.racer_id = d.racer_id
  on conflict do nothing;

  -- Mark as sent
  update public.race_schedules rs
  set reminder_24h_sent = true
  from due d
  where rs.id = d.id;
end;
$$;

-- Schedule the function every 15 minutes
select cron.schedule('race-schedule-reminders', '*/15 * * * *', $$select public.send_race_schedule_reminders();$$);
