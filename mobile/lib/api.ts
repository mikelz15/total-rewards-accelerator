import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

/** Production API by default; override with EXPO_PUBLIC_API_URL */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  extra?.apiUrl ||
  "https://tra-api-starter.onrender.com";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    return (await res.blob()) as T;
  }
  return res.json() as Promise<T>;
}

export type PlacementSummary = {
  with_expected: number;
  below_expected: number;
  at_expected: number;
  above_expected: number;
  total_placement_gap: number;
  avg_expected_compa: number | null;
  avg_actual_compa: number | null;
};

export type CleanResult = {
  stats: {
    rows_in: number;
    rows_out: number;
    columns_in: string[];
    columns_mapped: Record<string, string>;
    columns_unmapped?: string[];
    canonical_columns: string[];
    quality_score?: number;
    source_system_guess?: string;
    dropped_inactive?: number;
    placement?: PlacementSummary;
    cleaned_at: string;
  };
  issues: { level: string; message: string; row?: number | null }[];
  records: Record<string, unknown>[];
  source?: { filename?: string; type: string };
  demo?: { disclaimer?: string; max_rows?: number };
};

export type AuditResult = {
  summary: {
    total: number;
    underpaid: number;
    overpaid: number;
    at_market: number;
    missing_compa: number;
    avg_compa_ratio: number | null;
    total_gap_to_parity: number;
    total_gap_to_expected?: number;
  };
  placement_summary?: PlacementSummary;
  top_raise_targets: Record<string, unknown>[];
  top_placement_gaps?: Record<string, unknown>[];
  top_flight_risks?: Record<string, unknown>[];
  flight_risk_summary?: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    avg_flight_risk: number | null;
  };
  employees: Record<string, unknown>[];
};

export type RemediationResult = {
  summary: {
    merit_pool: number;
    allocated: number;
    remaining: number;
    employees_funded: number;
    pool_utilization: number;
  };
  allocations: Record<string, unknown>[];
};

export type WealthProjection = {
  meta: {
    company_name: string;
    candidate_name: string;
    job_title: string;
    years: number;
  };
  grand_total: number;
  summary: {
    year_1_cash: number;
    year_1_total: number;
    four_year_total: number;
  };
  timeline: {
    year: number;
    base: number;
    bonus: number;
    vesting: number;
    year_total: number;
    cumulative: number;
  }[];
  placement?: {
    expected_rate?: number | null;
    placement_gap?: number | null;
    placement_flag?: string;
  } | null;
};

export type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: string;
  base_salary: number;
  target_bonus_pct: number;
  lti_target_value: number;
  notes: string;
  company_name: string;
};

export type CandidateList = {
  candidates: Candidate[];
  summary: {
    total: number;
    by_stage: Record<string, number>;
    open_pipeline: number;
    offer_base_total: number;
  };
  demo?: { sample_only?: boolean; disclaimer?: string };
};

export const api = {
  health: () => request<{ status: string; version?: string }>("/health"),
  cleanerSample: () => request<CleanResult>("/api/cleaner/sample"),
  cleanerPaste: (csv_text: string) =>
    request<CleanResult>("/api/cleaner/paste", {
      method: "POST",
      body: JSON.stringify({ csv_text }),
    }),
  cleanerUpload: async (file: {
    uri: string;
    name: string;
    mimeType?: string | null;
  }) => {
    const form = new FormData();
    form.append("file", {
      uri: file.uri,
      name: file.name || "upload.csv",
      type: file.mimeType || "text/csv",
    } as unknown as Blob);
    return request<CleanResult>("/api/cleaner/upload", {
      method: "POST",
      body: form,
    });
  },
  auditorRun: (records: Record<string, unknown>[], top_n = 5) =>
    request<AuditResult>("/api/auditor/run", {
      method: "POST",
      body: JSON.stringify({ records, top_n }),
    }),
  remediationRun: (body: {
    records: Record<string, unknown>[];
    merit_pool: number;
    target_compa?: number;
    underpaid_only?: boolean;
    target_mode?: "mid" | "expected_placement" | "max_of_both";
  }) =>
    request<RemediationResult>("/api/remediation/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  closerProject: (payload: Record<string, unknown>) =>
    request<WealthProjection>("/api/closer/project", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  candidatesList: () => request<CandidateList>("/api/candidates"),
  candidatesUpdate: (id: string, payload: Partial<Candidate>) =>
    request<Candidate>(`/api/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
