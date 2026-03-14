-- Job location enum
create type job_location_type as enum ('remote', 'onsite', 'hybrid');

-- Jobs table (apply_url is protected — never exposed via public view)
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  external_id text unique,           -- Deduplication key for the ingest engine
  title text not null,
  company_name text not null,
  company_logo_url text,
  description text,
  apply_url text not null,           -- THE ASSET — never in public view
  is_remote boolean default true,
  location_type job_location_type default 'remote',
  salary_min int,
  salary_max int,
  skills_detected text[],            -- e.g. ['python', 'splunk', 'cissp']
  is_active boolean default true
);

-- Preview view — NO apply_url exposed to frontend
create view public.jobs_preview as
  select
    id, created_at, title, company_name, company_logo_url,
    description, is_remote, location_type, salary_min, salary_max, skills_detected
  from public.jobs
  where is_active = true
  order by created_at desc;

-- RLS: revoke direct table access, grant only preview view
revoke select on public.jobs from anon;
revoke select on public.jobs from authenticated;
grant select on public.jobs_preview to anon;
grant select on public.jobs_preview to authenticated;

-- Add has_resume flag to profiles (gates apply_url access)
alter table public.profiles add column if not exists has_resume boolean default false;
