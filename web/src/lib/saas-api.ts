/**
 * Authenticated API client for /api/v1 SaaS routes.
 * Pass the Supabase access_token from the browser session.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

import type { Permissions } from "./permissions";

export type MeResponse = {
  user: { id: string; email: string | null; is_system_admin?: boolean };
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    max_upload_rows: number;
    suspended?: boolean;
    entitlements?: string[] | null;
  };
  membership: { role: string };
  permissions?: Permissions;
  workspace: { id: string; name: string } | null;
};

export type DatasetSummary = {
  id: string;
  name: string;
  source_filename?: string | null;
  row_count: number;
  stats: Record<string, unknown>;
  created_at?: string | null;
};

export const saasApi = {
  me: (token: string) => saasRequest<MeResponse>("/api/v1/me", token),

  listDatasets: (token: string) =>
    saasRequest<{ datasets: DatasetSummary[] }>("/api/v1/datasets", token),

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
    saasRequest<DatasetSummary>("/api/v1/datasets", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getDataset: (token: string, id: string) =>
    saasRequest<DatasetSummary & { records: Record<string, unknown>[] }>(
      `/api/v1/datasets/${id}`,
      token
    ),

  cleanerUpload: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return saasRequest<{
      records: Record<string, unknown>[];
      stats: Record<string, unknown>;
      issues: unknown[];
      source?: { filename?: string; type: string };
    }>("/api/v1/cleaner/upload", token, { method: "POST", body: form });
  },

  listCandidates: (token: string) =>
    saasRequest<{ candidates: Record<string, unknown>[]; summary: Record<string, unknown> }>(
      "/api/v1/candidates",
      token
    ),

  auditorRun: (
    token: string,
    body: {
      dataset_id?: string;
      records?: Record<string, unknown>[];
      top_n?: number;
      lens?: string;
      save?: boolean;
    }
  ) =>
    saasRequest<Record<string, unknown>>("/api/v1/auditor/run", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  remediationRun: (
    token: string,
    body: {
      dataset_id?: string;
      records?: Record<string, unknown>[];
      merit_pool: number;
      target_compa?: number;
      underpaid_only?: boolean;
      max_increase_pct?: number | null;
      target_mode?: string;
      save?: boolean;
    }
  ) =>
    saasRequest<Record<string, unknown>>("/api/v1/remediation/run", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  closerProject: (token: string, body: Record<string, unknown>) =>
    saasRequest<Record<string, unknown>>("/api/v1/closer/project", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  closerPdf: async (token: string, body: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/api/v1/closer/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const j = await res.json();
        detail = j.detail || detail;
      } catch {
        /* ignore */
      }
      throw new Error(typeof detail === "string" ? detail : "PDF failed");
    }
    return res.blob();
  },

  team: (token: string) =>
    saasRequest<{
      members: { id: string; user_id: string; role: string; email?: string | null }[];
      invites: { id: string; email: string; role: string; token: string; accept_path?: string }[];
      roles: string[];
      you: { user_id: string; role: string; email?: string | null };
    }>("/api/v1/team", token),

  invite: (token: string, body: { email: string; role: string }) =>
    saasRequest<{ email: string; role: string; token: string; accept_path: string; note?: string }>(
      "/api/v1/team/invites",
      token,
      { method: "POST", body: JSON.stringify(body) }
    ),

  acceptInvite: (token: string, inviteToken: string) =>
    saasRequest<{ ok: boolean; org_id: string; role: string }>("/api/v1/team/invites/accept", token, {
      method: "POST",
      body: JSON.stringify({ token: inviteToken }),
    }),

  updateMemberRole: (token: string, userId: string, role: string) =>
    saasRequest<Record<string, unknown>>(`/api/v1/team/members/${userId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  removeMember: (token: string, userId: string) =>
    saasRequest<{ ok: boolean }>(`/api/v1/team/members/${userId}`, token, { method: "DELETE" }),

  billingStatus: (token: string) =>
    saasRequest<{
      plan: string;
      suspended: boolean;
      permissions: Permissions;
      subscription: Record<string, unknown> | null;
      stripe_enabled: boolean;
      can_manage_billing: boolean;
    }>("/api/v1/billing/status", token),

  billingCatalog: (token: string) =>
    saasRequest<{
      products: {
        id: string;
        name: string;
        price_label: string;
        checkout_ready: boolean;
        modules?: string[];
        trial_days?: number;
      }[];
      stripe_enabled: boolean;
      trial_days?: number;
      promo?: {
        enabled: boolean;
        trial_days: number;
        label: string;
        detail: string;
      } | null;
      note?: string;
    }>("/api/v1/billing/catalog", token),

  checkout: (token: string, product: string) =>
    saasRequest<{ url: string }>("/api/v1/billing/checkout", token, {
      method: "POST",
      body: JSON.stringify({ product }),
    }),

  portal: (token: string) =>
    saasRequest<{ url: string }>("/api/v1/billing/portal", token, { method: "POST", body: "{}" }),

  adminMe: (token: string) =>
    saasRequest<{ is_system_admin: boolean; email: string | null }>("/api/v1/admin/me", token),

  adminOrgs: (token: string) =>
    saasRequest<{
      orgs: {
        id: string;
        name: string;
        plan: string;
        suspended: boolean;
        max_upload_rows: number;
        entitlements: string[] | null;
        member_count: number;
        dataset_count: number;
        effective_modules: string[];
      }[];
      modules: string[];
    }>("/api/v1/admin/orgs", token),

  adminPatchOrg: (
    token: string,
    orgId: string,
    body: {
      plan?: string;
      suspended?: boolean;
      max_upload_rows?: number;
      entitlements?: string[] | null;
      name?: string;
    }
  ) =>
    saasRequest<Record<string, unknown>>(`/api/v1/admin/orgs/${orgId}`, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export async function getAccessToken(): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}
