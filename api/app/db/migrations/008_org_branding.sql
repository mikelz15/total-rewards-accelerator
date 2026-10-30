-- Org branding: one optional image (logo or banner) per organization.
-- Shown in the signed-in app chrome for everyone in that org.
--
-- Not applied automatically. Run in the Supabase SQL editor (or psql as the
-- migration owner) before the branding upload works. Until then the API reports
-- branding as unavailable and the app shows the TRA mark.
--
-- Storage layout: bucket org-branding, object key <org_id>/logo-<timestamp>.<ext>.
-- The bucket is public-read so the <img> in the app header needs no signed URL.
-- Only an owner or admin of that org can write under its folder.

-- 1. The column. Nullable: no image means the TRA mark.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_image_path TEXT;

-- 2. Seat lookup for Storage policies. Storage runs as the Supabase `authenticated`
--    role with auth.uid(); memberships has forced RLS keyed to app.user_id, so the
--    lookup runs as the migration owner instead. NULL means not a member (or a malformed folder).
CREATE OR REPLACE FUNCTION tra_org_role(p_org text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.role
  FROM memberships m
  WHERE m.user_id = auth.uid()
    AND m.org_id::text = p_org
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION tra_org_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tra_org_role(text) TO authenticated;

-- 3. The bucket. 2 MB, images only. SVG is allowed; it is only ever rendered via <img>.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-branding',
  'org-branding',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage policies. Reads are public through the bucket flag. Writes are
--    owner/admin of the org named by the first folder of the object key.
DROP POLICY IF EXISTS org_branding_insert ON storage.objects;
DROP POLICY IF EXISTS org_branding_update ON storage.objects;
DROP POLICY IF EXISTS org_branding_delete ON storage.objects;
DROP POLICY IF EXISTS org_branding_select ON storage.objects;

-- Listing objects (and upsert) needs SELECT. Members of the org can list its folder.
CREATE POLICY org_branding_select ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND public.tra_org_role((storage.foldername(name))[1]) IS NOT NULL
  );

CREATE POLICY org_branding_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-branding'
    AND public.tra_org_role((storage.foldername(name))[1]) IN ('owner', 'admin')
  );

CREATE POLICY org_branding_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND public.tra_org_role((storage.foldername(name))[1]) IN ('owner', 'admin')
  )
  WITH CHECK (
    bucket_id = 'org-branding'
    AND public.tra_org_role((storage.foldername(name))[1]) IN ('owner', 'admin')
  );

CREATE POLICY org_branding_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND public.tra_org_role((storage.foldername(name))[1]) IN ('owner', 'admin')
  );
