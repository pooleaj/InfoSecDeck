import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import JSZip from 'https://esm.sh/jszip@3?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const OTP_LIMIT = 3; // OTP users get 3 pivot analyses

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractDocxText(base64: string): Promise<string> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) throw new Error('Invalid DOCX: missing word/document.xml');
  return docXml
    .replace(/<w:br[^>]*/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
}

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
      .from('profiles').select('plan, purchases').eq('id', user.id).maybeSingle();

    const isPro = profile?.plan === 'pro';
    const purchases = (profile?.purchases || {}) as Record<string, unknown>;
    const hasOtp = !!purchases.otp_pivot;

    if (!isPro && !hasOtp) {
      return new Response(JSON.stringify({ error: 'Pro or Career Pivot access required' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Usage limit check for OTP users
    if (!isPro && hasOtp) {
      const used = (purchases.otp_pivot_used as number) || 0;
      if (used >= OTP_LIMIT) {
        return new Response(JSON.stringify({ error: `Usage limit reached (${OTP_LIMIT} pivot analyses included with your purchase). Upgrade to Pro for unlimited access.` }), {
          status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    const { fromTitle, toTitle, expLabel, resumeBase64, mimeType } = await req.json();

    if (!fromTitle || !toTitle || !expLabel) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert cybersecurity career coach. Analyze the career pivot request and respond with ONLY valid JSON, no markdown, no preamble:
{
  "readiness": <0-100>,
  "readiness_label": "<one-line verdict, e.g. 'Well-positioned for this pivot'>",
  "summary": "<2-3 sentence honest assessment of this transition>",
  "transferable": [
    {"skill": "<skill name>", "strength": "<strong|moderate|partial>", "note": "<1 sentence>"}
  ],
  "gaps": [
    {"area": "<gap area>", "priority": "<critical|important|nice-to-have>", "note": "<1 sentence>"}
  ],
  "certifications": [
    {"name": "<cert name>", "order": <1-N>, "why": "<1 sentence>", "timeline": "<e.g. 3-4 months>"}
  ],
  "timeline": "<total duration, e.g. '12-18 months'>",
  "phases": [
    {"name": "<phase name>", "duration": "<e.g. months 1-3>", "focus": "<1-2 sentences>"}
  ],
  "steps": [
    {"action": "<verb-first action>", "detail": "<1 sentence>", "timeframe": "<this week|this month>"}
  ]
}
Rules: 3-6 transferable skills, 3-5 gaps, 2-4 certifications in priority order, 2-4 timeline phases, exactly 3 first steps. Be SPECIFIC and HONEST. Readiness 40-70 is typical; 80+ means strong overlap.`;

    const resumeContext = resumeBase64 ? ' Here is my resume for personalized analysis.' : '';
    const userMsg = `I want to transition from ${fromTitle} to ${toTitle}. I have ${expLabel} of cybersecurity experience.${resumeContext} Give me a detailed career pivot plan.`;

    let messageContent;
    if (resumeBase64) {
      const isDocx = mimeType && mimeType.includes('wordprocessingml');
      if (isDocx) {
        const resumeText = await extractDocxText(resumeBase64);
        messageContent = [{ type: 'text', text: `Resume Content:\n\n${resumeText}\n\n---\n\n${userMsg}` }];
      } else {
        messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resumeBase64 } },
          { type: 'text', text: userMsg },
        ];
      }
    } else {
      messageContent = [{ type: 'text', text: userMsg }];
    }

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!claudeResp.ok) {
      const errText = await claudeResp.text();
      throw new Error(`Claude API ${claudeResp.status}: ${errText.slice(0, 300)}`);
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
      else throw new Error('Failed to parse response: ' + raw.slice(0, 200));
    }

    const used = (purchases.otp_pivot_used as number) || 0;

    // Fire-and-forget: save result + increment usage + log analytics
    Promise.all([
      supabaseAdmin.from('saved_analyses').insert({
        user_id: user.id,
        type: 'pivot',
        title: `${fromTitle} → ${toTitle}`,
        score: result.readiness,
        result,
        meta: { fromTitle, toTitle, expLabel, hasResume: !!resumeBase64 },
      }),
      ...((!isPro && hasOtp) ? [
        supabaseAdmin.from('profiles').update({
          purchases: { ...purchases, otp_pivot_used: used + 1 },
        }).eq('id', user.id),
      ] : []),
      supabaseAdmin.from('feature_events').insert({
        user_id: user.id,
        event: 'pivot_completed',
        meta: { fromTitle, toTitle, readiness: result.readiness, is_otp: !isPro && hasOtp, uses_remaining: !isPro && hasOtp ? OTP_LIMIT - used - 1 : null },
      }),
    ]).catch(e => console.error('[career-pivot] post-success error:', e));

    console.log(`[career-pivot] userId=${user.id} from=${fromTitle} to=${toTitle} readiness=${result.readiness}`);

    const responsePayload = {
      ...result,
      ...(!isPro && hasOtp ? { _usesRemaining: OTP_LIMIT - used - 1 } : {}),
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[career-pivot] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Analysis failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
