# Workflow: Publish a Blog Post

## Objective
Publish a new blog post to InfoSecDeck so it appears on the Blog page for all users.

## Required Inputs
- Post title
- Post slug (URL-friendly, e.g., `how-to-get-into-cybersecurity`)
- Post body in Markdown or HTML
- Optional: excerpt (1–2 sentence summary shown in blog grid)
- Optional: tags (array of strings)

## Method 1 — Admin Panel (Preferred)

1. Open https://infosecdeck.com and log in with your admin account.
2. Navigate to the Profile page (`#profile`).
3. Scroll to the **Admin** section at the bottom.
4. Find the **Blog Posts** panel.
5. Click **New Post** and fill in:
   - `title` — Display title
   - `slug` — URL slug (lowercase, hyphens only, no spaces)
   - `body_md` — Post body (Markdown supported)
   - `excerpt` — Short summary (optional but recommended for SEO)
   - `published` — Set to `true` to make it live immediately
6. Click **Save**.
7. Navigate to the Blog page (`#blog`) and confirm the post appears.

## Method 2 — Supabase REST API (via tools/publish_blog_post.py)

Use this method for bulk publishing or when the admin panel is unavailable.

**Prerequisites:** `.env` must contain `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

```bash
python tools/publish_blog_post.py \
  --title "Your Post Title" \
  --slug "your-post-slug" \
  --body_file .tmp/post_body.md \
  --excerpt "Short summary of the post."
```

The tool will INSERT a row into `blog_posts` with `published=true` and print the new post ID.

## Method 3 — Manual SQL (last resort)

Run in the Supabase SQL editor at https://supabase.com/dashboard/project/eaynqvgeqdnaswwuwbha/sql:

```sql
INSERT INTO blog_posts (title, slug, body_md, excerpt, published, created_at)
VALUES (
  'Your Post Title',
  'your-post-slug',
  '## Your Markdown Content Here',
  'Short excerpt.',
  true,
  NOW()
);
```

## Verification
1. Navigate to https://infosecdeck.com/#blog.
2. Confirm the post appears in the grid.
3. Click the post card and confirm the full content renders.
4. Check that the slug is correct in the URL/hash.

## Edge Cases
- **Post not appearing**: The Blog page merges Supabase `_dbPosts` with static fallback `POSTS`. If `published=false` the post is filtered out. Confirm `published=true` in the database.
- **Duplicate slug**: Supabase will throw a unique constraint error. Choose a different slug.
- **Markdown not rendering**: The front-end uses a basic Markdown renderer. Avoid complex tables or custom HTML inside the body.

## Notes
- The static `POSTS` fallback in `js/app.js` only contains the "Welcome" post. All real posts should live in Supabase.
- Post content for the first 5 SEO posts lives in `branding/social-posts.html` — copy from there when publishing.
