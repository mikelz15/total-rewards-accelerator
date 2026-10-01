-- Tenant row-level security.
-- The API connects as a role that bypasses RLS (Supabase postgres). Tenant
-- sessions SET LOCAL ROLE tra_app, which does not bypass RLS.
-- Apply in the Supabase SQL editor before the API build that calls bind_rls
-- is required. The API no-ops until role tra_app exists.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tra_app') THEN
    CREATE ROLE tra_app NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO tra_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tra_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tra_app;
GRANT tra_app TO CURRENT_USER;

CREATE OR REPLACE FUNCTION app_org() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.org_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_user() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.platform_admin', true) = 'on'
$$;

CREATE OR REPLACE FUNCTION app_invite_token() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.invite_token', true), '')
$$;

-- First-login org create. Runs as the migration owner so it can insert
-- before an org id exists. Not granted to public.
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
  INSERT INTO organizations (id, name, slug, plan, max_upload_rows, suspended)
  VALUES (o, p_name, p_slug, 'trial', 5000, false);
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

-- organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizations_select ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
DROP POLICY IF EXISTS organizations_insert ON organizations;
CREATE POLICY organizations_select ON organizations FOR SELECT
  USING (
    app_is_admin()
    OR id = app_org()
    OR id IN (SELECT org_id FROM memberships WHERE user_id = app_user())
  );
CREATE POLICY organizations_update ON organizations FOR UPDATE
  USING (app_is_admin() OR id = app_org())
  WITH CHECK (app_is_admin() OR id = app_org());
CREATE POLICY organizations_insert ON organizations FOR INSERT
  WITH CHECK (app_is_admin());

-- memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memberships_all ON memberships;
CREATE POLICY memberships_select ON memberships FOR SELECT
  USING (app_is_admin() OR user_id = app_user() OR org_id = app_org());
CREATE POLICY memberships_insert ON memberships FOR INSERT
  WITH CHECK (
    app_is_admin()
    OR (user_id = app_user() AND org_id = app_org())
    OR (
      user_id = app_user()
      AND org_id IN (
        SELECT org_id FROM invites
        WHERE token = app_invite_token() AND accepted_at IS NULL
      )
    )
  );
CREATE POLICY memberships_update ON memberships FOR UPDATE
  USING (app_is_admin() OR org_id = app_org())
  WITH CHECK (app_is_admin() OR org_id = app_org());
CREATE POLICY memberships_delete ON memberships FOR DELETE
  USING (app_is_admin() OR org_id = app_org());

-- workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspaces_all ON workspaces;
CREATE POLICY workspaces_all ON workspaces FOR ALL
  USING (app_is_admin() OR org_id = app_org())
  WITH CHECK (app_is_admin() OR org_id = app_org());

-- client data
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['datasets', 'analysis_runs', 'candidates', 'audit_log', 'subscriptions']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (app_is_admin() OR org_id = app_org()) WITH CHECK (app_is_admin() OR org_id = app_org())',
      t || '_tenant', t
    );
  END LOOP;
END $$;

-- invites: members of the org, plus the bearer of the exact token
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invites_select ON invites;
DROP POLICY IF EXISTS invites_insert ON invites;
DROP POLICY IF EXISTS invites_update ON invites;
CREATE POLICY invites_select ON invites FOR SELECT
  USING (
    app_is_admin()
    OR org_id = app_org()
    OR (app_invite_token() <> '' AND token = app_invite_token())
  );
CREATE POLICY invites_insert ON invites FOR INSERT
  WITH CHECK (app_is_admin() OR org_id = app_org());
CREATE POLICY invites_update ON invites FOR UPDATE
  USING (
    app_is_admin()
    OR org_id = app_org()
    OR (app_invite_token() <> '' AND token = app_invite_token())
  )
  WITH CHECK (
    app_is_admin()
    OR org_id = app_org()
    OR (app_invite_token() <> '' AND token = app_invite_token())
  );
