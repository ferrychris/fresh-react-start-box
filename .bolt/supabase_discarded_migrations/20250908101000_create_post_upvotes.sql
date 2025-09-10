-- Create post_upvotes table and policies to support likes feature
-- Safe to run multiple times with IF NOT EXISTS guards where possible

begin;

-- 1) Table
create table if not exists public.post_upvotes (
  post_id uuid not null references public.racer_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_upvotes_pkey primary key (post_id, user_id)
);

-- Helpful indexes (note: PK already covers (post_id, user_id))
create index if not exists idx_post_upvotes_user_id on public.post_upvotes(user_id);

-- 2) Ensure racer_posts.likes_count exists (optional safety)
-- If your schema already has this column, this will be skipped.
alter table public.racer_posts
  add column if not exists likes_count integer not null default 0;

-- Also ensure racer_posts.upvotes_count exists for post_upvotes aggregation
alter table public.racer_posts
  add column if not exists upvotes_count integer not null default 0;

-- 3) Trigger functions to maintain likes_count
create or replace function public.post_upvotes_after_insert()
returns trigger as $$
begin
  update public.racer_posts
  set upvotes_count = coalesce(upvotes_count, 0) + 1
  where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.post_upvotes_after_delete()
returns trigger as $$
begin
  update public.racer_posts
  set upvotes_count = greatest(coalesce(upvotes_count, 0) - 1, 0)
  where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

-- Drop/recreate triggers idempotently
drop trigger if exists trg_post_upvotes_after_insert on public.post_upvotes;
create trigger trg_post_upvotes_after_insert
  after insert on public.post_upvotes
  for each row execute function public.post_upvotes_after_insert();

drop trigger if exists trg_post_upvotes_after_delete on public.post_upvotes;
create trigger trg_post_upvotes_after_delete
  after delete on public.post_upvotes
  for each row execute function public.post_upvotes_after_delete();

-- 4) RLS
alter table public.post_upvotes enable row level security;

-- Policies
-- a) Anyone can read upvotes for public posts. Authors and upvoters can read regardless of visibility.
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'post_upvotes' and policyname = 'post_upvotes_select'
  ) then
    create policy post_upvotes_select on public.post_upvotes
    for select using (
      -- Upvoter can read their own row without recursion
      (user_id = auth.uid())
      OR
      -- Otherwise, allow when the parent post is public or owned by the viewer
      exists (
        select 1
        from public.racer_posts rp
        where rp.id = post_upvotes.post_id
          and (
            rp.visibility = 'public'
            or rp.user_id = auth.uid()
          )
      )
    );
  end if;
end
$$;

-- b) Only the signed-in user can insert their own upvote
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'post_upvotes' and policyname = 'post_upvotes_insert'
  ) then
    create policy post_upvotes_insert on public.post_upvotes
    for insert with check (
      auth.uid() = user_id
      and exists (select 1 from public.racer_posts rp where rp.id = post_id)
    );
  end if;
end
$$;

-- c) Only the upvoter can remove their upvote
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'post_upvotes' and policyname = 'post_upvotes_delete'
  ) then
    create policy post_upvotes_delete on public.post_upvotes
    for delete using (
      auth.uid() = user_id
    );
  end if;
end
$$;

commit;
