-- Notes beside a chair's workflow. One row per org, seat, and step.

CREATE TABLE IF NOT EXISTS workbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seat TEXT NOT NULL,
  step_key TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  assignee_role TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_review', 'done')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, seat, step_key)
);

CREATE INDEX IF NOT EXISTS idx_workbook_org ON workbook_items(org_id, seat);

ALTER TABLE workbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workbook_items_tenant ON workbook_items;
CREATE POLICY workbook_items_tenant ON workbook_items
  FOR ALL
  USING (app_is_admin() OR org_id = app_org())
  WITH CHECK (app_is_admin() OR org_id = app_org());

GRANT SELECT, INSERT, UPDATE, DELETE ON workbook_items TO tra_app;
