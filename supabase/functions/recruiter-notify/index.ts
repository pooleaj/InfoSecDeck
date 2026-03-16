/**
 * recruiter-notify
 * Sends an admin email when a recruiter submits the Talent Vault interest form.
 * Called fire-and-forget from the frontend (no auth required — public form).
 *
 * Deploy:
 *   supabase functions deploy recruiter-notify --no-verify-jwt
 *
 * Secrets required:
 *   RESEND_API_KEY  (already set)
 *   ADMIN_EMAIL     (already set)
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') || 'hello@infosecdeck.com';
const FROM_EMAIL     = 'InfoSecDeck <hello@infosecdeck.com>';

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

  let body: { name?: string; company?: string; email?: string; roles?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { name, company, email, roles } = body;
  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields: name, email' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const safeName    = escHtml(name);
  const safeCompany = escHtml(company || '—');
  const safeEmail   = escHtml(email);
  const safeRoles   = escHtml(roles || '—');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[InfoSecDeck] New Talent Vault Waitlist Signup</title>
</head>
<body style="margin:0;padding:0;background:#0b1120;font-family:'Segoe UI',Arial,sans-serif;color:#dde6f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#121929;border-radius:12px 12px 0 0;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:1.2rem;font-weight:700;color:#dde6f0;">InfoSec<span style="color:#0dd4c8;">Deck</span></span>
          <span style="display:inline-block;margin-left:12px;background:#4d9eff;color:#fff;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:4px;">Talent Vault</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#121929;padding:32px 36px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#dde6f0;">New recruiter waitlist signup</h1>
          <p style="margin:0 0 24px;color:#7a90a8;font-size:.85rem;line-height:1.6;">
            Someone just joined the Talent Vault waitlist.
          </p>
          <div style="background:#192338;border-radius:10px;padding:18px 22px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7a90a8;padding-bottom:4px;width:100px;">Name</td>
                <td style="font-size:.9rem;color:#dde6f0;font-weight:600;">${safeName}</td>
              </tr>
              <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:0;"></td></tr>
              <tr>
                <td style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7a90a8;padding-bottom:4px;">Company</td>
                <td style="font-size:.9rem;color:#dde6f0;">${safeCompany}</td>
              </tr>
              <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:0;"></td></tr>
              <tr>
                <td style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7a90a8;padding-bottom:4px;">Email</td>
                <td style="font-size:.9rem;color:#0dd4c8;">${safeEmail}</td>
              </tr>
              <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:0;"></td></tr>
              <tr>
                <td style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7a90a8;padding-bottom:4px;">Roles</td>
                <td style="font-size:.9rem;color:#dde6f0;">${safeRoles}</td>
              </tr>
            </table>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0d1525;border-radius:0 0 12px 12px;padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:.72rem;color:#3d5166;">Admin notification — InfoSecDeck Talent Vault</p>
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
        subject: `[InfoSecDeck] Talent Vault waitlist: ${name} (${company || 'no company'})`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[recruiter-notify] Resend error:', errBody.slice(0, 300));
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[recruiter-notify] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
