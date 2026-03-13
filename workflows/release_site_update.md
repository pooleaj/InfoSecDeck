# Workflow: Release a Site Update

## Objective
Make a change to the site, bump the cache-busting version, commit, and push so Vercel auto-deploys.

## Required Inputs
- Description of the change being made
- Which files were modified

## Steps

### 1. Make the code change
- Edit `index.html`, `js/app.js`, or `css/styles.css` as needed.
- For JS behavior changes (new functions, patched logic), a version bump is required.
- For HTML-only structural or copy changes, a version bump is still recommended.
- For CSS-only changes, a bump is optional but safe to do.

### 2. Find the current cache version
Search `index.html` for the script tag with `?v=`:
```
grep "app.js?v=" index.html
```
Example result: `<script src="js/app.js?v=61"></script>`

### 3. Increment the version
Edit the script tag in `index.html`:
- `?v=61` → `?v=62`
- Always increment by 1.
- If multiple script tags have `?v=`, update all of them.

### 4. Commit
Use a descriptive commit message. Format:
```
<short description> (v<new_version>)
```
Examples:
- `Add NordVPN affiliate banners to Training page (v62)`
- `Fix blog page not rendering posts (v59)`

Stage only the files that were actually changed:
```bash
git add index.html js/app.js css/styles.css
git commit -m "Your message here (vN)"
```

### 5. Push
```bash
git push origin main
```
Vercel auto-deploys on push to `main`. Deployment typically takes 30–60 seconds.

### 6. Verify
- Open https://infosecdeck.com in a browser (or force-refresh with Cmd+Shift+R).
- Navigate to the affected page and confirm the change is visible.
- Check the browser console for JS errors.

## Edge Cases
- **Build fails on Vercel**: Check Vercel dashboard at vercel.com for build logs. Most common causes: syntax error in HTML or JS.
- **Change not appearing**: Hard-refresh (Cmd+Shift+R). If still stale, confirm the version was bumped correctly.
- **Accidental commit of .env**: Immediately rotate all secrets in Supabase, Stripe, and Resend. Force-push is justified in this case.

## Notes
- The project is a static SPA. There is no build step — what you push is what Vercel serves.
- Auth is handled by `js/auth.js` which is loaded separately with its own `?v=` tag.
