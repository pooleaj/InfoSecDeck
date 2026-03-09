# InfoSecDeck — Running To-Do & Recommendations

This file is a live reference copy. The authoritative version lives in Claude's memory
and is updated automatically each session. Tell Claude "update the todo list" or
"mark X as done" at any time.

---

## PHASE 3 — Stripe & Monetization (Next Up)

### Sprint 1 — Core Stripe Infrastructure
- [ ] Add `plan` column to Supabase: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';`
- [ ] Add `subscriber_count` to Supabase settings table (for 100-sub price trigger)
- [ ] Add `quiz_results` column: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_results TEXT;`
- [ ] Build `#page-pricing` — Free vs Pro comparison table with Stripe Checkout buttons
- [ ] Create two Stripe price objects: early_bird ($12.99/mo) and standard ($14.99/mo)
- [ ] Integrate Stripe Checkout (monthly, yearly $99, lifetime $199)
- [ ] Set up Stripe webhook → Supabase: update profiles.plan on payment success/cancel
- [ ] Track subscriber count via webhook; auto-switch to standard price at 100
- [ ] Add paywall gating: check profiles.plan === 'pro' before showing premium content
- [ ] Add lock icons + upgrade prompts sitewide on all gated features
- [ ] Customer portal — Stripe hosted portal for manage/cancel
- [ ] Pricing cadence triggers: 100 subs → $14.99, 500 → $16.99, 1k → $19.99, 2.5k → $24.99

### Sprint 2 — First Premium Features (AI)
- [ ] Resume Roaster Pro — connect AI API for deep resume analysis ($7.99 one-time)
- [ ] Career Pivot Advisor Pro — full roadmap generation ($9.99 one-time)
- [ ] Resume Template Pack — 8 ATS-optimized role-specific templates ($14.99 one-time)

### Sprint 3 — Subscriber Features
- [ ] Interview Prep Pro — full Q&As + AI follow-ups (subscriber only)
- [ ] ATS Job Match Scanner (paste JD → % match vs profile)
- [ ] Cert ROI Calculator (salary lift + time to ROI per cert)

### Sprint 4 — Advanced Features
- [ ] Skills Gap Visualizer (current → target role gap map)
- [ ] AI Mock Interview (text Q&A + feedback, 10/month cap)
- [ ] Salary Negotiation Script Generator

### Sprint 5 — Final Pro Features
- [ ] "Will I Get This Job?" Analyzer (5/month cap)
- [ ] Personalized Domain News Briefing

### Later — Mentor Marketplace
- [ ] Add "Coming Soon" placeholder in nav/pricing page
- [ ] Full build after revenue validates demand

---

## BUSINESS / NON-CODE TASKS

### Affiliate & Monetization
- [ ] * TryHackMe affiliate link (pays per signup/subscription)
- [ ] * Hack The Box affiliate link
- [ ] * Udemy affiliate links for cert courses (already linked in cert DB)
- [ ] Amazon Associates for study guide book links
- [ ] * NordVPN — confirm correct tracking ID is in Homelab page link
- [ ] SANS affiliate/partner program (apply at 2k+ users)
- [ ] Security vendor sponsorships — Qualys, Wiz, Okta (pitch at 2k+ users)
- [ ] Sponsored Tool Encyclopedia spotlights (at 2k+ users)

### Legal / Compliance (Required Before Stripe Goes Live)
- [ ] * Privacy Policy page (required for GA + Stripe)
- [ ] * Terms of Service page (required before Stripe)
- [ ] * Cookie consent banner (GDPR — EU visitors)
- [ ] Review Stripe business requirements before going live

### Content & SEO
- [ ] Write 3-5 SEO blog posts targeting "how to get into cybersecurity" keywords
- [ ] Add meta descriptions + OG tags to index.html for social sharing
- [ ] Submit sitemap to Google Search Console
- [ ] Set up custom email (hello@infosecdeck.com)
- [ ] Create LinkedIn page + X/Twitter for InfoSecDeck brand

### Admin / Supabase
- [ ] Confirm admin SQL: `SELECT id, role FROM profiles WHERE role = 'admin';`
- [ ] RLS policy for cert_progress table (cross-device sync)
- [ ] Enable Supabase database backups in settings

---

## PRICING CADENCE REFERENCE

| Milestone | Monthly | Yearly | Lifetime | MRR Est. |
|-----------|---------|--------|----------|----------|
| Launch (0-100 subs) | $12.99 | $99 | $199 | ~$1,300 |
| 100 subs | $14.99 | $119 | $229 | ~$1,500 |
| 500 subs | $16.99 | $139 | $269 | ~$8,500 |
| 1,000 subs | $19.99 | $159 | $299 | ~$20,000 |
| 2,500 subs | $24.99 | $199 | $349 | ~$62,000 |

Grandfathered users always keep their rate. Price increases apply to new subscribers only.
Trigger increases on BOTH subscriber count AND major feature milestones.

---

## COMPLETED
- [x] Phase 1 — All 12 front-end features
- [x] Phase 2 — Supabase auth (Google OAuth, Magic Link, email/password)
- [x] Phase 2 — New user onboarding modal
- [x] Phase 2 — User profile with Supabase sync
- [x] Phase 2 — Admin role gating
- [x] Phase 2 — Career Quiz modal + results saved to profile
- [x] Phase 2 — Hash routing / back button navigation
- [x] Phase 2 — Google Analytics 4
- [x] NordVPN affiliate link on Homelab page
- [x] Google OAuth hash routing bug fixed (v18)
- [x] Supabase Site URL updated to https://infosecdeck.com
