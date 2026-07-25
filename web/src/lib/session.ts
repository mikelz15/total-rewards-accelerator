import type { AuditResult, CleanResult, RemediationResult } from "./api";

const CLEAN_KEY = "tra_clean_result";
const AUDIT_KEY = "tra_audit_result";
const REMEDIATION_KEY = "tra_remediation_result";

export function saveCleanResult(result: CleanResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLEAN_KEY, JSON.stringify(result));
}

export function loadCleanResult(): CleanResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CLEAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CleanResult;
  } catch {
    return null;
  }
}

export function clearCleanResult() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLEAN_KEY);
}

export function saveAuditResult(result: AuditResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUDIT_KEY, JSON.stringify(result));
}

export function loadAuditResult(): AuditResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUDIT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuditResult;
  } catch {
    return null;
  }
}

export function saveRemediationResult(result: RemediationResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(REMEDIATION_KEY, JSON.stringify(result));
}

export function loadRemediationResult(): RemediationResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(REMEDIATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RemediationResult;
  } catch {
    return null;
  }
}

/** Full demo reset — clears session artifacts. Caller reloads sample. */
export function resetDemoSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLEAN_KEY);
  sessionStorage.removeItem(AUDIT_KEY);
  sessionStorage.removeItem(REMEDIATION_KEY);
}
