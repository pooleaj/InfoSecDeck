import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const JSEARCH_API_KEY = Deno.env.get('JSEARCH_API_KEY')!;
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Skills to auto-detect in job descriptions
const SKILL_PATTERNS: [RegExp, string][] = [
  [/splunk/i, 'Splunk'],
  [/siem/i, 'SIEM'],
  [/python/i, 'Python'],
  [/aws/i, 'AWS'],
  [/azure/i, 'Azure'],
  [/gcp|google cloud/i, 'GCP'],
  [/kubernetes|k8s/i, 'Kubernetes'],
  [/terraform/i, 'Terraform'],
  [/cissp/i, 'CISSP'],
  [/cism/i, 'CISM'],
  [/ceh/i, 'CEH'],
  [/security\+|sec\+/i, 'Security+'],
  [/oscp/i, 'OSCP'],
  [/pentest|penetration test/i, 'Penetration Testing'],
  [/soc\b/i, 'SOC'],
  [/incident response|dfir/i, 'DFIR'],
  [/threat intel/i, 'Threat Intelligence'],
  [/zero trust/i, 'Zero Trust'],
  [/devsecops/i, 'DevSecOps'],
  [/iam\b|identity.*access/i, 'IAM'],
  [/okta/i, 'Okta'],
  [/crowdstrike/i, 'CrowdStrike'],
  [/palo alto/i, 'Palo Alto'],
  [/fortinet/i, 'Fortinet'],
  [/nessus/i, 'Nessus'],
  [/burp suite/i, 'Burp Suite'],
  [/metasploit/i, 'Metasploit'],
  [/wireshark/i, 'Wireshark'],
  [/iso.?27001/i, 'ISO 27001'],
  [/nist/i, 'NIST'],
  [/soc.?2/i, 'SOC 2'],
  [/hipaa/i, 'HIPAA'],
  [/pci.?dss/i, 'PCI DSS'],
  [/gdpr/i, 'GDPR'],
  [/git\b/i, 'Git'],
  [/linux/i, 'Linux'],
  [/docker/i, 'Docker'],
  [/kubernetes/i, 'Kubernetes'],
  [/powershell/i, 'PowerShell'],
  [/bash\b|shell script/i, 'Bash'],
];

function detectSkills(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const [pattern, label] of SKILL_PATTERNS) {
    if (pattern.test(text) && !seen.has(label)) {
      found.push(label);
      seen.add(label);
    }
  }
  return found;
}

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_description?: string;
  job_apply_link: string;
  job_is_remote?: boolean;
  job_employment_type?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_posted_at_datetime_utc?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch cybersecurity remote jobs from JSearch
    const params = new URLSearchParams({
      query: 'cybersecurity',
      page: '1',
      num_pages: '3',
      remote_jobs_only: 'true',
      date_posted: '3days',
    });

    const jsearchRes = await fetch(`https://${JSEARCH_HOST}/search?${params}`, {
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': JSEARCH_HOST,
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!jsearchRes.ok) {
      const errText = await jsearchRes.text();
      throw new Error(`JSearch API error ${jsearchRes.status}: ${errText}`);
    }

    const data = await jsearchRes.json();
    const jobs: JSearchJob[] = data.data || [];

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ message: 'No jobs returned from JSearch', inserted: 0 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Map and upsert jobs
    const rows = jobs
      .filter((j) => j.job_id && j.job_title && j.job_apply_link)
      .map((j) => {
        const descText = j.job_description || '';
        return {
          external_id: j.job_id,
          title: j.job_title,
          company_name: j.employer_name,
          company_logo_url: j.employer_logo || null,
          description: descText.substring(0, 5000),
          apply_url: j.job_apply_link,
          is_remote: j.job_is_remote ?? true,
          location_type: j.job_is_remote ? 'remote' : 'onsite',
          salary_min: j.job_min_salary || null,
          salary_max: j.job_max_salary || null,
          skills_detected: detectSkills(j.job_title + ' ' + descText),
          is_active: true,
        };
      });

    const { error, count } = await supabaseAdmin
      .from('jobs')
      .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: true })
      .select('id', { count: 'exact' });

    if (error) throw new Error(`DB upsert error: ${error.message}`);

    console.log(`ingest-remote-jobs: processed ${rows.length} jobs, inserted ${count ?? 0} new`);

    return new Response(JSON.stringify({
      message: 'Ingest complete',
      processed: rows.length,
      inserted: count ?? 0,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('ingest-remote-jobs error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
