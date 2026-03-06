import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Pricing cadence: auto-switch standard price at 100 subscribers
const SUB_PRICE_THRESHOLD = 100;

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook signature error', { status: 400 });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        if (session.mode === 'subscription') {
          // Fetch subscription to get period end
          const subId = session.subscription as string;
          let periodEnd: string | null = null;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            periodEnd = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null;
          }
          await supabase.from('profiles').update({
            plan: 'pro',
            cancel_at_period_end: false,
            subscription_period_end: periodEnd,
          }).eq('id', userId);

          // Increment subscriber count in settings
          await _incrementSubscriberCount();

        } else if (session.mode === 'payment') {
          // One-time purchase — mark which product they bought
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          if (priceId) {
            await _grantOtpAccess(userId, priceId);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
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
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (profile) {
          await supabase.from('profiles').update({
            plan: isActive ? 'pro' : 'free',
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            subscription_period_end: sub.cancel_at_period_end ? periodEnd : null,
          }).eq('id', profile.id);
        }
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
    .from('settings')
    .select('value')
    .eq('key', 'subscriber_count')
    .maybeSingle();

  const current = parseInt(data?.value || '0', 10);
  const next = current + 1;

  await supabase
    .from('settings')
    .upsert({ key: 'subscriber_count', value: String(next) }, { onConflict: 'key' });

  // Auto-switch to standard pricing note (logged for manual Stripe price update)
  if (next >= SUB_PRICE_THRESHOLD) {
    console.log(`PRICING_TRIGGER: ${next} subscribers reached — switch to standard pricing ($14.99/mo)`);
  }
}

async function _decrementSubscriberCount() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'subscriber_count')
    .maybeSingle();

  const current = parseInt(data?.value || '0', 10);
  const next = Math.max(0, current - 1);

  await supabase
    .from('settings')
    .upsert({ key: 'subscriber_count', value: String(next) }, { onConflict: 'key' });
}

async function _grantOtpAccess(userId: string, priceId: string) {
  // Map price IDs to purchase flags — update these with your actual Stripe price IDs
  const OTP_MAP: Record<string, string> = {
    'price_1T82rkHcMBLR0w0VHwN27kRM': 'otp_roaster',
    'price_1T82s3HcMBLR0w0VWevxrO9S': 'otp_pivot',
    'price_1T82sOHcMBLR0w0VlPD5ySWH': 'otp_templates',
  };
  const flag = OTP_MAP[priceId];
  if (!flag) return;

  // Store as JSONB in profiles.purchases column
  const { data: profile } = await supabase
    .from('profiles')
    .select('purchases')
    .eq('id', userId)
    .maybeSingle();

  const purchases = (profile?.purchases as Record<string, boolean>) || {};
  purchases[flag] = true;

  await supabase.from('profiles').update({ purchases }).eq('id', userId);
}
