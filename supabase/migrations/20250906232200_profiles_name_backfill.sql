-- Backfill profiles.name from email username (prefer profiles.email; fallback to auth.users.email)
-- Safe to run multiple times

-- 1) Backfill using profiles.email when available
update public.profiles p
set name = split_part(p.email, '@', 1)
where (p.name is null or btrim(p.name) = '')
  and p.email is not null and btrim(p.email) <> '';

-- 2) Backfill remaining using auth.users.email
update public.profiles p
set name = split_part(u.email, '@', 1)
from auth.users u
where (p.name is null or btrim(p.name) = '')
  and u.id = p.id
  and u.email is not null and btrim(u.email) <> '';

-- 3) As a last resort, set a role-based generic for still-missing names
-- Default to 'Racing Fan'; racer dashboards usually show username / car number anyway
update public.profiles p
set name = coalesce(p.name, 'Racing Fan')
where (p.name is null or btrim(p.name) = '');

-- Function + trigger to keep names populated on future inserts/updates
create or replace function public.ensure_profile_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if new.name is null or btrim(new.name) = '' then
    v_email := nullif(new.email, '');
    if v_email is null then
      select email into v_email from auth.users where id = new.id;
    end if;
    if v_email is not null and btrim(v_email) <> '' then
      new.name := split_part(v_email, '@', 1);
    else
      new.name := 'Racing Fan';
    end if;
  end if;
  return new;
end
$$;

-- Drop existing trigger if present to avoid duplicates
drop trigger if exists trg_ensure_profile_name on public.profiles;

create trigger trg_ensure_profile_name
before insert or update on public.profiles
for each row
execute function public.ensure_profile_name();
