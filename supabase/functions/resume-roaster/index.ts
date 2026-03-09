import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import JSZip from 'https://esm.sh/jszip@3?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const OTP_LIMIT = 5; // OTP users get 5 roasts

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
    const hasOtp = !!purchases.otp_roaster;

    if (!isPro && !hasOtp) {
      return new Response(JSON.stringify({ error: 'Pro or Resume Roaster access required' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Usage limit check for OTP users
    if (!isPro && hasOtp) {
      const used = (purchases.otp_roaster_used as number) || 0;
      if (used >= OTP_LIMIT) {
        return new Response(JSON.stringify({ error: `Usage limit reached (${OTP_LIMIT} roasts included with your purchase). Upgrade to Pro for unlimited access.` }), {
          status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    const { resumeBase64, mimeType, domain, tier, jobTitle, intensity } = await req.json();

    if (!resumeBase64 || !domain || !tier) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const intensityInstr: Record<string, string> = {
      balanced: 'Be balanced, honest, and constructive. Note strengths alongside weaknesses.',
      brutal: 'Be brutally direct. No sugarcoating. Call out every weakness clearly.',
      gentle: 'Lead with strengths. Frame weaknesses as growth opportunities. Be encouraging.',
    };

    const systemPrompt = `You are InfoSecDeck Resume Roaster — a senior cybersecurity hiring manager with 20+ years experience. ${intensityInstr[intensity] || intensityInstr.balanced}

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "score": <0-100>,
  "grade": "<A+/A/A-/B+/B/B-/C+/C/C-/D+/D/F>",
  "grade_label": "<one-line verdict>",
  "verdict": "<1-sentence punch>",
  "summary": "<2-3 sentence assessment>",
  "dimensions": [
    {"name":"Relevant Experience","score":<0-100>,"note":"<1-2 sentences>"},
    {"name":"Technical Skills Match","score":<0-100>,"note":"<1-2 sentences>"},
    {"name":"Certifications","score":<0-100>,"note":"<1-2 sentences>"},
    {"name":"Impact & Quantification","score":<0-100>,"note":"<1-2 sentences>"},
    {"name":"Keywords & ATS","score":<0-100>,"note":"<1-2 sentences>"},
    {"name":"Formatting & Clarity","score":<0-100>,"note":"<1-2 sentences>"}
  ],
  "feedback": [
    {"type":"<critical|warning|tip|strength>","title":"<short title>","body":"<2-4 sentences specific to resume>","quote":"<excerpt or empty string>"}
  ],
  "actions": [
    {"text":"<start with a verb>","priority":"<high|med|low>"}
  ]
}
Rules: 5-8 feedback items, 5-8 actions. Be SPECIFIC to the actual resume content. Most resumes score 40-75. 80+ is genuinely strong.`;

    const userMsg = `Analyze this resume for:\nTarget Domain: ${domain}\nTarget Tier: ${tier}${jobTitle ? `\nJob Title: ${jobTitle}` : ''}\n\nReturn complete JSON analysis.`;

    const isDocx = mimeType && mimeType.includes('wordprocessingml');
    let messageContent;

    if (isDocx) {
      const resumeText = await extractDocxText(resumeBase64);
      messageContent = [{ type: 'text', text: `Resume Content:\n\n${resumeText}\n\n---\n\n${userMsg}` }];
    } else {
      messageContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resumeBase64 } },
        { type: 'text', text: userMsg },
      ];
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
        max_tokens: 4096,
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
      else throw new Error('Failed to parse Claude response: ' + raw.slice(0, 200));
    }

    const used = (purchases.otp_roaster_used as number) || 0;

    // Fire-and-forget: save result + increment usage + log analytics
    const saveTitle = `${domain} — ${tier}${jobTitle ? ` (${jobTitle})` : ''}`;
    Promise.all([
      // Save analysis
      supabaseAdmin.from('saved_analyses').insert({
        user_id: user.id,
        type: 'roast',
        title: saveTitle,
        score: result.score,
        result,
        meta: { domain, tier, jobTitle: jobTitle || null, intensity, fileType: isDocx ? 'docx' : 'pdf' },
      }),
      // Increment OTP usage count (only for OTP users, not Pro)
      ...((!isPro && hasOtp) ? [
        supabaseAdmin.from('profiles').update({
          purchases: { ...purchases, otp_roaster_used: used + 1 },
        }).eq('id', user.id),
      ] : []),
      // Log analytics event
      supabaseAdmin.from('feature_events').insert({
        user_id: user.id,
        event: 'roast_completed',
        meta: { domain, tier, score: result.score, is_otp: !isPro && hasOtp, uses_remaining: !isPro && hasOtp ? OTP_LIMIT - used - 1 : null },
      }),
    ]).catch(e => console.error('[resume-roaster] post-success error:', e));

    console.log(`[resume-roaster] userId=${user.id} score=${result.score} type=${isDocx ? 'docx' : 'pdf'}`);

    // Return result + usage info for OTP users
    const responsePayload = {
      ...result,
      ...(!isPro && hasOtp ? { _usesRemaining: OTP_LIMIT - used - 1 } : {}),
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[resume-roaster] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Analysis failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
