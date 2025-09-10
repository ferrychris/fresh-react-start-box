-- Fix stack depth limit error (54001) by optimizing RLS policies and triggers
-- This migration addresses excessive recursion in database operations

begin;

-- 1. Fix RLS policies on profiles table
-- First, drop any existing policies that might be causing recursion
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_completion on public.profiles;

-- Create simplified policies that avoid deep nesting and recursion
create policy profiles_update_own on public.profiles
  for update using (
    auth.uid() = id
  ) with check (
    auth.uid() = id
  );

-- 2. Fix any recursive triggers on profiles table
-- Drop any existing triggers that might be causing recursion
drop trigger if exists profile_update_trigger on public.profiles;
drop trigger if exists profile_completion_trigger on public.profiles;

-- 3. Create a simplified function for profile completion checks
create or replace function public.check_profile_completion(user_id uuid)
returns boolean
language sql
stable
as $$
  select 
    p.name is not null and p.name != '' and
    p.avatar is not null and p.avatar != '' and
    p.banner_image is not null and p.banner_image != '' and
    rp.username is not null and rp.username != '' and
    rp.team_name is not null and rp.team_name != '' and
    rp.car_number is not null and rp.car_number != '' and
    rp.racing_class is not null and rp.racing_class != ''
  from 
    public.profiles p
    left join public.racer_profiles rp on p.id = rp.id
  where 
    p.id = user_id
    and p.user_type = 'racer';
$$;

-- 4. Create a function to update profile completion status safely
create or replace function public.update_profile_completion(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  is_complete boolean;
begin
  -- Check completion
  is_complete := public.check_profile_completion(user_id);
  
  -- Update profile status
  update public.profiles
  set 
    profile_complete = is_complete,
    is_verified = is_complete,
    updated_at = now()
  where id = user_id;
  
  return is_complete;
exception
  when others then
    return false;
end;
$$;

-- 5. Grant execute permission on functions
grant execute on function public.check_profile_completion to authenticated;
grant execute on function public.update_profile_completion to authenticated;

-- 6. Optimize profiles table by adding indexes for common queries
create index if not exists idx_profiles_user_type on public.profiles(user_type);

-- 7. Fix any recursive foreign key relationships
-- This ensures that RLS policies don't cause infinite recursion through FK relationships
alter table public.racer_profiles drop constraint if exists racer_profiles_id_fkey;
alter table public.racer_profiles add constraint racer_profiles_id_fkey 
  foreign key (id) references public.profiles(id) on delete cascade deferrable initially deferred;

-- 8. Optimize fan_profiles table similarly
alter table public.fan_profiles drop constraint if exists fan_profiles_id_fkey;
alter table public.fan_profiles add constraint fan_profiles_id_fkey 
  foreign key (id) references public.profiles(id) on delete cascade deferrable initially deferred;

commit;
