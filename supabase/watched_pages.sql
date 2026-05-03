-- watched_pages: external pages monitored for content changes
-- Used by Agent 3 (grants-watchdog) and Agent 4 (mra-monitor).
-- Apply once: Supabase dashboard → SQL Editor → paste → Run

CREATE TABLE IF NOT EXISTS watched_pages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  project       text        NOT NULL DEFAULT 'oubiznes',
  source_name   text        NOT NULL,
  url           text        NOT NULL,
  category      text        NOT NULL,   -- 'grants' | 'news'
  content_hash  text,                   -- SHA-256 of stripped page text
  excerpt       text,                   -- first 500 chars (context for alerts)
  last_checked  timestamptz,
  last_changed  timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(project, url)
);

ALTER TABLE watched_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all"
  ON watched_pages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_select"
  ON watched_pages FOR SELECT TO anon USING (true);

-- Seed: grant sources
INSERT INTO watched_pages (project, source_name, url, category) VALUES
  ('oubiznes', 'SMEDA — Grants & Schemes',   'https://smeda.org/index.php/schemes-grants',   'grants'),
  ('oubiznes', 'EDB — Investment Incentives', 'https://edbmauritius.org/schemes/incentives',  'grants'),
  ('oubiznes', 'DBM — SME Financing',         'https://dbm.mu/en/products/sme-financing',     'grants'),
  -- news sources
  ('oubiznes', 'MRA — News',                  'https://www.mra.mu/news',                      'news'),
  ('oubiznes', 'MRA — Circulars',             'https://www.mra.mu/circulars',                 'news')
ON CONFLICT (project, url) DO NOTHING;
