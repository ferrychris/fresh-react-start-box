-- Create upvotes count column on racer_posts if not exists
alter table if exists public.racer_posts
  add column if not exists upvotes_count integer not null default 0;

-- Create post_upvotes table
create table if not exists public.post_upvotes (
  post_id uuid not null references public.racer_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Enable RLS
alter table public.post_upvotes enable row level security;

-- Policies
create policy if not exists "allow read upvotes" on public.post_upvotes
  for select using (true);

create policy if not exists "allow insert own upvote" on public.post_upvotes
  for insert with check (auth.uid() = user_id);

create policy if not exists "allow delete own upvote" on public.post_upvotes
  for delete using (auth.uid() = user_id);

-- Triggers to maintain counter on racer_posts
create or replace function public.increment_upvotes_count() returns trigger as $$
begin
  update public.racer_posts set upvotes_count = coalesce(upvotes_count,0) + 1 where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_upvotes_count() returns trigger as $$
begin
  update public.racer_posts set upvotes_count = greatest(coalesce(upvotes_count,0) - 1, 0) where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_post_upvotes_insert on public.post_upvotes;
create trigger trg_post_upvotes_insert
after insert on public.post_upvotes
for each row execute function public.increment_upvotes_count();

drop trigger if exists trg_post_upvotes_delete on public.post_upvotes;
create trigger trg_post_upvotes_delete
after delete on public.post_upvotes
for each row execute function public.decrement_upvotes_count();
