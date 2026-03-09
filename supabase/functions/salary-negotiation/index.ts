import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('plan').eq('id', user.id).maybeSingle();

    if (profile?.plan !== 'pro') {
      return new Response(JSON.stringify({ error: 'Pro subscription required' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as {
      role: string;
      current_offer: number;
      target_salary: number;
      experience_years: string;
      strengths: string[];
      notes?: string;
    };

    const { role, current_offer, target_salary, experience_years, strengths, notes } = body;

    if (!role || !current_offer || !target_salary) {
      return new Response(JSON.stringify({ error: 'role, current_offer, and target_salary are required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const gap = target_salary - current_offer;
    const gapPct = Math.round((gap / current_offer) * 100);
    const strengthsList = (strengths || []).join(', ') || 'general experience and skills';

    const systemPrompt = `You are an expert salary negotiation coach specializing in cybersecurity roles. You write practical, natural-sounding negotiation scripts that candidates can actually use — not generic templates.

Generate a complete personalized negotiation script. Return ONLY valid JSON with no markdown:
{
  "current_offer": ${current_offer},
  "target_salary": ${target_salary},
  "success_likelihood": "<High|Moderate|Low> — <1 short reason>",
  "opening": "<2–3 sentences to open the negotiation call professionally and warmly>",
  "value_proposition": "<2–4 sentences articulating specific value based on their strengths>",
  "market_context": "<2–3 sentences citing market positioning to justify the ask — specific to ${role}>",
  "counter_offer": "<The exact words to say when naming the counter — include the specific dollar amount $${target_salary.toLocaleString()}>",
  "handle_pushback": "<2–4 sentences for when they say the number is above budget or they can't move>",
  "closing": "<2–3 sentences for gracefully closing — works for accept, delay, or decline scenarios>",
  "tips": ["<specific actionable negotiation tactic>", "<specific tactic>", "<specific tactic>"]
}

Candidate context:
- Role: ${role}
- Current offer: $${current_offer.toLocaleString()}
- Target salary: $${target_salary.toLocaleString()} (${gapPct}% increase, $${gap.toLocaleString()} gap)
- Experience: ${experience_years} years in the field
- Key strengths / leverage points: ${strengthsList}
${notes ? `- Additional context: ${notes}` : ''}

Rules:
- All sections must sound natural spoken aloud — avoid corporate-speak
- counter_offer must include the exact dollar figure
- ${gapPct > 25 ? 'This is a large ask — be especially strong on justification and market context' : 'This is a reasonable ask — project confidence without over-justifying'}
- tips should be specific tactics: e.g. "Let silence work for you after stating your number — count to 10 before speaking"
- Adjust for the leverage points provided (clearance and competing offers are especially powerful)`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate the salary negotiation script now.' }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Claude API ${resp.status}: ${err.slice(0, 200)}`);
    }

    const data = await resp.json() as { content: Array<{ type: string; text?: string }> };
    const raw = data.content.map(c => c.text || '').join('');
    const cleaned = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim();

    let result;
    try { result = JSON.parse(cleaned); }
    catch { const m = raw.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); else throw new Error('Failed to parse response'); }

    supabaseAdmin.from('feature_events').insert({
      user_id: user.id,
      event: 'salary_negotiation_generated',
      meta: { role, current_offer, target_salary, gap_pct: gapPct },
    }).catch(() => {});

    console.log(`[salary-negotiation] userId=${user.id} role=${role} offer=${current_offer} target=${target_salary}`);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[salary-negotiation] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
