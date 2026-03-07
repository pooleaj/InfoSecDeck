import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUB_PRICE_THRESHOLD = 100;

// Verify Stripe webhook signature using Web Crypto (no SDK needed)
async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const part of sig.split(',')) {
    const idx = part.indexOf('=');
    if (idx > 0) parts[part.slice(0, idx)] = part.slice(idx + 1);
  }
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

// Call Stripe REST API directly
async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

async function stripePost(path: string, params: Record<string, string>) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return res.json();
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  if (!sig) return new Response('Missing stripe-signature', { status: 400 });

  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) {
    console.error('Webhook signature verification failed');
    return new Response('Webhook signature error', { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === 'subscription') {
          const subId = session.subscription;
          let periodEnd: string | null = null;
          if (subId) {
            const sub = await stripeGet(`/subscriptions/${subId}`);
            periodEnd = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null;
          }
          const { error } = await supabase.from('profiles').update({
            plan: 'pro',
            cancel_at_period_end: false,
            subscription_period_end: periodEnd,
          }).eq('id', userId);
          if (error) console.error('[checkout.completed] update error:', error);
          else console.log(`[checkout.completed] userId=${userId} upgraded to pro`);
          await _incrementSubscriberCount();

        } else if (session.mode === 'payment') {
          const lineItemsData = await stripePost(`/checkout/sessions/${session.id}/line_items`, {});
          const priceId = lineItemsData.data?.[0]?.price?.id;
          if (priceId) await _grantOtpAccess(userId, priceId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
        if (profile) {
          await supabase.from('profiles').update({
            plan: 'free',
            cancel_at_period_end: false,
            subscription_period_end: null,
          }).eq('id', profile.id);
          await _decrementSubscriberCount();
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        console.log(`[sub.updated] customerId=${customerId} status=${sub.status} cancel_at_period_end=${sub.cancel_at_period_end} periodEnd=${periodEnd}`);
        const { data: profile, error: lookupErr } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
        if (lookupErr) console.error('[sub.updated] profile lookup error:', lookupErr);
        if (!profile) { console.warn('[sub.updated] no profile found for customerId:', customerId); break; }
        const { error: updateErr } = await supabase.from('profiles').update({
          plan: isActive ? 'pro' : 'free',
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          subscription_period_end: sub.cancel_at_period_end ? periodEnd : null,
        }).eq('id', profile.id);
        if (updateErr) console.error('[sub.updated] profile update error:', updateErr);
        else console.log(`[sub.updated] profile ${profile.id} updated successfully`);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function _incrementSubscriberCount() {
  const { data } = await supabase
    .from('settings').select('value').eq('key', 'subscriber_count').maybeSingle();
  const current = parseInt(data?.value || '0', 10);
  const next = current + 1;
  await supabase.from('settings')
    .upsert({ key: 'subscriber_count', value: String(next) }, { onConflict: 'key' });
  if (next >= SUB_PRICE_THRESHOLD) {
    console.log(`PRICING_TRIGGER: ${next} subscribers reached — switch to standard pricing ($14.99/mo)`);
  }
}

async function _decrementSubscriberCount() {
  const { data } = await supabase
    .from('settings').select('value').eq('key', 'subscriber_count').maybeSingle();
  const current = parseInt(data?.value || '0', 10);
  const next = Math.max(0, current - 1);
  await supabase.from('settings')
    .upsert({ key: 'subscriber_count', value: String(next) }, { onConflict: 'key' });
}

async function _grantOtpAccess(userId: string, priceId: string) {
  const OTP_MAP: Record<string, string> = {
    'price_1T82rkHcMBLR0w0VHwN27kRM': 'otp_roaster',
    'price_1T82s3HcMBLR0w0VWevxrO9S': 'otp_pivot',
    'price_1T82sOHcMBLR0w0VlPD5ySWH': 'otp_templates',
  };
  const flag = OTP_MAP[priceId];
  if (!flag) return;
  const { data: profile } = await supabase
    .from('profiles').select('purchases').eq('id', userId).maybeSingle();
  const purchases = (profile?.purchases as Record<string, boolean>) || {};
  purchases[flag] = true;
  await supabase.from('profiles').update({ purchases }).eq('id', userId);
}
