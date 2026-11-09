-- Seat licenses. A customer cannot insert one. A new person gets in only by
-- accepting a passage that points at an open license, inside its window.
-- A new trial workspace carries a 30-day clock. An existing workspace with
-- no clock is left as it was.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS access_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS seat_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  issued_by UUID,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (role IN ('owner', 'admin', 'member', 'ta', 'hrbp', 'executive', 'viewer'))
);

CREATE UNIQUE INDEX IF NOT EXISTS seat_licenses_membership_uidx
  ON seat_licenses (membership_id)
  WHERE membership_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS seat_licenses_org_idx ON seat_licenses (org_id);

ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES seat_licenses(id) ON DELETE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON seat_licenses TO tra_app;

ALTER TABLE seat_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_licenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS seat_licenses_select ON seat_licenses;
DROP POLICY IF EXISTS seat_licenses_insert ON seat_licenses;
DROP POLICY IF EXISTS seat_licenses_update ON seat_licenses;
DROP POLICY IF EXISTS seat_licenses_delete ON seat_licenses;
CREATE POLICY seat_licenses_select ON seat_licenses FOR SELECT
  USING (
    app_is_admin()
    OR org_id = app_org()
    OR id IN (
      SELECT license_id FROM invites
      WHERE license_id IS NOT NULL
        AND token = app_invite_token()
        AND accepted_at IS NULL
    )
  );
CREATE POLICY seat_licenses_insert ON seat_licenses FOR INSERT
  WITH CHECK (app_is_admin());
CREATE POLICY seat_licenses_update ON seat_licenses FOR UPDATE
  USING (
    app_is_admin()
    OR id IN (
      SELECT license_id FROM invites
      WHERE license_id IS NOT NULL
        AND token = app_invite_token()
        AND accepted_at IS NULL
    )
  )
  WITH CHECK (
    app_is_admin()
    OR membership_id IS NOT NULL
  );
CREATE POLICY seat_licenses_delete ON seat_licenses FOR DELETE
  USING (app_is_admin());

-- A membership insert from an invite has to land on an open, in-window license.
DROP POLICY IF EXISTS memberships_insert ON memberships;
CREATE POLICY memberships_insert ON memberships FOR INSERT
  WITH CHECK (
    app_is_admin()
    OR (
      user_id = app_user()
      AND org_id IN (
        SELECT i.org_id
        FROM invites i
        JOIN seat_licenses l ON l.id = i.license_id
        WHERE i.token = app_invite_token()
          AND i.accepted_at IS NULL
          AND l.membership_id IS NULL
          AND now() >= l.starts_at
          AND now() < l.ends_at
      )
    )
  );

-- Customers no longer write invites. The platform does.
DROP POLICY IF EXISTS invites_insert ON invites;
CREATE POLICY invites_insert ON invites FOR INSERT
  WITH CHECK (app_is_admin());

CREATE OR REPLACE FUNCTION tra_bootstrap_org(p_name text, p_slug text, p_user uuid)
RETURNS TABLE(org_id uuid, membership_id uuid, workspace_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o uuid := gen_random_uuid();
  m uuid := gen_random_uuid();
  w uuid := gen_random_uuid();
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'user required';
  END IF;
  INSERT INTO organizations (id, name, slug, plan, max_upload_rows, suspended, access_until)
  VALUES (o, p_name, p_slug, 'trial', 5000, false, now() + interval '30 days');
  INSERT INTO memberships (id, org_id, user_id, role)
  VALUES (m, o, p_user, 'owner');
  INSERT INTO workspaces (id, org_id, name)
  VALUES (w, o, 'Default');
  org_id := o;
  membership_id := m;
  workspace_id := w;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION tra_bootstrap_org(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tra_bootstrap_org(text, text, uuid) TO tra_app;
