"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ModuleShell";
import {
  BRANDING_ACCEPT,
  BRANDING_BUCKET,
  brandFileProblem,
  brandImageUrl,
  brandObjectPath,
} from "@/lib/branding";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";

export default function BrandingSettingsPage() {
  const { me, permissions, reload } = useWorkspace();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canManage = Boolean(permissions?.can_manage_team);
  const orgId = me?.org.id;

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        const data = await saasApi.branding(token);
        setAvailable(data.available);
        setPath(data.brand_image_path);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load branding");
      }
    })();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setInfo(null);
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    const problem = brandFileProblem(picked);
    if (problem) {
      setError(problem);
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(picked);
  }

  async function removeObject(objectPath: string | null | undefined) {
    if (!objectPath) return;
    try {
      await createClient().storage.from(BRANDING_BUCKET).remove([objectPath]);
    } catch {
      /* best effort; an orphaned old logo is harmless */
    }
  }

  async function onUpload() {
    if (!file || !orgId) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const objectPath = brandObjectPath(orgId, file.type);
    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(BRANDING_BUCKET)
        .upload(objectPath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const token = await getAccessToken();
      const saved = await saasApi.setBranding(token, objectPath);
      if (saved.previous_path && saved.previous_path !== objectPath) {
        await removeObject(saved.previous_path);
      }
      setPath(objectPath);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setInfo("Saved. Everyone in this organization sees it in the header.");
      reload();
    } catch (err) {
      await removeObject(objectPath);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!confirm("Remove the organization image? The header goes back to the TRA mark.")) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const token = await getAccessToken();
      const saved = await saasApi.setBranding(token, null);
      await removeObject(saved.previous_path);
      setPath(null);
      setInfo("Removed. The header shows the TRA mark again.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the image");
    } finally {
      setBusy(false);
    }
  }

  const current = brandImageUrl(path);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Settings · Branding
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Organization image
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          One logo or banner for {me?.org.name || "this organization"}. It replaces the TRA mark in
          the app header for everyone in the org. Optional.
        </p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {info && <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>}

      {available === false && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Branding is not set up on this database yet. The org-branding migration has to run first.
        </p>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Current</h2>
        <div className="mt-4 flex min-h-[4rem] items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt={`${me?.org.name || "Organization"} logo`}
              className="h-12 w-auto max-w-[240px] object-contain"
            />
          ) : (
            <p className="text-sm text-slate-500">None. The header shows the TRA mark.</p>
          )}
        </div>
        {current && canManage && (
          <div className="mt-4">
            <Button variant="ghost" onClick={onClear} disabled={busy || available === false}>
              Remove image
            </Button>
          </div>
        )}
      </Card>

      {canManage ? (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Upload</h2>
          <p className="mt-1 text-sm text-slate-500">
            PNG, JPG, SVG, or WebP. 2 MB or less. A wide logo on a transparent background reads best.
          </p>
          <label className="mt-4 block">
            <span className="sr-only">Choose an image</span>
            <input
              ref={inputRef}
              type="file"
              accept={BRANDING_ACCEPT}
              onChange={onPick}
              disabled={busy || available === false}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
            />
          </label>
          {preview && (
            <div className="mt-4 flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-12 w-auto max-w-[240px] object-contain" />
            </div>
          )}
          <div className="mt-4">
            <Button onClick={onUpload} disabled={!file || !orgId || busy || available === false}>
              {busy ? "Saving…" : "Save image"}
            </Button>
          </div>
        </Card>
      ) : (
        permissions && (
          <p className="text-sm text-slate-500">Only an owner or admin can change the organization image.</p>
        )
      )}
    </div>
  );
}
