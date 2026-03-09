import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

function parseRSS(xml: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
    const link = (
      item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ||
      item.match(/<link\s+[^>]*href="([^"]+)"/)?.[1]?.trim() || ''
    );
    const desc = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    if (title && link) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').replace(/&quot;/g, '"'),
        link,
        description: desc
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ').trim().substring(0, 350),
        pubDate,
        source: sourceName,
      });
    }
  }
  return items.slice(0, 12);
}

async function fetchFeed(url: string, sourceName: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'InfoSecDeck/1.0 RSS Briefing Reader' },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, sourceName);
  } catch {
    return [];
  }
}

const DOMAIN_LABELS: Record<string, string> = {
  soc: 'SOC / Threat Detection',
  cloud: 'Cloud Security',
  grc: 'GRC & Compliance',
  iam: 'Identity & Access Management',
  appsec: 'Application Security',
  pentest: 'Penetration Testing',
  dfir: 'Digital Forensics & Incident Response',
  general: 'Cybersecurity',
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
      .from('profiles').select('plan, purchases').eq('id', user.id).maybeSingle();

    const isPro = profile?.plan === 'pro';

    const body = await req.json();
    const { domain = 'general', role = '', certs = [] } = body as {
      domain?: string; role?: string; certs?: string[];
    };

    // Fetch all 4 feeds in parallel
    const feedResults = await Promise.all([
      fetchFeed('https://feeds.feedburner.com/TheHackersNews', 'The Hacker News'),
      fetchFeed('https://www.bleepingcomputer.com/feed/', 'Bleeping Computer'),
      fetchFeed('https://therecord.media/feed', 'The Record'),
      fetchFeed('https://krebsonsecurity.com/feed/', 'Krebs on Security'),
    ]);

    const allItems = feedResults.flat();

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not fetch news feeds. Please try again.' }), {
        status: 503, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Deduplicate by title similarity, cap at 24 for Claude
    const seen = new Set<string>();
    const deduped: RSSItem[] = [];
    for (const item of allItems) {
      const key = item.title.toLowerCase().substring(0, 40);
      if (!seen.has(key)) { seen.add(key); deduped.push(item); }
      if (deduped.length >= 24) break;
    }

    const articleList = deduped.map((item, i) =>
      `${i + 1}. [${item.source}] ${item.title}\n   ${item.description || 'No description.'}`
    ).join('\n\n');

    const domainLabel = DOMAIN_LABELS[domain] || 'Cybersecurity';
    const userCtxParts = [
      role ? `Role: ${role}` : '',
      domain !== 'general' ? `Domain focus: ${domainLabel}` : '',
      certs.length ? `Certifications: ${certs.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean);
    const userContext = userCtxParts.join(' | ');

    const systemPrompt = `You are a cybersecurity news briefing assistant for InfoSecDeck. Select and summarize the 5-6 most important and relevant articles from the provided headline list.
${userContext ? `User context: ${userContext}` : 'User: general cybersecurity professional.'}
Prioritize: active exploits, zero-days, major breaches, significant vulnerabilities, and stories relevant to the user's domain.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "articles": [
    {
      "index": <number from list>,
      "title": "<clean headline under 100 chars>",
      "source": "<source name>",
      "summary": "<2-sentence plain-English summary of what happened>",
      "why_it_matters": "<1 sentence on why this matters for ${role ? 'a ' + role : 'a cybersecurity professional'}${domain !== 'general' ? ' in ' + domainLabel : ''}>",
      "urgency": "critical|high|medium|low",
      "tags": ["<tag1>", "<tag2>"]
    }
  ],
  "briefing_intro": "<2-3 sentence personalized intro summarizing today's threat landscape for the user>"
}

Urgency: critical=active exploit/zero-day/live breach, high=significant new CVE/major policy, medium=notable development, low=general industry news.
Tags (pick 1-3): ransomware, vulnerability, breach, cloud, IAM, APT, compliance, AI, zero-day, phishing, policy, malware, threat-intel, CISA, nation-state.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Here are today's cybersecurity headlines:\n\n${articleList}\n\nGenerate my personalized briefing as JSON.`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');
    const briefing = JSON.parse(jsonMatch[0]);

    // Attach original article links
    briefing.articles = (briefing.articles as Record<string, unknown>[]).map((a) => {
      const originalIdx = (a.index as number) - 1;
      const original = deduped[originalIdx];
      return { ...a, link: original?.link || '#', pubDate: original?.pubDate || '' };
    });

    briefing.generated_at = new Date().toISOString();
    briefing.is_pro = isPro;
    briefing.domain = domain;
    briefing.role = role;

    return new Response(JSON.stringify(briefing), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('daily-briefing error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
