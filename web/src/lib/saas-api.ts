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

export type MeResponse = {
  user: { id: string; email: string | null };
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    max_upload_rows: number;
  };
  membership: { role: string };
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
};

export async function getAccessToken(): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}
