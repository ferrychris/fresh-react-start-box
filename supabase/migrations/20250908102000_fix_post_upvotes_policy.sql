-- Fix infinite recursion in post_upvotes policies
-- Error: 42P17: infinite recursion detected in policy for relation "post_upvotes"

begin;

-- Drop all existing policies that might cause recursion
drop policy if exists post_upvotes_select on public.post_upvotes;
drop policy if exists post_upvotes_insert on public.post_upvotes;
drop policy if exists post_upvotes_delete on public.post_upvotes;

-- Create a non-recursive select policy that avoids referencing post_upvotes inside itself
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

-- Create a simple insert policy: only authenticated users can insert their own upvotes
create policy post_upvotes_insert on public.post_upvotes
for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.racer_posts rp where rp.id = post_id)
);

-- Create a simple delete policy: only upvoters can remove their own upvotes
create policy post_upvotes_delete on public.post_upvotes
for delete using (
  auth.uid() = user_id
);

commit;
