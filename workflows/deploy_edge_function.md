# Workflow: Deploy a Supabase Edge Function

## Objective
Update and deploy a Supabase Edge Function so the new version is live and callable from the site.

## Required Inputs
- Name of the function to deploy (e.g., `resume-roaster`, `mock-interview`)
- Summary of what changed in the function

## Prerequisites
- Supabase CLI installed at `/usr/local/bin/supabase`
- Project linked: `supabase link --project-ref eaynqvgeqdnaswwuwbha` (already done)
- Logged in: `supabase login` (uses stored token)

## Steps

### 1. Edit the function
Function files live at:
```
supabase/functions/<function-name>/index.ts
```

Make your changes. Common patterns:
- All functions use Deno/TypeScript.
- Secrets are accessed via `Deno.env.get('SECRET_NAME')`.
- CORS headers must be returned on OPTIONS requests (existing functions have this pattern — copy it).

### 2. Deploy
```bash
supabase functions deploy <function-name> --project-ref eaynqvgeqdnaswwuwbha
```

Example:
```bash
supabase functions deploy mock-interview --project-ref eaynqvgeqdnaswwuwbha
```

Deploy takes ~15 seconds. You'll see "Deployed" confirmation in the terminal.

### 3. Verify secrets are set
If the function uses new environment variables, set them before testing:
```bash
supabase secrets set MY_NEW_SECRET=value --project-ref eaynqvgeqdnaswwuwbha
```

To list currently set secrets:
```bash
supabase secrets list --project-ref eaynqvgeqdnaswwuwbha
```

### 4. Test the function
Call it directly via curl to confirm it responds:
```bash
curl -X POST \
  https://eaynqvgeqdnaswwuwbha.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

Or test via the site by triggering the feature that calls the function.

### 5. Check logs if something fails
```bash
supabase functions logs <function-name> --project-ref eaynqvgeqdnaswwuwbha
```

## Edge Cases
- **"Function not found" after deploy**: Wait 30 seconds — propagation sometimes takes a moment.
- **500 error**: Almost always a missing secret or uncaught exception. Check logs.
- **CORS error in browser**: The function is missing CORS headers on the OPTIONS preflight. Add the standard CORS block from an existing function (e.g., `resume-roaster/index.ts`).
- **TypeScript compile error**: Run `deno check supabase/functions/<name>/index.ts` locally to catch type errors before deploying.

## All Functions Reference

| Function | Purpose |
|---|---|
| `resume-roaster` | AI resume analysis |
| `career-pivot` | Career pivot roadmap generation |
| `ats-scanner` | ATS job match scoring |
| `job-fit-analyzer` | Job fit analysis |
| `mock-interview` | AI mock interview session |
| `salary-negotiation` | Salary negotiation script generator |
| `daily-briefing` | Personalized security news briefing |
| `create-checkout-session` | Stripe checkout session creation |
| `create-portal-session` | Stripe customer portal |
| `stripe-webhook` | Stripe event handler (subscription changes) |
| `feedback-notify` | Admin email on new feedback submission |
| `send-annual-reminder` | Annual renewal reminder emails |
| `admin-usage` | Admin: per-user monthly feature usage |
| `interview-ai` | Interview prep AI (legacy, check if still used) |

## Notes
- Edge functions are Deno (not Node.js). Use `import` not `require`.
- The `EDGE_BASE` constant in `js/app.js` is `https://eaynqvgeqdnaswwuwbha.supabase.co/functions/v1`.
- After deploying a webhook handler (like `stripe-webhook`), verify the webhook endpoint in the Stripe dashboard still points to the correct URL.
