import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).maybeSingle();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Parse optional month_key param (defaults to current month)
    const url = new URL(req.url);
    const monthKey = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Get all feature_usage rows for the month, joined with profile email
    const { data: usageRows, error: usageError } = await supabaseAdmin
      .from('feature_usage')
      .select('user_id, feature, count, updated_at')
      .eq('month_key', monthKey)
      .order('count', { ascending: false });

    if (usageError) throw new Error(usageError.message);

    if (!usageRows || usageRows.length === 0) {
      return new Response(JSON.stringify({ month: monthKey, users: [], totals: {} }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Get profile info for all users with usage
    const userIds = [...new Set(usageRows.map((r: { user_id: string }) => r.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, username, plan')
      .in('id', userIds);

    const profileMap: Record<string, { email: string; username: string; plan: string }> = {};
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    (authUsers?.users || []).forEach((u: { id: string; email?: string }) => {
      if (userIds.includes(u.id)) {
        profileMap[u.id] = { email: u.email || u.id, username: '', plan: 'free' };
      }
    });
    (profiles || []).forEach((p: { id: string; username: string; plan: string }) => {
      if (profileMap[p.id]) {
        profileMap[p.id].username = p.username || '';
        profileMap[p.id].plan = p.plan || 'free';
      }
    });

    // Aggregate per user
    const userMap: Record<string, Record<string, number>> = {};
    (usageRows as Array<{ user_id: string; feature: string; count: number }>).forEach(row => {
      if (!userMap[row.user_id]) userMap[row.user_id] = {};
      userMap[row.user_id][row.feature] = row.count;
    });

    const users = Object.entries(userMap).map(([uid, features]) => ({
      user_id: uid,
      email: profileMap[uid]?.email || uid,
      username: profileMap[uid]?.username || '',
      plan: profileMap[uid]?.plan || 'free',
      roaster: features.roaster || 0,
      pivot: features.pivot || 0,
      ats: features.ats || 0,
      jobfit: features.jobfit || 0,
      total: Object.values(features).reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.total - a.total);

    // Feature totals
    const totals = {
      roaster: users.reduce((s, u) => s + u.roaster, 0),
      pivot: users.reduce((s, u) => s + u.pivot, 0),
      ats: users.reduce((s, u) => s + u.ats, 0),
      jobfit: users.reduce((s, u) => s + u.jobfit, 0),
    };

    return new Response(JSON.stringify({ month: monthKey, users, totals }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[admin-usage] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
