"""Muse connector — propose-only compensation verbs. No HRIS writeback, no email."""

from __future__ import annotations

import base64
import os
import secrets
import uuid
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services.auditor import audit_equity
from app.services.cleaner import clean_dataframe, parse_tabular_text
from app.services.closer import build_wealth_pdf, project_total_wealth
from app.services.demo_guard import scan_headers_for_phi
from app.services.placement import enrich_records
from app.services.remediation import remediate

router = APIRouter(prefix="/v1", tags=["muse"])

_JOBS: Dict[str, Dict[str, Any]] = {}
_MAX_JOBS = 32
_MAX_ROWS = 500


def _keys() -> set[str]:
    raw = os.environ.get("MUSE_API_KEYS", "tra_test_review").strip()
    return {k.strip() for k in raw.split(",") if k.strip()}


def require_key(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token")
    token = authorization.split(" ", 1)[1].strip()
    ok = False
    for key in _keys():
        if secrets.compare_digest(token, key):
            ok = True
            break
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid Muse API key")
    return token


def _store(records: List[Dict[str, Any]], extra: Dict[str, Any]) -> str:
    if len(_JOBS) >= _MAX_JOBS:
        _JOBS.pop(next(iter(_JOBS)))
    job_id = "job_" + uuid.uuid4().hex[:12]
    _JOBS[job_id] = {"records": records, **extra}
    return job_id


def _load(job_id: str) -> Dict[str, Any]:
    job = _JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job_id. Run clean first.")
    return job


class CleanRequest(BaseModel):
    csv_text: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None


class JobRef(BaseModel):
    job_id: str


class FundRequest(BaseModel):
    job_id: str
    pool_dollars: float = Field(..., ge=0)


class CloserRequest(BaseModel):
    base: float = Field(..., gt=0)
    bonus_pct: float = Field(15, ge=0)
    lti: float = Field(0, ge=0)
    yoe: Optional[float] = None
    education: Optional[str] = None
    want_pdf: bool = True
    send_to_candidate: bool = False


class BriefRequest(BaseModel):
    job_id: str
    audience: str = "CHRO"


@router.get("/me")
def me(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    return {
        "workspace_id": "tra-muse-review",
        "plan": "review",
        "capabilities": ["clean", "place", "audit", "fund", "closer", "brief"],
        "writeback_enabled": False,
        "email_enabled": False,
    }


@router.post("/clean")
def clean(payload: CleanRequest, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    if payload.csv_text:
        df = parse_tabular_text(payload.csv_text)
    elif payload.records:
        df = pd.DataFrame(payload.records)
    else:
        raise HTTPException(status_code=400, detail="Provide csv_text or records")
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    hits = scan_headers_for_phi([str(c) for c in df.columns])
    if hits:
        raise HTTPException(
            status_code=422,
            detail=f"Rejected sensitive headers: {', '.join(hits[:8])}",
        )
    truncated = len(df) > _MAX_ROWS
    if truncated:
        df = df.head(_MAX_ROWS).copy()
    result = clean_dataframe(df, use_llm_headers=False)
    records = result.get("records") or []
    stats = result.get("stats") or {}
    job_id = _store(records, {"clean_stats": stats})
    return {
        "job_id": job_id,
        "column_map": stats.get("columns_mapped") or {},
        "rows_in": stats.get("rows_in"),
        "rows_kept": stats.get("rows_out"),
        "rejected_headers": [],
        "quality_notes": [i.get("message") for i in (result.get("issues") or [])[:8] if i.get("message")],
        "truncated": truncated,
        "writeback_enabled": False,
    }


@router.post("/place")
def place(payload: JobRef, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    job = _load(payload.job_id)
    enriched = enrich_records(job["records"])
    rows = []
    for i, row in enumerate(enriched[:200]):
        flag = row.get("placement_flag")
        rows.append(
            {
                "row_id": str(row.get("employee_id") or i),
                "expected_pir": row.get("expected_pir"),
                "market_mid": row.get("range_mid"),
                "review_flag": flag in {"below_expected", "above_expected", "missing_inputs"},
                "reason": flag,
            }
        )
    job["placed"] = rows
    return {"job_id": payload.job_id, "rows": rows}


@router.post("/audit")
def audit(payload: JobRef, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    job = _load(payload.job_id)
    audit_out = audit_equity(job["records"], lens="both")
    summary = audit_out.get("summary") or {}
    findings = [
        {"theme": "under_market_mid", "n": summary.get("underpaid") or 0, "defendable_note": "Below 0.90 of range midpoint."},
        {"theme": "over_market_mid", "n": summary.get("overpaid") or 0, "defendable_note": "Above 1.10 of range midpoint."},
    ]
    job["audit_summary"] = summary
    return {
        "job_id": payload.job_id,
        "findings": findings,
        "requires_human_review": True,
        "placement_summary": audit_out.get("placement_summary"),
    }


@router.post("/fund")
def fund(payload: FundRequest, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    job = _load(payload.job_id)
    out = remediate(
        job["records"],
        merit_pool=payload.pool_dollars,
        target_mode="expected_placement",
        underpaid_only=True,
    )
    summary = out.get("summary") or {}
    lines = []
    for row in (out.get("allocations") or [])[:40]:
        lines.append(
            {
                "row_id": str(row.get("employee_id") or row.get("name") or ""),
                "proposed_increase": row.get("allocated"),
                "name": row.get("name"),
            }
        )
    job["fund_summary"] = summary
    return {
        "allocated": summary.get("allocated"),
        "leftover": summary.get("remaining"),
        "method": "range_penetration_via_expected_placement",
        "lines": lines,
        "requires_human_review": True,
    }


@router.post("/closer")
def closer(payload: CloserRequest, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    if payload.send_to_candidate:
        raise HTTPException(status_code=403, detail="v1 will not email a candidate. Human confirm-chip required.")
    projection = project_total_wealth(
        base_salary=payload.base,
        target_bonus_pct=payload.bonus_pct,
        lti_target_value=payload.lti,
        years_experience=payload.yoe,
        education=payload.education,
        candidate_name="Sample Candidate",
    )
    timeline = projection.get("timeline") or []
    body: Dict[str, Any] = {
        "year1_cash": (projection.get("summary") or {}).get("year_1_cash"),
        "years": [{"year": row.get("year"), "total_wealth": row.get("cumulative")} for row in timeline],
        "four_year_total": (projection.get("summary") or {}).get("four_year_total"),
        "sent": False,
    }
    if payload.want_pdf:
        pdf = build_wealth_pdf(projection)
        body["pdf_base64"] = base64.b64encode(pdf).decode("ascii")
    return body


@router.post("/brief")
def brief(payload: BriefRequest, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    require_key(authorization)
    job = _load(payload.job_id)
    stats = job.get("clean_stats") or {}
    audit_s = job.get("audit_summary") or {}
    fund_s = job.get("fund_summary") or {}
    text = (
        f"For {payload.audience}: cleaned {stats.get('rows_out', 'n/a')} rows "
        f"(quality {stats.get('quality_score', 'n/a')}). "
        f"Under midpoint: {audit_s.get('underpaid', 'not run')}. "
        f"Over midpoint: {audit_s.get('overpaid', 'not run')}. "
        f"Merit allocated: {fund_s.get('allocated', 'not run')}; leftover {fund_s.get('remaining', 'n/a')}. "
        "Nothing was posted. A human must confirm before ranges or offers move."
    )
    return {"title": "TRA narrative brief", "body": text, "sources": [payload.job_id]}


@router.post("/act")
def act() -> None:
    raise HTTPException(status_code=403, detail="Confirm-chip: Muse may propose. Humans post pay.")
