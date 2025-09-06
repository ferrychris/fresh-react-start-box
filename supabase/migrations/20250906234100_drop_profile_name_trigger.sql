-- Drop the profile name trigger and function
DROP TRIGGER IF EXISTS trg_ensure_profile_name ON public.profiles;
DROP FUNCTION IF EXISTS public.ensure_profile_name();
