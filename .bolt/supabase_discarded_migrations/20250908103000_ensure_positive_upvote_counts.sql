-- Ensure upvote counts never go below zero
-- 1. Add check constraint to racer_posts
-- 2. Update trigger functions to use GREATEST(count, 0)

begin;

-- Ensure upvotes_count column exists before adding the constraint (idempotent)
alter table public.racer_posts
  add column if not exists upvotes_count integer not null default 0;

-- Add check constraint to ensure upvote_count is never negative
do $$
begin
  -- Check if constraint exists first
  if not exists (
    select 1 from pg_constraint 
    where conname = 'racer_posts_upvotes_count_check' and conrelid = 'public.racer_posts'::regclass
  ) then
    alter table public.racer_posts
      add constraint racer_posts_upvotes_count_check 
      check (upvotes_count >= 0);
  end if;
end
$$;

-- Update the post_upvotes_after_delete trigger function to ensure count never goes below 0
create or replace function public.post_upvotes_after_delete()
returns trigger as $$
begin
  update public.racer_posts
  set upvotes_count = greatest(coalesce(upvotes_count, 0) - 1, 0)
  where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

-- Also ensure likes_count never goes below zero
do $$
begin
  -- Check if constraint exists first
  if not exists (
    select 1 from pg_constraint 
    where conname = 'racer_posts_likes_count_check' and conrelid = 'public.racer_posts'::regclass
  ) then
    alter table public.racer_posts
      add constraint racer_posts_likes_count_check 
      check (likes_count >= 0);
  end if;
end
$$;

commit;
