import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERSONA_STYLES: Record<string, string> = {
  technical: 'You are a Senior Security Engineer conducting a technical interview. Ask precise, implementation-level questions. Focus on tools, architectures, attack/defense techniques, and hands-on experience. Be thorough but fair.',
  ciso: 'You are a CISO conducting a strategic interview. Focus on risk management, business alignment, communicating security to executives, budget prioritization, and leadership scenarios.',
  hr: 'You are a Talent Acquisition specialist conducting a behavioral interview. Use STAR-method style questions. Focus on teamwork, communication, problem-solving approach, conflict resolution, and motivation.',
};

const DIFFICULTY_NOTES: Record<string, string> = {
  entry: 'entry-level candidate (0–2 years of experience)',
  mid: 'mid-level practitioner (3–5 years of experience)',
  senior: 'senior practitioner (6+ years of experience)',
};

async function callClaude(system: string, userMsg: string, maxTokens = 1024): Promise<unknown> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json() as { content: Array<{ type: string; text?: string }> };
  const raw = data.content.map(c => c.text || '').join('');
  const cleaned = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Failed to parse Claude response: ' + raw.slice(0, 200));
  }
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
    const purchases = (profile?.purchases as Record<string, unknown>) || {};

    const body = await req.json() as {
      action: string;
      role?: string;
      persona?: string;
      difficulty?: string;
      question?: string;
      answer?: string;
      questionType?: string;
      isFollowup?: boolean;
      fillerWordCount?: number;
      mode?: string;
      qaHistory?: Array<{ question: string; answer: string; score: number; isFollowup: boolean }>;
    };

    const { action } = body;

    // ── START ──────────────────────────────────────────────────────────────────
    if (action === 'start') {
      if (!isPro) {
        const mockUsed = (purchases.mock_used as number) || 0;
        if (mockUsed >= 1) {
          return new Response(JSON.stringify({ error: 'free_limit_reached' }), {
            status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }
        // Consume the free session
        await supabaseAdmin.from('profiles').update({
          purchases: { ...purchases, mock_used: mockUsed + 1 },
        }).eq('id', user.id);
      }

      const persona = body.persona || 'technical';
      const difficulty = body.difficulty || 'mid';
      const role = body.role || 'SOC Analyst';
      const personaStyle = PERSONA_STYLES[persona] || PERSONA_STYLES.technical;
      const diffNote = DIFFICULTY_NOTES[difficulty] || DIFFICULTY_NOTES.mid;

      const system = `${personaStyle}

You are interviewing a ${diffNote} for a ${role} position.

Generate exactly 5 interview questions. Return ONLY valid JSON with no markdown:
{
  "questions": [
    {"id": 1, "question": "...", "type": "technical|behavioral|situational|strategic"},
    {"id": 2, "question": "...", "type": "..."},
    {"id": 3, "question": "...", "type": "..."},
    {"id": 4, "question": "...", "type": "..."},
    {"id": 5, "question": "...", "type": "..."}
  ]
}

Rules:
- Mix question types based on persona: technical persona → 3 technical + 1 behavioral + 1 situational; ciso → 2 strategic + 2 situational + 1 behavioral; hr → 3 behavioral + 1 situational + 1 motivation
- Progress from easier to harder (Q1 is accessible, Q5 is challenging)
- Be specific to the ${role} role — no generic questions
- Each question is 1–2 sentences, no sub-parts
- For technical persona: reference real tools, frameworks, or attack/defense scenarios`;

      const result = await callClaude(system, 'Generate the interview questions now.');
      return new Response(JSON.stringify(result), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── EVALUATE ───────────────────────────────────────────────────────────────
    if (action === 'evaluate') {
      const persona = body.persona || 'technical';
      const difficulty = body.difficulty || 'mid';
      const role = body.role || 'SOC Analyst';
      const question = body.question || '';
      const answer = body.answer || '';
      const isFollowup = body.isFollowup || false;
      const fillerWordCount = body.fillerWordCount || 0;

      const personaStyle = PERSONA_STYLES[persona] || PERSONA_STYLES.technical;
      const diffNote = DIFFICULTY_NOTES[difficulty] || DIFFICULTY_NOTES.mid;
      const fillerNote = fillerWordCount > 0
        ? `\nNote: The candidate used approximately ${fillerWordCount} filler word(s) (um/uh/like/you know). Factor this into communication assessment if relevant.`
        : '';

      const system = `${personaStyle}

Evaluate this interview answer from a ${diffNote} candidate applying for a ${role} position.${fillerNote}

Return ONLY valid JSON:
{
  "score": <1-10>,
  "feedback": "<2–3 sentences: what was good, what was specifically missing>",
  "strengths": ["<one specific strength>"],
  "improvements": ["<one specific improvement>"],
  "follow_up_question": <null or "a short clarifying follow-up question string" — only if score <= 5 AND this is NOT already a follow-up>
}

Scoring:
- 1–3: Poor — vague, inaccurate, or extremely brief
- 4–5: Below average — has some valid points but misses key concepts
- 6–7: Good — correct, reasonably specific, shows real knowledge
- 8–9: Strong — accurate, detailed, well-structured, uses specifics
- 10: Exceptional — comprehensive, insightful, shows mastery

Be honest. A timed-out or blank answer scores 1. isFollowup=${isFollowup} — if true, set follow_up_question to null always.`;

      const result = await callClaude(system, `Question: ${question}\n\nAnswer: ${answer}`, 512);
      return new Response(JSON.stringify(result), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── FINALIZE ───────────────────────────────────────────────────────────────
    if (action === 'finalize') {
      const persona = body.persona || 'technical';
      const difficulty = body.difficulty || 'mid';
      const role = body.role || 'SOC Analyst';
      const mode = body.mode || 'text';
      const qaHistory = body.qaHistory || [];
      const isVoice = mode === 'voice';

      const personaStyle = PERSONA_STYLES[persona] || PERSONA_STYLES.technical;
      const diffNote = DIFFICULTY_NOTES[difficulty] || DIFFICULTY_NOTES.mid;
      const avgScore = qaHistory.length
        ? qaHistory.reduce((s, q) => s + (q.score || 0), 0) / qaHistory.length
        : 0;

      const historyText = qaHistory.map((qa, i) =>
        `Q${i + 1}${qa.isFollowup ? ' (follow-up)' : ''}: ${qa.question}\nAnswer: ${qa.answer}\nScore: ${qa.score}/10`
      ).join('\n\n');

      const voiceDims = isVoice
        ? `,\n    "communication_clarity": <1-10>,\n    "confidence": <1-10>`
        : '';

      const system = `${personaStyle}

You evaluated a ${diffNote} candidate for a ${role} position across ${qaHistory.length} questions. Average score: ${avgScore.toFixed(1)}/10.

Based on all their answers, generate a final interview scorecard. Return ONLY valid JSON:
{
  "hire_recommendation": "<Strong Hire|Hire|Hold|No Hire>",
  "overall_score": <1-10>,
  "summary": "<2–3 sentences overall assessment of this candidate>",
  "dimension_scores": {
    "technical_accuracy": <1-10>,
    "depth_detail": <1-10>,
    "answer_structure": <1-10>${voiceDims}
  },
  "top_strength": "<one specific thing this candidate did well>",
  "top_improvement": "<one specific area to work on before next interview>",
  "next_session_focus": "<specific topic, cert, or skill to study before their next mock interview>"
}

Hire thresholds: 8+ avg → Strong Hire; 6–7.9 → Hire; 4–5.9 → Hold; <4 → No Hire. Use overall_score, not just the average.`;

      const result = await callClaude(system, `Full Q&A:\n\n${historyText}`, 1024) as Record<string, unknown>;

      // Persist to saved_analyses
      supabaseAdmin.from('saved_analyses').insert({
        user_id: user.id,
        type: 'interview',
        title: `${role} Mock Interview (${persona}, ${difficulty})`,
        score: result.overall_score,
        result: { ...result, qaHistory, mode, difficulty },
        meta: { role, persona, difficulty, mode, avgScore },
      }).then(({ error }) => {
        if (error) console.error('[mock-interview] saved_analyses insert error:', error.message);
      });

      console.log(`[mock-interview] userId=${user.id} role=${role} score=${result.overall_score} mode=${mode}`);
      return new Response(JSON.stringify(result), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[mock-interview] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Failed' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
