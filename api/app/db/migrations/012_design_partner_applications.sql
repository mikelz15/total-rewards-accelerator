-- Design Partner Year applications (public form at /contest).
--
-- Written only by the web app's API route (web/src/app/api/design-partner/apply)
-- with the service-role key. RLS is enabled with NO policies and anon /
-- authenticated get no grants, so the public Supabase API cannot read or
-- write this table at all. Per Supabase's Oct 30 notice, new public tables
-- need explicit grants: service_role gets them below.
--
-- status: 'interest' before Dec 1, 2026 (America/Denver), 'application' after.
-- answers holds every submitted field (the form's field list lives in
-- web/src/lib/design-partner/fields.ts), so new optional fields need no
-- migration. The key fields are also copied to columns for review queries.

CREATE TABLE IF NOT EXISTS design_partner_applications (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  status                 TEXT NOT NULL DEFAULT 'interest'
                           CHECK (status IN ('interest', 'application')),
  company_name           TEXT NOT NULL,
  industry               TEXT NOT NULL,
  hq_states              TEXT NOT NULL,
  headcount              INTEGER NOT NULL CHECK (headcount > 0),
  applicant_name         TEXT NOT NULL,
  applicant_title        TEXT NOT NULL,
  applicant_email        TEXT NOT NULL,
  applicant_phone        TEXT,
  applicant_role         TEXT NOT NULL,
  sponsor_name           TEXT NOT NULL,
  sponsor_title          TEXT NOT NULL,
  hris                   TEXT NOT NULL,
  comp_today             TEXT NOT NULL,
  export_messiness       SMALLINT CHECK (export_messiness BETWEEN 1 AND 5),
  top_problem            TEXT NOT NULL,
  secondary_problem      TEXT,
  next_cycle             TEXT NOT NULL,
  success_measure        TEXT NOT NULL,
  open_to_paid           TEXT NOT NULL,
  budget_path            TEXT,
  first_module           TEXT,
  tried_demo             BOOLEAN NOT NULL,
  commit_obligations     BOOLEAN NOT NULL,
  logo_reference_opt_in  BOOLEAN NOT NULL DEFAULT false,
  front_range            TEXT,
  paragraph              TEXT NOT NULL,
  paragraph_words        INTEGER NOT NULL,
  answers                JSONB NOT NULL DEFAULT '{}'::jsonb,
  utm                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewers_emailed      BOOLEAN NOT NULL DEFAULT false,
  applicant_emailed      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dpa_created ON design_partner_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dpa_status ON design_partner_applications (status, created_at DESC);

ALTER TABLE design_partner_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.design_partner_applications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.design_partner_applications TO service_role;
