import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const FREE_LIMIT = 3;
const PRO_LIMIT = 30;
const FEATURE = 'career_roadmap';

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

    const isPro = profile?.plan === 'pro';
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

    const body = await req.json();
    const { currentRole = '', nextGoal = '', ultimateGoal = '', certs = [], yearsExp = null } = body as {
      currentRole?: string; nextGoal?: string; ultimateGoal?: string; certs?: string[]; yearsExp?: number | null;
    };

    if (!currentRole || !nextGoal) {
      return new Response(JSON.stringify({ error: 'currentRole and nextGoal are required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const hasUltimate = ultimateGoal && ultimateGoal.trim() !== nextGoal.trim();
    const certList = certs.length ? `Completed certifications: ${certs.slice(0, 8).join(', ')}.` : 'No certifications on record.';

    // Estimate timeline length — longer if ultimate goal is far (CISO, VP, etc.)
    const isLongPath = /ciso|chief|vp|vice president|director|principal/i.test(ultimateGoal || nextGoal);
    const phaseCount = hasUltimate ? (isLongPath ? 6 : 5) : 4;

    const systemPrompt = `You are an expert cybersecurity career advisor for InfoSecDeck. Generate a structured, actionable, multi-phase career roadmap for a cybersecurity professional.

User context:
- Current role: ${currentRole}
- Years of experience: ${yearsExp != null ? yearsExp + ' year' + (yearsExp !== 1 ? 's' : '') : 'not specified'}
- ${certList}
- Next career goal: ${nextGoal}
- Ultimate career goal: ${ultimateGoal || '(same as next goal)'}

Generate exactly ${phaseCount} phases. Each phase should have a clear label (e.g. "0–6 Months", "6–12 Months", "1–2 Years", "2–5 Years"${isLongPath ? ', "5–8 Years", "8+ Years"' : ''}) and contain 3–5 concrete milestones.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "summary": "<2-3 sentence personalized overview of the journey from current role to goals, mentioning their existing certs>",
  "estimated_timeline": "<concise timeline estimate, e.g. '2–3 years to ${nextGoal}${hasUltimate ? ', 7–10 years to ' + ultimateGoal : ''}'>",
  "phases": [
    {
      "label": "<phase label, e.g. '0–6 Months'>",
      "theme": "<3–5 word phase theme, e.g. 'Build the Foundation'>",
      "milestones": [
        {
          "type": "cert|role|training|project",
          "title": "<specific, actionable title under 60 chars>",
          "desc": "<1-sentence concrete description of what to do and why>",
          "priority": "must|should|nice"
        }
      ]
    }
  ]
}

Priority guide: must=non-negotiable for this transition, should=strongly recommended, nice=bonus differentiator.
Types: cert=certification to earn, role=job title to apply for, training=course/lab/platform to complete, project=hands-on project to build.
Be specific: name actual certifications (Security+, OSCP, CISSP), real platforms (TryHackMe, HackTheBox), and concrete projects (build a home SIEM, complete HTB Pro Labs).
Do not include placeholder text or generic advice. Tailor every milestone to the user's specific start and end points.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate my personalized cybersecurity career roadmap as JSON.' }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');
    const roadmap = JSON.parse(jsonMatch[0]);

    // Increment usage
    await supabaseAdmin.from('feature_usage').upsert({
      user_id: user.id,
      feature: FEATURE,
      month_key: monthKey,
      count: currentCount + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,feature,month_key' });

    roadmap.generated_at = new Date().toISOString();
    roadmap.is_pro = isPro;
    roadmap._usageInfo = { used: currentCount + 1, limit, remaining: Math.max(0, limit - currentCount - 1) };

    return new Response(JSON.stringify(roadmap), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('career-roadmap error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
