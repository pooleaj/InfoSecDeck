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

    const { jobDescription, jobTitle, resumeBase64, mimeType } = await req.json();

    if (!jobDescription || jobDescription.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Job description is required (minimum 50 characters)' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) specialist and cybersecurity hiring consultant. Analyze the match between the job description and the provided resume or profile information.

Respond with ONLY valid JSON, no markdown, no preamble:
{
  "match_score": <0-100>,
  "match_label": "<Excellent Match|Strong Match|Moderate Match|Partial Match|Weak Match>",
  "verdict": "<1-sentence overall assessment>",
  "matched_keywords": ["<keyword>", ...],
  "missing_keywords": ["<keyword>", ...],
  "skill_gaps": [
    {"skill": "<skill name>", "importance": "<critical|important|nice-to-have>", "note": "<1 sentence on why it matters and how to close it>"}
  ],
  "strengths": [
    {"area": "<strength area>", "note": "<1 sentence on what aligns well>"}
  ],
  "recommendations": [
    {"action": "<verb-first specific action>", "priority": "<high|med|low>", "detail": "<1 sentence>"}
  ],
  "apply_recommendation": "<Apply Now|Apply With Strong Cover Letter|Upskill First (3-6 months)|Not Ready Yet>"
}
Rules:
- matched_keywords: 5-15 specific technical keywords/skills/certs found in both JD and resume
- missing_keywords: 3-10 important keywords from JD not in resume
- skill_gaps: 3-5 gaps with priority ranking
- strengths: 2-4 areas where candidate is well-positioned
- recommendations: 4-6 specific, actionable items (resume edits, skills to add, certs to get)
- match_score: 30-60 is typical; 70+ is strong; 85+ is exceptional
- Be SPECIFIC to the actual job description and resume content provided`;

    // Build message content
    let resumeSection = '';
    const hasResume = !!resumeBase64;

    if (hasResume) {
      const isDocx = mimeType && mimeType.includes('wordprocessingml');
      if (isDocx) {
        const resumeText = await extractDocxText(resumeBase64);
        resumeSection = `\n\nRESUME CONTENT:\n${resumeText}`;
      } else {
        // PDF: use document content block
        const userMsg = `Please analyze the ATS match between this job description and the attached resume.${jobTitle ? `\n\nJob Title: ${jobTitle}` : ''}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nReturn complete JSON analysis.`;
        const messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: resumeBase64 } },
          { type: 'text', text: userMsg },
        ];

        const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
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
        try { result = JSON.parse(cleaned); }
        catch { const m = raw.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); else throw new Error('Failed to parse response'); }

        const title = jobTitle || 'ATS Scan';
        Promise.all([
          supabaseAdmin.from('saved_analyses').insert({ user_id: user.id, type: 'ats', title, score: result.match_score, result, meta: { jobTitle, hasResume: true, fileType: 'pdf' } }),
          supabaseAdmin.from('feature_events').insert({ user_id: user.id, event: 'ats_scan_completed', meta: { match_score: result.match_score, has_resume: true } }),
        ]).catch(e => console.error('[ats-scanner] post-success error:', e));

        console.log(`[ats-scanner] userId=${user.id} score=${result.match_score} hasResume=true pdf`);
        return new Response(JSON.stringify(result), { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    // Text-only path (no resume or DOCX resume)
    const userMsg = `Please analyze the ATS match.${jobTitle ? `\n\nJob Title: ${jobTitle}` : ''}\n\nJOB DESCRIPTION:\n${jobDescription}${resumeSection || '\n\nNote: No resume provided — provide general keyword analysis and recommendations based on the job description alone.'}\n\nReturn complete JSON analysis.`;

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
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
    try { result = JSON.parse(cleaned); }
    catch { const m = raw.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]); else throw new Error('Failed to parse response: ' + raw.slice(0, 200)); }

    const isDocxFile = hasResume && mimeType && mimeType.includes('wordprocessingml');
    const title = jobTitle || 'ATS Scan';
    Promise.all([
      supabaseAdmin.from('saved_analyses').insert({ user_id: user.id, type: 'ats', title, score: result.match_score, result, meta: { jobTitle, hasResume, fileType: isDocxFile ? 'docx' : 'none' } }),
      supabaseAdmin.from('feature_events').insert({ user_id: user.id, event: 'ats_scan_completed', meta: { match_score: result.match_score, has_resume: hasResume } }),
    ]).catch(e => console.error('[ats-scanner] post-success error:', e));

    console.log(`[ats-scanner] userId=${user.id} score=${result.match_score} hasResume=${hasResume}`);

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[ats-scanner] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Scan failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
