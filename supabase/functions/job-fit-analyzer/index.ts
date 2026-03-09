import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const FREE_LIMIT = 3;  // Free users: 3 analyses/month
const PRO_LIMIT = 30;  // Pro users: 30 analyses/month
const FEATURE = 'jobfit';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CERT_LEVEL_MAP: Record<string, string> = {
  none: 'no relevant certifications held',
  entry: '1–2 entry-level certifications (e.g. CompTIA Security+, Google Cybersecurity)',
  mid: '1–2 mid-level certifications (e.g. CySA+, GCIH, CEH, CCSP)',
  strong: 'multiple relevant certifications including advanced/senior-level certs (e.g. CISSP, CISM, OSCP)',
};

const EXP_MAP: Record<string, string> = {
  '0': '0–1 year of experience',
  '1': '1–2 years of experience',
  '3': '3–5 years of experience',
  '6': '6–9 years of experience',
  '10': '10+ years of experience',
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

    const isPro = profile?.plan === 'pro';

    // Monthly rate limit
    const monthKey = new Date().toISOString().slice(0, 7);
    const { data: usageRow } = await supabaseAdmin
      .from('feature_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('feature', FEATURE)
      .eq('month_key', monthKey)
      .maybeSingle();

    const currentCount = (usageRow?.count as number) || 0;
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

    if (currentCount >= limit) {
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        limit,
        used: currentCount,
        plan: isPro ? 'pro' : 'free',
      }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json() as {
      job_description: string;
      experience_years: string;
      certs_level: string;
      elevator_pitch?: string;
    };

    const { job_description, experience_years, certs_level, elevator_pitch } = body;

    if (!job_description || job_description.trim().length < 100) {
      return new Response(JSON.stringify({ error: 'Job description is required (minimum 100 characters)' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const expLabel = EXP_MAP[experience_years] || `${experience_years} years of experience`;
    const certLabel = CERT_LEVEL_MAP[certs_level] || certs_level;

    const systemPrompt = `You are a senior cybersecurity hiring manager and career coach with 15+ years of experience reviewing candidates. Your job is to give candidates a brutally honest, practical assessment of their fit for a specific role — so they can make a smart decision about whether to apply now or invest time closing gaps first.

Return ONLY valid JSON with no markdown:
{
  "fit_score": <0-100>,
  "fit_label": "<Strong Candidate|Competitive Candidate|Reach Role|Not Ready Yet>",
  "honest_take": "<2-3 sentences of direct, honest assessment — no sugarcoating, but constructive>",
  "dimension_scores": {
    "experience": <0-100>,
    "certifications": <0-100>,
    "technical_skills": <0-100>,
    "domain_knowledge": <0-100>
  },
  "gaps": [
    {"gap": "<specific gap name>", "how_to_close": "<specific, actionable step with timeline estimate>"},
    {"gap": "...", "how_to_close": "..."}
  ],
  "recommendation": "<Apply Now|Apply with Strong Cover Letter|Close 1–2 gaps first (3–6 months)|Not ready yet (6–12 months to prepare)>"
}

Candidate profile:
- Experience: ${expLabel}
- Certifications: ${certLabel}
${elevator_pitch ? `- Background: ${elevator_pitch}` : '- Background: Not provided'}

Fit score thresholds:
- 75–100: Strong Candidate — clear fit, likely to advance
- 55–74: Competitive Candidate — viable but not a lock, needs strong application
- 35–54: Reach Role — real gaps exist, worth applying if willing to hustle
- 0–34: Not Ready Yet — would likely be filtered out at ATS or screen stage

Rules:
- dimension_scores are percentages (0–100), not points
- gaps should be 2–4 items, most impactful first
- how_to_close must be specific: "Earn CySA+ (2–3 months of study)" not just "get certified"
- honest_take should reflect reality — if they're underqualified, say so constructively
- Consider that cybersecurity is a field where passion + certs can offset years of experience at entry/mid levels

Job Description (first 3000 chars):
${job_description.slice(0, 3000)}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Analyze this candidate\'s fit and return the scorecard JSON.' }],
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

    const typedResult = result as Record<string, unknown>;
    const newCount = currentCount + 1;

    // Fire-and-forget: increment usage + log analytics
    Promise.all([
      supabaseAdmin.from('feature_usage').upsert({
        user_id: user.id, feature: FEATURE, month_key: monthKey,
        count: newCount, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,feature,month_key' }),
      supabaseAdmin.from('feature_events').insert({
        user_id: user.id,
        event: 'job_fit_analyzed',
        meta: { fit_score: typedResult.fit_score, fit_label: typedResult.fit_label, experience_years, certs_level },
      }),
    ]).catch(() => {});

    console.log(`[job-fit-analyzer] userId=${user.id} fit_score=${typedResult.fit_score} label=${typedResult.fit_label}`);
    return new Response(JSON.stringify({
      ...result,
      _usageInfo: { used: newCount, limit, remaining: limit - newCount },
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[job-fit-analyzer] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
