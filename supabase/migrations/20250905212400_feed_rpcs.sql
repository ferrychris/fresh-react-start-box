-- RPC: fetch_public_feed
-- Returns public posts using keyset pagination and includes an author snapshot to avoid heavy joins on the client
create or replace function fetch_public_feed(
  p_limit int,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null
)
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  content text,
  media_urls jsonb,
  post_type text,
  likes_count int,
  comments_count int,
  user_id uuid,
  user_type text,
  racer_id uuid,
  total_tips int,
  allow_tips boolean,
  author_name text,
  author_avatar_url text,
  author_user_type text
) language sql security invoker as $$
  with base as (
    select rp.*
    from racer_posts rp
    where rp.visibility = 'public'
      and (
        -- no cursor provided
        (p_cursor_created_at is null and p_cursor_id is null)
        or
        -- keyset: strictly older timestamp
        (p_cursor_created_at is not null and rp.created_at < p_cursor_created_at)
        or
        -- keyset tie-breaker: same timestamp, lower id
        (p_cursor_created_at is not null and p_cursor_id is not null and rp.created_at = p_cursor_created_at and rp.id < p_cursor_id)
      )
    order by rp.created_at desc, rp.id desc
    limit coalesce(p_limit, 10)
  )
  select
    b.id,
    b.created_at,
    coalesce(b.updated_at, b.created_at) as updated_at,
    b.content,
    -- ensure media_urls is jsonb array
    case
      when jsonb_typeof(b.media_urls) is not null then b.media_urls
      else to_jsonb(coalesce(b.media_urls, '[]'::jsonb))
    end as media_urls,
    b.post_type::text,
    coalesce(b.likes_count, 0) as likes_count,
    coalesce(b.comments_count, 0) as comments_count,
    b.user_id,
    b.user_type::text,
    b.racer_id,
    coalesce(b.total_tips, 0) as total_tips,
    coalesce(b.allow_tips, false) as allow_tips,
    -- author snapshot from profiles
    coalesce(p.name, 'Unknown User') as author_name,
    coalesce(p.avatar, '') as author_avatar_url,
    coalesce(p.user_type::text, b.user_type::text) as author_user_type
  from base b
  left join profiles p on p.id = b.user_id
$$;

-- RPC: get_is_liked
-- Returns a boolean for each post id whether the current user (auth.uid()) has liked it.
create or replace function get_is_liked(post_ids uuid[])
returns table (
  post_id uuid,
  liked boolean
) language sql security invoker as $$
  with ids as (
    select unnest(post_ids) as pid
  )
  select i.pid as post_id,
         exists (
           select 1 from post_likes pl
           where pl.post_id = i.pid
             and pl.user_id = auth.uid()
         ) as liked
  from ids i
$$;
