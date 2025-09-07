# Grandstand: Feed, Suggestions, and Teams You Follow

This document explains how the Grandstand page is structured, how it loads data, and the rules that keep it fast and resilient.

## File layout
- Page: `src/pages/Grandstand.tsx`
- Left sidebar component: `src/components/grandstand/LeftSidebar.tsx`
- Right sidebar component: `src/components/grandstand/RightSidebar.tsx`
- Post card: `src/components/PostCard.tsx`
- Create post modal: `src/components/fan-dashboard/posts/CreatePost.tsx`
- Posts API: `src/lib/supabase/posts.ts`

## Grid structure
- Left column (sticky): Community Guidelines + Teams You Follow
- Middle column: Create Post composer (if authenticated) + public feed + load more
- Right column (sticky): Suggested Racers + Active Teams/Racers

## Data sources and rules

### Posts (Middle Column)
- Fetch via `getPublicPostsPage` (see `src/lib/supabase/posts.ts`).
- Initial load:
  - Small batch and `includeProfiles: false` for fastest first paint.
  - Cache to localStorage: `gs_public_posts_page1` and `gs_public_posts_page1_cursor` for 2 minutes.
- Profile backfill (async):
  - After first paint, collect unique `user_id` and `racer_id` from rows.
  - Query `profiles` (id, name, email, avatar, user_type) and `racer_profiles` (id, username, profile_photo_url, car_number, racing_class, team_name).
  - Merge into existing posts in memory.
- Background prefetch: a timer based on `getNetworkDiagnostics()` preloads small batches while the tab is visible.
- Infinite scroll: an `IntersectionObserver` on a sentinel triggers `loadMore` early (rootMargin 800px).
- Realtime deletes: Supabase channel removes deleted posts from UI.

### Create Post composer (Middle Top)
- Shown if `user` is present.
- CTA opens `CreatePost` with optional auto-open modes:
  - `media` → jump to media upload flow.
  - `feeling` → jump to activity/feeling flow.
- On success, adapt the returned data to `PostCardType` and prepend to the feed.
- Post visibility aligns with the app-wide rule: `public` | `fans_only`.

### Teams You Follow (Left Column)
- Source of truth: `team_followers` joined with `teams`.
- Query (see `Grandstand.tsx`):
  ```sql
  select
    followed_at,
    team_id,
    teams!inner(team_name, logo_url)
  from team_followers
  where user_id = authUserId and is_active = true
  order by followed_at desc
  ```
- Display team logo, team name, and `Following since YYYY`.
- Cache to cookie `gs_fan_teams` for 10 minutes.

### Suggested Racers (Right Column)
- Join `racer_profiles` with `profiles` to include verified accounts.
- Inclusion rule: racer is shown if `racer_profiles.profile_published = true` OR `profiles.is_verified = true`.
- Fields used: `username`, `profile_photo_url`, `car_number`, `racing_class`, `team_name`.
- Derive a small set of “Active Teams/Racers” from the suggested racers’ team names.
- Cache to cookies `gs_featured_racers` and `gs_featured_teams` for 10 minutes.

## Resilience & error handling
- Each section fails gracefully:
  - Suggestions and teams show text fallbacks.
  - Posts show an error banner.
- Optional tables/views are queried defensively (e.g., using `.maybeSingle()` and simple `.or(...)` filters) to avoid hard failures.

## Performance considerations
- Minimal initial payload for the feed, with async enrichment.
- Timed background prefetch with small batches.
- Caching via cookies/localStorage for quick subsequent paints.

## Schema alignment
- `profiles` select does not include unsupported fields.
- Post visibility is strictly `public` | `fans_only` throughout the app.

## Future enhancements (nice-to-haves)
- Add a verified badge in Suggested Racers using `profiles.is_verified`.
- Add quick follow/unfollow actions in Teams You Follow.
- Consider server-side aggregations (materialized views) if feed volume grows.

## Progress and Behavior Updates

- __Unified "Fan" follow UX__
  - Right sidebar (Suggested Racers):
    - Not following → orange "Fan" (follows on click)
    - Following → green "Fan" (unfollows on click)
  - PostCard (racer posts):
    - Not following → orange "Fan" (follows on click)
    - Following → green "Fan" with tooltip "Unfollow racer"
    - Buttons grey out while requests are in-flight; success/error toasts shown
  - Left sidebar (Racers You Follow):
    - Green "Fan" button acts as unfollow (tooltip "Unfollow racer")

- __Consistent author names in PostCard__
  - PostCard fetches `profiles(name, user_type, avatar)` for the author on-demand as needed; display name falls back to `racer_profiles.username` or email local-part.
  - Introduced `isRacerEffective` (uses late-fetched `authorUserType`) to keep RACER chip and follow UI accurate even when initial payload omits `profiles`.

- __Racers You Follow now includes reciprocal racer-fans__
  - The left sidebar merges:
    - Racers you follow (`fan_connections` where `fan_id = current user`)
    - Racers who follow you (from `fan_connections` where `racer_id = current user` and `fan` has `user_type = 'racer'`)
  - Entries are de-duplicated; names/avatars come from `racer_profiles` or `profiles` accordingly.

- __Suggested Racers query hardened__
  - Removed failing `profiles` join + OR filter that caused 400s.
  - Now uses a safe query: `racer_profiles` where `profile_published` OR `is_featured`, ordered by `updated_at`.
  - Still filters out racers the user already follows.

- __Teams You Follow kept live via realtime__
  - Left sidebar auto-updates when a team follow/unfollow occurs, using a Supabase realtime channel listening on `team_followers`.

