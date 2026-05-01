-- SPAK — Supabase Schema
-- One database serving all projects.
-- Apply in: Supabase Dashboard → SQL Editor → Run

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,          -- e.g. 'oubiznes'
  name        TEXT NOT NULL,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO projects (id, name, url)
VALUES ('oubiznes', 'OuBiznes.mu', 'https://oubiznes.mu')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- EMAIL SUBSCRIBERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscribers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project     TEXT        NOT NULL DEFAULT 'oubiznes' REFERENCES projects(id),
  email       TEXT        NOT NULL,
  source      TEXT        DEFAULT 'home_strip',  -- 'home_strip', 'tool_prompt', etc.
  confirmed   BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project, email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_project_created
  ON email_subscribers (project, created_at DESC);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Only service role can read; inserts allowed via anon (for subscribe API route)
CREATE POLICY "service_role_all" ON email_subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert" ON email_subscribers
  FOR INSERT TO anon WITH CHECK (true);

-- ─────────────────────────────────────────────
-- FEATURE VOTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_votes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project     TEXT        NOT NULL DEFAULT 'oubiznes' REFERENCES projects(id),
  feature_id  TEXT        NOT NULL,       -- 'tiktok', 'website', 'marketplace', 'ai-learning'
  fingerprint TEXT,                       -- hashed IP+UA, prevents double-votes
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votes_feature
  ON feature_votes (project, feature_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_fingerprint
  ON feature_votes (project, feature_id, fingerprint)
  WHERE fingerprint IS NOT NULL;

ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON feature_votes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert" ON feature_votes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select" ON feature_votes
  FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- AGENT RUNS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project      TEXT        NOT NULL DEFAULT 'oubiznes' REFERENCES projects(id),
  agent_name   TEXT        NOT NULL,   -- 'regulatory-check', 'morning-briefing', 'qa-test'
  run_at       TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT        NOT NULL,   -- 'success', 'warning', 'error'
  summary      TEXT,
  details      JSONB,
  flags_count  INTEGER     DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_name_time
  ON agent_runs (project, agent_name, run_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON agent_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────
-- SPAK STATUS  (footer + health dashboard)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spak_status (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project               TEXT        NOT NULL DEFAULT 'oubiznes' REFERENCES projects(id),
  checked_at            TIMESTAMPTZ DEFAULT NOW(),
  all_tools_up          BOOLEAN     DEFAULT TRUE,
  tools_up              INTEGER     DEFAULT 8,
  tools_total           INTEGER     DEFAULT 8,
  regulatory_verified_at TIMESTAMPTZ,
  status_line           TEXT,        -- rendered in footer
  details               JSONB
);

CREATE INDEX IF NOT EXISTS idx_spak_status_project_time
  ON spak_status (project, checked_at DESC);

ALTER TABLE spak_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON spak_status
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_select" ON spak_status
  FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- MORNING BRIEFINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS morning_briefings (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project         TEXT        NOT NULL DEFAULT 'oubiznes' REFERENCES projects(id),
  briefing_date   DATE        DEFAULT CURRENT_DATE,
  content_text    TEXT,
  stats           JSONB,
  sent_whatsapp   BOOLEAN     DEFAULT FALSE,
  sent_email      BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project, briefing_date)
);

ALTER TABLE morning_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON morning_briefings
  FOR ALL TO service_role USING (true) WITH CHECK (true);
