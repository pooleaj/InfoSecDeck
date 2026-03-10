/**
 * feedback-notify
 * Sends an admin email when a new Feature Request or Issue is submitted.
 * Called fire-and-forget from the frontend after a successful INSERT.
 *
 * Setup:
 *   1. Set secret: supabase secrets set ADMIN_EMAIL=your@email.com
 *      (RESEND_API_KEY already set from send-annual-reminder)
 *   2. Deploy: supabase functions deploy feedback-notify
 *      (JWT verified by default — caller must be authenticated)
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') || 'admin@infosecdeck.com';
const FROM_EMAIL     = 'InfoSecDeck <hello@infosecdeck.com>';
const SITE_URL       = 'https://infosecdeck.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Require auth header (Supabase verifies JWT automatically when deployed without --no-verify-jwt)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: { itemId?: string; type?: string; title?: string; userName?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { itemId, type, title, userName } = body;
  if (!itemId || !type || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: itemId, type, title' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const typeLabel  = type === 'feature' ? 'Feature Request' : 'Bug / Issue';
  const badgeColor = type === 'feature' ? '#4d9eff' : '#f05d78';
  const safeTitle  = escHtml(title);
  const safeName   = escHtml(userName || 'Anonymous');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[InfoSecDeck] New ${typeLabel}</title>
</head>
<body style="margin:0;padding:0;background:#0b1120;font-family:'Segoe UI',Arial,sans-serif;color:#dde6f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#121929;border-radius:12px 12px 0 0;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:1.2rem;font-weight:700;color:#dde6f0;">InfoSec<span style="color:#0dd4c8;">Deck</span></span>
          <span style="display:inline-block;margin-left:12px;background:${badgeColor};color:#fff;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:4px;">${typeLabel}</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#121929;padding:32px 36px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#dde6f0;">New ${typeLabel} submitted</h1>
          <p style="margin:0 0 20px;color:#7a90a8;font-size:.85rem;line-height:1.6;">
            <strong style="color:#dde6f0;">${safeName}</strong> just submitted a new ${typeLabel.toLowerCase()} on InfoSecDeck.
          </p>
          <div style="background:#192338;border-radius:10px;padding:18px 22px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07);">
            <div style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7a90a8;margin-bottom:8px;">Title</div>
            <div style="font-size:.95rem;font-weight:700;color:#dde6f0;">${safeTitle}</div>
            <div style="margin-top:10px;font-size:.68rem;color:#3d5166;">Item ID: ${escHtml(itemId)}</div>
          </div>
          <a href="${SITE_URL}/#feedback" style="display:inline-block;background:linear-gradient(90deg,#0dd4c8,#4d9eff);color:#000;font-weight:700;font-size:.85rem;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:.05em;">View on InfoSecDeck →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0d1525;border-radius:0 0 12px 12px;padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:.72rem;color:#3d5166;">Admin notification — InfoSecDeck</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[InfoSecDeck] New ${typeLabel}: ${title}`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[feedback-notify] Resend error:', errBody.slice(0, 300));
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[feedback-notify] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
