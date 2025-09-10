-- RPCs for post upvotes
-- Provides: has_upvoted(post_id) -> boolean, toggle_post_upvote(post_id) -> boolean, get_post_upvotes_count(post_id) -> integer

begin;

-- has_upvoted: returns true if the current auth user has upvoted the post
create or replace function public.has_upvoted(p_post_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.post_upvotes pu
    where pu.post_id = p_post_id
      and pu.user_id = auth.uid()
  );
$$;

-- toggle_post_upvote: toggles an upvote for current auth user; returns true if upvoted after call, false if removed
create or replace function public.toggle_post_upvote(p_post_id uuid)
returns boolean
language plpgsql
volatile
as $$
declare
  v_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.post_upvotes pu
    where pu.post_id = p_post_id and pu.user_id = auth.uid()
  ) into v_exists;

  if v_exists then
    -- remove upvote
    delete from public.post_upvotes
    where post_id = p_post_id and user_id = auth.uid();
    return false;
  else
    -- add upvote
    insert into public.post_upvotes(post_id, user_id)
    values (p_post_id, auth.uid());
    return true;
  end if;
end;
$$;

-- get_post_upvotes_count: returns count of upvotes for the post
create or replace function public.get_post_upvotes_count(p_post_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::int
  from public.post_upvotes pu
  where pu.post_id = p_post_id;
$$;

commit;
