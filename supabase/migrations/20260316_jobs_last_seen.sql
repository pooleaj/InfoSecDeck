-- Add last_seen_at for stale job detection and auto-expiry
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- Backfill existing rows
UPDATE public.jobs SET last_seen_at = created_at WHERE last_seen_at IS NULL;

-- Index for fast expiry queries
CREATE INDEX IF NOT EXISTS jobs_last_seen_idx ON public.jobs (last_seen_at) WHERE is_active = true;
