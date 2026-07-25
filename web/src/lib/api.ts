const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
/** Optional API gate — set NEXT_PUBLIC_API_DEMO_PASSWORD to match API DEMO_PASSWORD. */
const API_DEMO_PASSWORD = process.env.NEXT_PUBLIC_API_DEMO_PASSWORD || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(API_DEMO_PASSWORD ? { "X-Demo-Password": API_DEMO_PASSWORD } : {}),
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
};

export type AuditResult = {
  summary: {
    total: number;
    underpaid: number;
    overpaid: number;
    at_market: number;
    missing_compa: number;
    avg_compa_ratio: number | null;
    median_compa_ratio: number | null;
    underpaid_threshold: number;
    overpaid_threshold: number;
    total_gap_to_parity: number;
    total_gap_to_expected?: number;
  };
  placement_summary?: PlacementSummary;
  scatter: {
    employee_id?: string;
    name?: string;
    job_title?: string;
    performance: number | null;
    compa_ratio: number | null;
    expected_compa?: number | null;
    base_salary: number | null;
    years_experience?: number | null;
    education_label?: string;
    equity_flag: string;
    placement_flag?: string;
    placement_gap?: number | null;
    flight_risk?: number;
    flight_risk_band?: string;
  }[];
  top_raise_targets: {
    employee_id?: string;
    name?: string;
    job_title?: string;
    base_salary: number | null;
    range_mid: number | null;
    compa_ratio: number | null;
    expected_rate?: number | null;
    years_experience?: number | null;
    education_label?: string;
    gap_to_mid: number;
    performance: number | null;
    recommended_increase: number;
    flight_risk?: number;
    flight_risk_band?: string;
  }[];
  top_placement_gaps?: {
    employee_id?: string;
    name?: string;
    job_title?: string;
    base_salary: number | null;
    expected_rate?: number | null;
    placement_gap?: number | null;
    years_experience?: number | null;
    education_label?: string;
    recommended_increase: number;
  }[];
  employees: Record<string, unknown>[];
  lens?: string;
  flight_risk_summary?: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    avg_flight_risk: number | null;
  };
  top_flight_risks?: {
    employee_id?: string;
    name?: string;
    job_title?: string;
    flight_risk: number;
    flight_risk_band: string;
    flight_risk_drivers?: string[];
    compa_ratio?: number | null;
    base_salary?: number | null;
  }[];
};

export type RemediationResult = {
  summary: {
    merit_pool: number;
    allocated: number;
    remaining: number;
    employees_funded: number;
    employees_eligible: number;
    employees_unfunded?: number;
    avg_increase_pct: number | null;
    target_compa: number;
    underpaid_only: boolean;
    max_increase_pct: number | null;
    pool_utilization: number;
  };
  allocations: {
    employee_id?: string;
    name?: string;
    job_title?: string;
    base_salary?: number | null;
    new_base_salary?: number;
    new_compa_ratio?: number | null;
    allocated: number;
    increase_pct?: number | null;
    flight_risk?: number;
    flight_risk_band?: string;
    gap_to_target?: number;
    fully_funded?: boolean;
  }[];
  unfunded: Record<string, unknown>[];
};

export type WealthProjection = {
  meta: {
    company_name: string;
    candidate_name: string;
    job_title: string;
    years: number;
    salary_growth_rate: number;
    lti_vest_years: number;
    use_recommended_base?: boolean;
  };
  inputs: {
    base_salary: number;
    project_base_salary?: number;
    target_bonus_pct: number;
    lti_target_value: number;
    years_experience?: number | null;
    education?: string | null;
    required_education?: string | null;
    range_min?: number | null;
    range_mid?: number | null;
    range_max?: number | null;
  };
  timeline: {
    year: number;
    base: number;
    bonus: number;
    vesting: number;
    growth: number;
    year_total: number;
    cumulative: number;
  }[];
  grand_total: number;
  summary: {
    year_1_cash: number;
    year_1_total: number;
    four_year_total: number;
  };
  placement?: {
    expected_rate?: number | null;
    expected_compa?: number | null;
    actual_compa?: number | null;
    placement_gap?: number | null;
    placement_flag?: string;
    years_experience?: number | null;
    candidate_education_label?: string | null;
    total_credit_years?: number | null;
    education_credit_years?: number | null;
    experience_credit_years?: number | null;
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
  source: string;
  owner: string;
  notes: string;
  company_name: string;
  created_at: string;
  updated_at: string;
};

export type CandidateList = {
  candidates: Candidate[];
  summary: {
    total: number;
    by_stage: Record<string, number>;
    open_pipeline: number;
    offer_base_total: number;
  };
};

export const api = {
  health: () => request<{ status: string }>("/health"),
  cleanerSample: () => request<CleanResult>("/api/cleaner/sample"),
  cleanerPaste: (csv_text: string) =>
    request<CleanResult>("/api/cleaner/paste", {
      method: "POST",
      body: JSON.stringify({ csv_text }),
    }),
  cleanerUpload: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<CleanResult>("/api/cleaner/upload", { method: "POST", body: form });
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
    max_increase_pct?: number | null;
    target_mode?: "mid" | "expected_placement" | "max_of_both";
  }) =>
    request<RemediationResult>("/api/remediation/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  placementRun: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>("/api/placement/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  flightRiskRun: (records: Record<string, unknown>[]) =>
    request<{ summary: AuditResult["flight_risk_summary"]; top_risks: AuditResult["top_flight_risks"] }>(
      "/api/flight-risk/run",
      {
        method: "POST",
        body: JSON.stringify({ records }),
      }
    ),
  closerProject: (payload: Record<string, unknown>) =>
    request<WealthProjection>("/api/closer/project", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  closerPdf: async (payload: Record<string, unknown>) => {
    const blob = await request<Blob>("/api/closer/pdf", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return blob;
  },
  candidatesList: () => request<CandidateList>("/api/candidates"),
  candidatesCreate: (payload: Partial<Candidate>) =>
    request<Candidate>("/api/candidates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  candidatesUpdate: (id: string, payload: Partial<Candidate>) =>
    request<Candidate>(`/api/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  candidatesDelete: (id: string) =>
    request<{ deleted: boolean }>(`/api/candidates/${id}`, { method: "DELETE" }),
};

export { API_BASE };
