-- Add is_verified flag to profiles
alter table if exists public.profiles
  add column if not exists is_verified boolean not null default false;

-- Helper function to compute racer profile completeness (simple boolean)
create or replace function public.is_racer_profile_complete(p_racer_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(rp.profile_photo_url <> '' and rp.profile_photo_url is not null, false)
      and coalesce(rp.banner_photo_url <> '' and rp.banner_photo_url is not null, false)
      and coalesce(rp.car_number <> '' and rp.car_number is not null, false)
      and coalesce(rp.racing_class <> '' and rp.racing_class is not null, false)
      and coalesce(rp.team_name <> '' and rp.team_name is not null, false)
  from public.racer_profiles rp
  where rp.id = p_racer_id;
$$;

-- Updater function to toggle profiles.is_verified when conditions met
create or replace function public.update_racer_verified(p_racer_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Count fans (followers)
  perform 1;
  update public.profiles p
  set is_verified = (
    select (select public.is_racer_profile_complete(p_racer_id))
           and (select count(*) from public.fan_connections fc where fc.racer_id = p_racer_id) >= 10
  )
  where p.id = p_racer_id
    and p.user_type = 'racer';
end;
$$;

-- Trigger after changes on racer_profiles (profile completeness)
-- Wrapper trigger function for racer_profiles (uses NEW.id)
create or replace function public.trg_update_racer_verified_on_profile_fn()
returns trigger
language plpgsql
as $$
begin
  perform public.update_racer_verified(NEW.id);
  return NEW;
end;
$$;

drop trigger if exists trg_update_racer_verified_on_profile on public.racer_profiles;
create trigger trg_update_racer_verified_on_profile
after insert or update on public.racer_profiles
for each row
execute function public.trg_update_racer_verified_on_profile_fn();

-- Trigger after changes on fan_connections (followers threshold)
-- Wrapper trigger function for fan_connections INSERT (uses NEW.racer_id)
create or replace function public.trg_update_racer_verified_on_fans_ins_fn()
returns trigger
language plpgsql
as $$
begin
  perform public.update_racer_verified(NEW.racer_id);
  return NEW;
end;
$$;

-- Wrapper trigger function for fan_connections DELETE (uses OLD.racer_id)
create or replace function public.trg_update_racer_verified_on_fans_del_fn()
returns trigger
language plpgsql
as $$
begin
  perform public.update_racer_verified(OLD.racer_id);
  return OLD;
end;
$$;

drop trigger if exists trg_update_racer_verified_on_fans_ins on public.fan_connections;
create trigger trg_update_racer_verified_on_fans_ins
after insert on public.fan_connections
for each row
execute function public.trg_update_racer_verified_on_fans_ins_fn();

drop trigger if exists trg_update_racer_verified_on_fans_del on public.fan_connections;
create trigger trg_update_racer_verified_on_fans_del
after delete on public.fan_connections
for each row
execute function public.trg_update_racer_verified_on_fans_del_fn();
