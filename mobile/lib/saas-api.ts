/**
 * Authenticated SaaS client (/api/v1/*) — mirrors web entitlements.
 * Public demo still uses lib/api.ts (unauthenticated sample paths).
 */

import { API_BASE } from "./api";

export type ModuleId = "cleaner" | "equity" | "tracker" | "closer";

export type Permissions = {
  plan: string;
  role: string;
  suspended: boolean;
  modules: string[];
  plan_modules: string[];
  can_write: boolean;
  can_manage_billing: boolean;
  can_manage_team: boolean;
  module_access: Record<string, boolean>;
};

export type MeResponse = {
  user: { id: string; email: string | null; is_system_admin?: boolean };
  org: {
    id: string;
    name: string;
    plan: string;
    max_upload_rows: number;
    suspended?: boolean;
  };
  membership: { role: string };
  permissions?: Permissions;
};

async function saasRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? body;
    } catch {
      /* ignore */
    }
    const msg =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && "message" in (detail as object)
          ? String((detail as { message: string }).message)
          : JSON.stringify(detail);
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const saasApi = {
  me: (token: string) => saasRequest<MeResponse>("/api/v1/me", token),

  cleanerUpload: async (
    token: string,
    file: { uri: string; name: string; mimeType?: string | null }
  ) => {
    const form = new FormData();
    form.append("file", {
      uri: file.uri,
      name: file.name || "upload.csv",
      type: file.mimeType || "text/csv",
    } as unknown as Blob);
    return saasRequest<{
      records: Record<string, unknown>[];
      stats: Record<string, unknown>;
      issues: unknown[];
    }>("/api/v1/cleaner/upload", token, { method: "POST", body: form });
  },

  createDataset: (
    token: string,
    body: {
      name: string;
      source_filename?: string;
      records: Record<string, unknown>[];
      stats?: Record<string, unknown>;
      issues?: unknown[];
    }
  ) =>
    saasRequest<{ id: string; name: string; row_count: number }>("/api/v1/datasets", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listDatasets: (token: string) =>
    saasRequest<{ datasets: { id: string; name: string; row_count: number }[] }>(
      "/api/v1/datasets",
      token
    ),

  auditorRun: (token: string, body: { dataset_id?: string; records?: Record<string, unknown>[] }) =>
    saasRequest<Record<string, unknown>>("/api/v1/auditor/run", token, {
      method: "POST",
      body: JSON.stringify({ ...body, save: true }),
    }),

  remediationRun: (
    token: string,
    body: {
      dataset_id?: string;
      records?: Record<string, unknown>[];
      merit_pool: number;
      target_mode?: string;
    }
  ) =>
    saasRequest<Record<string, unknown>>("/api/v1/remediation/run", token, {
      method: "POST",
      body: JSON.stringify({ ...body, save: true }),
    }),

  listCandidates: (token: string) =>
    saasRequest<{ candidates: Record<string, unknown>[] }>("/api/v1/candidates", token),

  closerProject: (token: string, body: Record<string, unknown>) =>
    saasRequest<Record<string, unknown>>("/api/v1/closer/project", token, {
      method: "POST",
      body: JSON.stringify({ ...body, save: true }),
    }),
};

export function canUseModule(
  permissions: Permissions | null | undefined,
  module: ModuleId
): boolean {
  if (!permissions || permissions.suspended) return false;
  return Boolean(
    permissions.module_access?.[module] || permissions.modules?.includes(module)
  );
}
