/**
 * send-annual-reminder
 * Sends renewal reminder emails to annual Pro subscribers 7–30 days before expiry.
 *
 * Setup:
 *   1. Create a free account at resend.com and get an API key
 *   2. Set secret: supabase secrets set RESEND_API_KEY=re_xxxx
 *   3. Set secret: supabase secrets set CRON_SECRET=<random-long-string>
 *   4. Deploy: supabase functions deploy send-annual-reminder --no-verify-jwt
 *   5. Schedule in Supabase Dashboard → Edge Functions → send-annual-reminder → Schedule
 *      Cron: 0 9 * * *  (daily at 9am UTC)
 *   6. Update FROM_EMAIL below to your verified Resend sending domain
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')!;
const CRON_SECRET     = Deno.env.get('CRON_SECRET') || '';
const FROM_EMAIL      = 'InfoSecDeck <hello@infosecdeck.com>'; // Update after verifying domain in Resend
const SITE_URL        = 'https://infosecdeck.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Verify this is a scheduled/authorized call
  const cronSecret = req.headers.get('x-cron-secret');
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Find annual subscribers with renewals 7–30 days away
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const minimum = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Query profiles + join auth.users for email
    const { data: candidates, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, subscription_period_end')
      .eq('plan', 'pro')
      .eq('cancel_at_period_end', false)
      .gte('subscription_period_end', minimum.toISOString())
      .lte('subscription_period_end', soon.toISOString());

    if (error) throw new Error('DB query failed: ' + error.message);
    if (!candidates || candidates.length === 0) {
      console.log('[send-annual-reminder] No upcoming renewals found');
      return new Response(JSON.stringify({ sent: 0, message: 'No upcoming renewals' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const candidate of candidates) {
      // Get user email from auth.users
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(candidate.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const renewDate = new Date(candidate.subscription_period_end);
      const daysUntil = Math.ceil((renewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const displayName = candidate.name || email.split('@')[0];
      const formattedDate = renewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your InfoSecDeck Pro Subscription Renews Soon</title>
</head>
<body style="margin:0;padding:0;background:#0b1120;font-family:'Segoe UI',Arial,sans-serif;color:#dde6f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#121929;border-radius:12px 12px 0 0;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:1.2rem;font-weight:700;color:#dde6f0;">InfoSec<span style="color:#0dd4c8;">Deck</span></span>
          <span style="display:inline-block;margin-left:12px;background:linear-gradient(90deg,#0dd4c8,#4d9eff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Pro Member</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#121929;padding:32px 36px;">
          <p style="margin:0 0 20px;color:#7a90a8;font-size:.85rem;">Hi ${displayName},</p>
          <h1 style="margin:0 0 12px;font-size:1.4rem;font-weight:700;color:#dde6f0;line-height:1.3;">Your Pro subscription renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}</h1>
          <p style="margin:0 0 24px;color:#7a90a8;font-size:.9rem;line-height:1.6;">
            Your InfoSecDeck Pro annual subscription will automatically renew on <strong style="color:#dde6f0;">${formattedDate}</strong>.
            No action needed — you're all set to continue your career development journey.
          </p>
          <!-- Feature reminder -->
          <div style="background:#192338;border-radius:10px;padding:20px 24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07);">
            <p style="margin:0 0 14px;font-size:.75rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#0dd4c8;">Your Pro Features</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;">
              ${[
                ['🔥', 'Resume Roaster Pro', 'Unlimited AI resume analysis'],
                ['🔀', 'Career Pivot Advisor', 'Full AI roadmap to your target role'],
                ['🎯', 'Interview Prep AI', 'Follow-up questions from a hiring manager'],
                ['📊', 'ATS Job Match Scanner', 'Match any job description to your resume'],
              ].map(([icon, name, desc]) => `
              <tr><td style="padding:6px 0;vertical-align:top;">
                <span style="font-size:1rem;margin-right:10px;">${icon}</span>
                <strong style="color:#dde6f0;font-size:.85rem;">${name}</strong>
                <span style="color:#7a90a8;font-size:.8rem;margin-left:6px;">— ${desc}</span>
              </td></tr>`).join('')}
            </table>
          </div>
          <p style="margin:0 0 24px;color:#7a90a8;font-size:.85rem;line-height:1.6;">
            If you'd like to cancel before renewal, you can do so anytime from your
            <a href="${SITE_URL}/#pricing" style="color:#0dd4c8;text-decoration:none;">account settings</a> — no questions asked.
          </p>
          <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(90deg,#0dd4c8,#4d9eff);color:#000;font-weight:700;font-size:.85rem;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:.05em;">Continue Learning →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0d1525;border-radius:0 0 12px 12px;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:.72rem;color:#3d5166;line-height:1.6;">
            You're receiving this because you have an active InfoSecDeck Pro subscription.
            Questions? Reply to this email or visit <a href="${SITE_URL}" style="color:#3d5166;">${SITE_URL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: `Your InfoSecDeck Pro subscription renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          html: emailHtml,
        }),
      });

      if (resendResp.ok) {
        sent++;
        // Log analytics
        supabaseAdmin.from('feature_events').insert({
          user_id: candidate.id,
          event: 'annual_reminder_sent',
          meta: { days_until_renewal: daysUntil, renewal_date: renewDate.toISOString() },
        }).catch(() => {});
        console.log(`[send-annual-reminder] Sent to ${email} (${daysUntil} days)`);
      } else {
        failed++;
        const errBody = await resendResp.text();
        console.error(`[send-annual-reminder] Failed for ${email}:`, errBody.slice(0, 200));
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: candidates.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-annual-reminder] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
