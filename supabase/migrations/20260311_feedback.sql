-- ══════════════════════════════════════════════════════════════════
-- Feature Requests & Issues (feedback) — v58
-- Run manually in Supabase SQL editor
-- ══════════════════════════════════════════════════════════════════

-- ── FEEDBACK ITEMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_items (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type       TEXT        NOT NULL CHECK (type IN ('feature','issue')),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in-progress','completed','closed')),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name  TEXT        NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fi public read"
  ON feedback_items FOR SELECT USING (true);

CREATE POLICY "fi auth insert"
  ON feedback_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fi admin update"
  ON feedback_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ── FEEDBACK VOTES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_votes (
  item_id    UUID     NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  user_id    UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fv public read"
  ON feedback_votes FOR SELECT USING (true);

CREATE POLICY "fv auth insert"
  ON feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fv auth update"
  ON feedback_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "fv auth delete"
  ON feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ── FEEDBACK COMMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_comments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id    UUID        NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name  TEXT        NOT NULL DEFAULT 'Anonymous',
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc public read"
  ON feedback_comments FOR SELECT USING (true);

CREATE POLICY "fc auth insert"
  ON feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fc auth delete"
  ON feedback_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ── AGGREGATED VIEW ───────────────────────────────────────────────
CREATE OR REPLACE VIEW feedback_with_votes AS
SELECT
  fi.*,
  COALESCE(SUM(fv.vote), 0) AS score,
  COUNT(DISTINCT fc.id)     AS comment_count
FROM feedback_items fi
LEFT JOIN feedback_votes    fv ON fv.item_id = fi.id
LEFT JOIN feedback_comments fc ON fc.item_id = fi.id
GROUP BY fi.id;

-- ── INDEXES ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedback_items_type    ON feedback_items (type);
CREATE INDEX IF NOT EXISTS idx_feedback_items_status  ON feedback_items (status);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_item ON feedback_comments (item_id);
