import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import JSZip from 'https://esm.sh/jszip@3?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

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
    .replace(/<w:br[^>]*/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
      .from('profiles')
      .select('plan, purchases')
      .eq('id', user.id)
      .maybeSingle();

    const isPro = profile?.plan === 'pro';
    const hasOtp = !!(profile?.purchases as Record<string, boolean>)?.otp_pivot;

    if (!isPro && !hasOtp) {
      return new Response(JSON.stringify({ error: 'Pro or Career Pivot access required' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { fromTitle, toTitle, expLabel, resumeBase64, mimeType } = await req.json();

    if (!fromTitle || !toTitle || !expLabel) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = 'You are an expert cybersecurity career coach with deep knowledge of all cybersecurity domains, job roles, and career paths. Give direct, specific, actionable advice. Format your response with clear sections using plain text headers (no markdown bold or asterisks). Use line breaks between sections. Be honest about challenges. Experience always matters more than certifications, though certs validate skills. Keep response under 600 words.';

    let messageContent;

    if (resumeBase64) {
      const isDocx = mimeType && mimeType.includes('wordprocessingml');
      const userMsg = `I want to transition from ${fromTitle} to ${toTitle}. I have ${expLabel} of cybersecurity experience. Here is my resume. Please give me a detailed, personalized career pivot plan covering: 1) Skills I already have that transfer, 2) Key gaps I need to fill based on my actual experience, 3) Specific certifications to pursue (in priority order), 4) Realistic timeline, 5) Concrete first 3 steps to start this week.`;

      if (isDocx) {
        const resumeText = await extractDocxText(resumeBase64);
        messageContent = [
          { type: 'text', text: `Resume Content:\n\n${resumeText}\n\n---\n\n${userMsg}` },
        ];
      } else {
        messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resumeBase64 } },
          { type: 'text', text: userMsg },
        ];
      }
    } else {
      const userMsg = `I want to transition from ${fromTitle} to ${toTitle}. I have ${expLabel} of cybersecurity experience. Please give me a career pivot plan covering: 1) Which skills likely transfer from my current role, 2) Key gaps I will need to fill, 3) Top 3 certifications to prioritize, 4) Realistic timeline for the transition, 5) Concrete first 3 steps to start this week.`;
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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!claudeResp.ok) {
      const errText = await claudeResp.text();
      throw new Error(`Claude API ${claudeResp.status}: ${errText.slice(0, 300)}`);
    }

    const claudeData = await claudeResp.json();
    const text = claudeData.content
      .map((c: { type: string; text?: string }) => c.text || '')
      .join('');

    console.log(`[career-pivot] userId=${user.id} from=${fromTitle} to=${toTitle}`);

    return new Response(JSON.stringify({ text }), {
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
