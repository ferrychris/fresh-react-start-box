# Project Progress and Rules

This document summarizes recent changes, conventions, and rules across the project.

## Recent Feature Work

- __Grandstand page__ (`src/pages/Grandstand.tsx`)
  - Created left and right sidebar components:
    - `LeftSidebar.tsx`: Community Guidelines, Racers You Follow, Teams You Follow.
    - `RightSidebar.tsx`: Suggested Racers, Active Teams/Racers.
  - Optimized initial feed paint using cached first page, then backfill profiles.
  - Added background prefetch and early sentinel-based load more.
  - Hardened Suggested Racers query to avoid failing profile joins (no 400s).
  - “Teams You Follow” now fetched from `team_followers → teams` and kept in sync using realtime (`grandstand-team-follows` channel).
  - “Racers You Follow” now includes reciprocal racer-fans (racers who follow you). Data merged and deduped.

- __Unified Fan UX__
  - Follow actions use a consistent "Fan" label and colors across:
    - `RightSidebar`: orange = follow, green = unfollow
    - `PostCard`: orange = follow, green = unfollow (with tooltip "Unfollow racer")
    - `LeftSidebar` (Racers You Follow): green = unfollow
  - Buttons grey out during requests; success/error toasts included (PostCard).

- __PostCard author consistency__ (`src/components/PostCard.tsx`)
  - Fetches `profiles(name, user_type, avatar)` on-demand for reliable display name and avatar.
  - Fallback order for display name: `profiles.name` → `racer_profiles.username` → email local-part → role generic.
  - Introduced `isRacerEffective` (uses late-fetched `authorUserType`) to keep RACER chip, verified badge, and Fan action accurate.

## Database and Migrations

- __Core tables added__
  - `team_followers` (active follows to teams).
  - `fan_connections` (fan ↔ racer affinity; used for follow/fan UX).
  - `fan_profiles` (optional richer fan profile data).

- __Triggers and backfill__
  - Dropped `ensure_profile_name` trigger.
  - Backfill migration available to populate `profiles.name` from email local-part; recommended to run periodically for legacy rows.

- __Functions__
  - Various helper functions created for prior work (e.g., `get_fan_stats`), though the Grandstand avoids complex RPCs for suggestions to prevent 400s.

## Query Rules and Conventions

- __Suggested Racers__
  - Use a safe query on `racer_profiles` with `.or('profile_published.eq.true,is_featured.eq.true')` instead of joining `profiles` to filter by `is_verified` to avoid 400s.
  - Always filter out racers that the user already follows based on `fan_connections`.

- __Profiles Backfill__
  - When a page relies on names, either:
    - Select `profiles(name, avatar)` (and fallback to email local-part), or
    - Use PostCard’s on-demand fetch pattern.

- __Visibility__
  - Post visibility values are strictly `public | fans_only` across the app.

- __Realtime__
  - For Grandstand, subscribe to `team_followers` INSERT/UPDATE to keep Teams You Follow accurate.
  - Post and comments updates are handled in `PostCard` with per-post channels.

## UX/Style Rules

- __Fan/Follow button__
  - Orange "Fan" means follow.
  - Green "Fan" means unfollow (tooltip clarifies "Unfollow racer").
  - Keep disabled visual state while requests are in-flight.

- __Chips/Badges__
  - RACER chip shows for racer posts; verified badge shows when available.
  - We do not show a separate "Following" label next to RACER chip; the button state conveys it.

## Next Steps / Recommendations

- Run the `profiles.name` backfill to normalize display names everywhere.
- Consider a server-side view/RPC for "verified or published" racer suggestions if we want to reintroduce verified logic safely.
- Add toasts for unfollow actions in left sidebar and right sidebar for consistency.
- Periodically audit pages to ensure selects include `profiles(name)` or use the PostCard backfill pattern when needed.
