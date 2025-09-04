# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5f90759e-4acf-41c2-ada8-d7fc162dbb4f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5f90759e-4acf-41c2-ada8-d7fc162dbb4f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5f90759e-4acf-41c2-ada8-d7fc162dbb4f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## PostCard: Modus Operandi (How posts, comments, likes, and tips work)

This section documents how the `PostCard` component works end-to-end. See source: `src/components/PostCard.tsx`.

### Data model (Supabase)

- `posts`
  - Fields used: `id`, `user_id`, `content`, `media_urls[]`, `post_type` (e.g. `photo`, `gallery`, `video`), `created_at`, `visibility` (`public` or `fans`), `allow_tips` (boolean), denormalized counters: `likes_count`, `comments_count`, and `total_tips`.
  - Joins/relations (pre-fetched in parent query and passed via props):
    - `racer_profiles`: `id`, `username`, `profile_photo_url`, `car_number?`, `racing_class?`, and nested `profiles` with `id`, `name`, `user_type`, `avatar?`.
    - `track`: `id`, `track_name`, `track_logo_url`.

- `post_comments`
  - Fields used: `id`, `post_id`, `user_id`, `content` (or `comment_text`), `created_at`.
  - Realtime: the component subscribes to INSERT and DELETE events filtered by `post_id` to keep comments in sync live.

- `profiles`
  - Used to resolve commenter display info: `name`, `email`, `avatar`.

- `post_likes` (naming inferred from helpers)
  - Read via helper to determine whether the current user has liked the post.

### Component props

`PostCard` receives a `post` object (type `Post` in `src/types.ts`) plus optional callbacks:

- `onPostUpdate?()` — called after like/unlike to let parents refresh counts.
- `onPostDeleted?(postId: string)` — called after successful delete.
- `onPostUpdated?(post: Post)` — called after editing content.

### Key helpers (Supabase access)

Defined in `src/lib/supabase/posts`:

- `getPostLikers(postId, userId)` — checks if the current user liked the post.
- `likePost(postId, userId)` / `unlikePost(postId, userId)` — toggles like state.
- `getPostComments(postId, limit, offset)` — fetches comments and a total count.
- `addCommentToPost(postId, userId, content)` — creates a new comment.
- `deletePost(postId)` — deletes a post (owner only).
- `updatePost(postId, content)` — updates a post's content (owner only).

Tips/Payments are handled via `src/lib/supabase/payments`:

- `createPaymentSession({ amount, postId, userId, racerId, description, successUrl, cancelUrl })` — creates a checkout session and returns a `checkoutUrl`.

### User actions and flows

- Likes
  - Requires auth. Uses optimistic UI: immediately toggles like state and adjusts `likesCount`, then calls `likePost`/`unlikePost`. On error, reverts local state.

- Comments
  - Requires auth to add.
  - Opening the comments panel fetches the latest batch (`getPostComments`).
  - Realtime: subscribes to `post_comments` INSERT/DELETE for the specific `post_id`.
  - Deduplication: maintains a `Set` of comment IDs (`commentIdsRef`) to avoid duplicates when optimistic inserts race with realtime events.

- Tips (optional)
  - If `post.allow_tips` is true, users can send a tip.
  - Creates a payment session and redirects the browser to the returned `checkoutUrl`.

- Share
  - Uses the Web Share API if available, else copies a permalink (`/post/{id}`) to clipboard.

- Edit/Delete (owner only)
  - If current user is the post owner (`user.id === post.user_id`), menu shows `Edit` and `Delete`.
  - `Edit` enables an inline textarea; `Save` calls `updatePost` and notifies parent via `onPostUpdated`.
  - `Delete` calls `deletePost` and notifies parent via `onPostDeleted`.

### Media handling

- `post_type = video` renders a `video` element using the first `media_urls[0]`.
- `post_type = photo` or `gallery` renders an image or a carousel with left/right controls.
- Simple content-type inference is used based on URL (e.g., `.mp4`, `.webm`, `.ogg`).

### Visibility

- Renders a badge showing `Public` (globe) or `Fans Only` (users) based on `post.visibility`.

### Authentication handling

- If an unauthenticated user attempts to like, comment, or tip, the component opens `AuthModal` (`src/components/auth/AuthModal.tsx`).

### Error handling and UX

- Uses `react-hot-toast` for success/failure toasts.
- Employs optimistic updates for likes and comments for a responsive UX, with rollback on errors.
- Comments list shows loading states and has a placeholder for pagination (`View more comments`).

### Extending

- Add pagination for comments by replacing the placeholder `setComments([])` with a real fetch using `limit/offset`.
- Harden media type detection by storing MIME types alongside URLs.
- Enforce RLS in Supabase to restrict who can edit/delete posts, and who can view `Fans Only` posts.
