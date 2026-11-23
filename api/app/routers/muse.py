"""Muse connector — propose-only compensation verbs. No HRIS writeback, no email."""

from __future__ import annotations

import base64
import os
import secrets
import uuid
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel, ConfigDict, Field

from app.services.auditor import audit_equity
from app.services.cleaner import clean_dataframe, parse_tabular_text
from app.services.closer import build_wealth_pdf, project_total_wealth
from app.services.demo_guard import scan_headers_for_phi
from app.services.placement import enrich_records
from app.services.remediation import remediate

# auto_error=False keeps current 401 messages from require_key (HTTPBearer
# defaults to 403 when the header is missing). Result is unused at runtime.
muse_bearer = HTTPBearer(
    auto_error=False,
    scheme_name="MuseAPIKey",
    description="Muse review API key. Send as `Authorization: Bearer <key>`.",
)

router = APIRouter(
    prefix="/v1",
    tags=["muse"],
    dependencies=[Depends(muse_bearer)],
)

_JOBS: Dict[str, Dict[str, Any]] = {}
_MAX_JOBS = 32
_MAX_ROWS = 500


def _keys() -> set[str]:
    raw = os.environ.get("MUSE_API_KEYS", "tra_test_review").strip()
    return {k.strip() for k in raw.split(",") if k.strip()}


def require_key(authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> str:
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
    """Upload a compensation file as CSV text or as row objects."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"csv_text": "EE#,Employee Name,Annual Salary\n1,Alex Rivera,120000\n"},
                {
                    "records": [
                        {"EE#": "1", "Employee Name": "Alex Rivera", "Annual Salary": 120000}
                    ]
                },
            ]
        }
    )
    csv_text: Optional[str] = Field(
        default=None,
        description="Raw CSV or TSV text. Do not include SSN, DOB, address, phone, email, or other PHI columns.",
    )
    records: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Tabular rows as objects. Alternative to csv_text. Same PHI header rules apply.",
    )


class JobRef(BaseModel):
    job_id: str = Field(..., description="Job id returned by POST /v1/clean.", examples=["job_ab12cd34ef56"])


class FundRequest(BaseModel):
    job_id: str = Field(..., description="Job id returned by POST /v1/clean.")
    pool_dollars: float = Field(..., ge=0, description="Merit pool in dollars to allocate (propose only).")


class CloserRequest(BaseModel):
    base: float = Field(..., gt=0, description="Base salary used for the four-year wealth projection.")
    bonus_pct: float = Field(15, ge=0, description="Target bonus as a percent (15 means 15%).")
    lti: float = Field(0, ge=0, description="Long-term incentive target value.")
    yoe: Optional[float] = Field(default=None, description="Years of experience, if known.")
    education: Optional[str] = Field(default=None, description="Education label, if known.")
    want_pdf: bool = Field(default=True, description="If true, include a base64-encoded PDF statement.")
    send_to_candidate: bool = Field(
        default=False,
        description="Must stay false. v1 will not email a candidate (403 if true).",
    )


class BriefRequest(BaseModel):
    job_id: str = Field(..., description="Job id returned by POST /v1/clean.")
    audience: str = Field(default="CHRO", description="Audience for the narrative, e.g. CHRO or CFO.")


@router.get(
    "/me",
    summary="Workspace and capabilities",
    description=(
        "Returns the review workspace, enabled verbs, and confirms that writeback and email are off. "
        "Requires a Muse Bearer API key."
    ),
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        200: {
            "description": "Workspace metadata.",
            "content": {
                "application/json": {
                    "example": {
                        "workspace_id": "tra-muse-review",
                        "plan": "review",
                        "capabilities": ["clean", "place", "audit", "fund", "closer", "brief"],
                        "writeback_enabled": False,
                        "email_enabled": False,
                    }
                }
            },
        }
    },
)
def me(authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
    require_key(authorization)
    return {
        "workspace_id": "tra-muse-review",
        "plan": "review",
        "capabilities": ["clean", "place", "audit", "fund", "closer", "brief"],
        "writeback_enabled": False,
        "email_enabled": False,
    }


def dataframe_for_clean(payload: CleanRequest) -> pd.DataFrame:
    """Turn a connector body into a frame. A blank file is a 400, not a 500."""
    text = (payload.csv_text or "").strip()
    try:
        if text:
            df = parse_tabular_text(text)
        elif payload.records:
            df = pd.DataFrame(payload.records)
        else:
            raise HTTPException(status_code=400, detail="Provide csv_text or records")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    return df


@router.post(
    "/clean",
    summary="Clean a compensation file",
    description=(
        "Parse csv_text or records, scan column headers for PHI, and store a cleaned in-memory job. "
        "Sensitive headers (SSN, DOB, address, phone, email, MRN, and similar) are rejected with 422. "
        "Files over 500 rows are truncated. Nothing is written back to an HRIS."
    ),
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        400: {"description": "Missing or empty csv_text/records."},
        422: {"description": "Validation error, or PHI / sensitive headers rejected."},
    },
)
def clean(payload: CleanRequest, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
    require_key(authorization)
    df = dataframe_for_clean(payload)
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


@router.post(
    "/place",
    summary="Place cleaned rows",
    description="Propose expected placement (YOE + education) for a cleaned job. Requires a prior job_id from /clean.",
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        404: {"description": "Unknown job_id."},
    },
)
def place(payload: JobRef, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
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


@router.post(
    "/audit",
    summary="Audit equity",
    description="Dual-lens equity notes versus market mid and expected placement. Always requires human review.",
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        404: {"description": "Unknown job_id."},
    },
)
def audit(payload: JobRef, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
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


@router.post(
    "/fund",
    summary="Propose a merit pool allocation",
    description=(
        "Allocate a merit pool toward expected placement for under-placed rows. "
        "Propose only; requires_human_review is always true."
    ),
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        404: {"description": "Unknown job_id."},
    },
)
def fund(payload: FundRequest, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
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


@router.post(
    "/closer",
    summary="Project four-year total wealth",
    description=(
        "Build a four-year total-wealth projection and optional base64 PDF. "
        "send_to_candidate=true is refused with 403. No email is sent."
    ),
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        403: {"description": "Email / send_to_candidate is blocked in v1."},
    },
)
def closer(payload: CloserRequest, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
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


@router.post(
    "/brief",
    summary="Narrative brief",
    description="Short narrative for an audience (for example CHRO) from clean, audit, and fund summaries on a job.",
    responses={
        401: {"description": "Missing or invalid Muse API key."},
        404: {"description": "Unknown job_id."},
    },
)
def brief(payload: BriefRequest, authorization: Optional[str] = Header(default=None, include_in_schema=False)) -> Dict[str, Any]:
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


@router.post(
    "/act",
    summary="Blocked write verb",
    description=(
        "Hard-blocked. Muse may propose; humans post pay. Always returns 403 and has no side effects. "
        "This route does not call require_key, so a missing or invalid key also returns 403 (not 401)."
    ),
    responses={
        403: {"description": "Confirm-chip: Muse may propose. Humans post pay."},
        200: {"description": "Not used. /act always returns 403."},
    },
)
def act() -> None:
    raise HTTPException(status_code=403, detail="Confirm-chip: Muse may propose. Humans post pay.")
