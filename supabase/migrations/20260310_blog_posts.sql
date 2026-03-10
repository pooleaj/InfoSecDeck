CREATE TABLE IF NOT EXISTS blog_posts (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  slug       TEXT    UNIQUE NOT NULL,
  title      TEXT    NOT NULL,
  date_label TEXT    NOT NULL,
  tag        TEXT    NOT NULL DEFAULT 'Article',
  body       TEXT    NOT NULL DEFAULT '',
  published  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage all posts"
  ON blog_posts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
