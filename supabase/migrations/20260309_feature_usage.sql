-- Feature usage tracking for monthly rate limiting
-- Free users: 3 uses/month per feature
-- Pro users: 30 uses/month per feature

CREATE TABLE IF NOT EXISTS feature_usage (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature    TEXT    NOT NULL,  -- 'roaster' | 'pivot' | 'ats' | 'jobfit'
  month_key  TEXT    NOT NULL,  -- 'YYYY-MM'
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, feature, month_key)
);

ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (for frontend display)
CREATE POLICY "Users can read own usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_feature_usage_month ON feature_usage (month_key, feature);
