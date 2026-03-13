# Workflow: Affiliate Link Audit

## Objective
Verify that all affiliate links on the site are active, correctly attributed, and returning valid HTTP responses. Catch dead or misconfigured links before they cost conversions.

## Required Inputs
- None (the tool scans the codebase automatically)

## When to Run
- After adding new affiliate links
- Monthly, as part of routine maintenance
- If an affiliate program notifies you of URL changes
- Before a major marketing push

## Steps

### 1. Run the link checker
```bash
python tools/check_affiliate_links.py
```

The tool scans `index.html` and `js/app.js` for known affiliate domains and sends a HEAD request to each unique URL. Output example:

```
Affiliate Link Audit — InfoSecDeck
==================================================
PASS  200  https://go.nordvpn.net/aff_c?offer_id=15&aff_id=142939&url_id=902
PASS  200  https://go.nordpass.io/aff_c?offer_id=488&aff_id=142939&url_id=9356
WARN  301  https://www.udemy.com/course/...  (redirects — check destination)
FAIL  404  https://tryhackme.com/...

==================================================
4 links found | 2 passed | 1 warning | 1 failed
```

### 2. Investigate failures
- **404**: The link is broken. Log in to your affiliate dashboard and get the current tracking URL.
- **301/302 redirect**: The URL redirects but may still track correctly. Open the URL in a browser and confirm it lands on the expected product page with your affiliate ID in the URL or cookie.
- **403 / connection error**: The affiliate network may block HEAD requests (common with Udemy, Amazon). Try a GET request manually in the browser to confirm the URL is live.
- **Timeout**: Affiliate network may be down. Retry later.

### 3. Fix broken links
Affiliate links live in two places:

**`index.html` — Banner cards:**
- NordVPN banner: search for `go.nordvpn.net` (~line 2486, Home Lab page; ~line 1615, Training page)
- NordPass banner: search for `go.nordpass.io` (same sections)

**`js/app.js` — TOOLS array:**
- Search for `'Affiliate ★'` in tags to find all affiliate tool entries
- Update the `url` field with the corrected link

After fixing, bump the cache version and push per `workflows/release_site_update.md`.

### 4. Update this workflow
If a new affiliate program is added, add its domain to the `AFFILIATE_DOMAINS` list in `tools/check_affiliate_links.py`:
```python
AFFILIATE_DOMAINS = [
    'go.nordvpn.net',
    'go.nordpass.io',
    'tryhackme.com',       # pending approval
    'hackthebox.com',      # pending approval
    'udemy.com',           # pending approval
    'amazon.com',          # Amazon Associates (future)
]
```

## Current Affiliate Programs

| Program | Status | URL Pattern | Location |
|---|---|---|---|
| NordVPN | Active | `go.nordvpn.net/aff_c?...` | Home Lab page, Training page, Tools |
| NordPass | Active | `go.nordpass.io/aff_c?...` | Home Lab page, Training page, Tools |
| TryHackMe | Pending approval | — | Training page (plain link for now) |
| Hack The Box | Pending approval | — | Training page (plain link for now) |
| Udemy | Pending approval | — | Cert links throughout |

## Notes
- All affiliate links should use `target="_blank" rel="noopener sponsored"`.
- All affiliate links should be marked with the ★ symbol and covered by the disclosure text.
- Disclosure text: "Links marked ★ are affiliate links — we earn a small commission at no extra cost to you."
