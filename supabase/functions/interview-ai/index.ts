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

    // Pro-only feature
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

    const { jobTitle, question, answer } = await req.json();

    if (!jobTitle || !question || !answer) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a senior cybersecurity hiring manager conducting a technical interview. Given a standard interview Q&A, generate a sharp follow-up question that probes deeper — the kind a real interviewer asks to distinguish a memorized answer from genuine expertise.

Respond with ONLY valid JSON, no markdown:
{
  "followUp": "<the follow-up question>",
  "hint": "<1-2 sentences on what a strong answer to the follow-up must cover>",
  "redFlag": "<1 sentence on the most common mistake or weak answer pattern to avoid>"
}`;

    const userMsg = `Role: ${jobTitle}\n\nOriginal question: ${question}\n\nStandard answer: ${answer}\n\nGenerate a sharp interviewer follow-up.`;

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!claudeResp.ok) {
      const errText = await claudeResp.text();
      throw new Error(`Claude API ${claudeResp.status}: ${errText.slice(0, 200)}`);
    }

    const claudeData = await claudeResp.json();
    const raw = claudeData.content.map((c: { type: string; text?: string }) => c.text || '').join('');
    const cleaned = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) result = JSON.parse(m[0]);
      else throw new Error('Failed to parse response');
    }

    // Fire-and-forget analytics
    supabaseAdmin.from('feature_events').insert({
      user_id: user.id,
      event: 'interview_ai_used',
      meta: { jobTitle },
    }).catch(e => console.error('[interview-ai] analytics error:', e));

    console.log(`[interview-ai] userId=${user.id} role=${jobTitle}`);

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[interview-ai] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
