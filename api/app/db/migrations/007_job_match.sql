-- Job matching repository for the Rewards seat.
-- One internal job -> three external matches, stored per account.
-- Descriptions on the ledger are not kept. Survey books are not a table.

CREATE TABLE IF NOT EXISTS job_match_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  family TEXT,
  function TEXT,
  focus TEXT,
  level INTEGER,
  description TEXT,
  duties_json JSONB NOT NULL DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_match_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_match_jobs(id) ON DELETE CASCADE,
  matches_json JSONB NOT NULL DEFAULT '[]',
  overall_match NUMERIC,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_match_jobs_org_idx ON job_match_jobs (org_id);
CREATE INDEX IF NOT EXISTS job_match_ledgers_org_idx ON job_match_ledgers (org_id);
CREATE INDEX IF NOT EXISTS job_match_ledgers_job_idx ON job_match_ledgers (job_id);

ALTER TABLE job_match_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE job_match_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_ledgers FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['job_match_jobs', 'job_match_ledgers']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON %I', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY %I_select ON %I FOR SELECT USING (org_id = app_org())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (org_id = app_org())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_update ON %I FOR UPDATE USING (org_id = app_org()) WITH CHECK (org_id = app_org())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_delete ON %I FOR DELETE USING (org_id = app_org())',
      tbl, tbl
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tra_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON job_match_jobs TO tra_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON job_match_ledgers TO tra_app;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON job_match_jobs TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON job_match_ledgers TO service_role;
  END IF;
END $$;
