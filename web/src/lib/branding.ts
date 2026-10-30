/**
 * Org branding: one optional image per organization, stored in Supabase Storage.
 * Bucket and policies come from api/app/db/migrations/008_org_branding.sql.
 */

export const BRANDING_BUCKET = "org-branding";
export const BRANDING_MAX_BYTES = 2 * 1024 * 1024;

export const BRANDING_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export const BRANDING_ACCEPT = Object.keys(BRANDING_TYPES).join(",");

/** null when the file is fine, otherwise the reason it is not. */
export function brandFileProblem(file: { type: string; size: number }): string | null {
  if (!BRANDING_TYPES[file.type]) return "Use a PNG, JPG, SVG, or WebP image.";
  if (file.size > BRANDING_MAX_BYTES) return "Keep the image at 2 MB or less.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/** <org_id>/logo-<timestamp>.<ext>. A new name per upload keeps caches honest. */
export function brandObjectPath(orgId: string, mimeType: string, now = Date.now()): string {
  const ext = BRANDING_TYPES[mimeType] ?? "png";
  return `${orgId}/logo-${now}.${ext}`;
}

/** Public URL for a stored path. The bucket is public-read, so no signing. */
export function brandImageUrl(path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  const key = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BRANDING_BUCKET}/${key}`;
}
