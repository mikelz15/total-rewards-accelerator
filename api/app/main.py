"""Total Rewards Accelerator API."""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.auditor import audit_equity
from app.services.candidates import (
    create_candidate,
    delete_candidate,
    get_candidate,
    list_candidates,
    pipeline_summary,
    update_candidate,
)
from app.services.cleaner import clean_dataframe, parse_tabular_text
from app.services.closer import build_wealth_pdf, project_total_wealth
from app.services.flight_risk import assess_flight_risk
from app.services.placement import enrich_records, place_person, placement_summary
from app.services.remediation import remediate

app = FastAPI(
    title="Total Rewards Accelerator API",
    description=(
        "Comp Engineering Toolkit — Cleaner, Pay Equity Auditor, Remediation/Merit Pool, "
        "Flight Risk, Candidate Tracker, Candidate Closer"
    ),
    version="0.3.1",
)

# Comma-separated origins, or * for open demo
_cors = os.environ.get("CORS_ORIGINS", "*").strip()
_cors_origins = ["*"] if _cors == "*" else [o.strip() for o in _cors.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    # Local dev + hosted web (Vercel / Render) + tunnels
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional shared demo password (header: X-Demo-Password). Unset = open.
_DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "").strip()


@app.middleware("http")
async def demo_password_guard(request, call_next):  # type: ignore[no-untyped-def]
    if not _DEMO_PASSWORD:
        return await call_next(request)
    path = request.url.path
    if path in ("/", "/health", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)
    provided = request.headers.get("X-Demo-Password") or request.headers.get("x-demo-password")
    if provided != _DEMO_PASSWORD:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=401, content={"detail": "Invalid or missing demo password"})
    return await call_next(request)

DATA_DIR = Path(__file__).parent / "data"
SAMPLE_CSV = DATA_DIR / "sample_hris.csv"
SAMPLE_MESSY = DATA_DIR / "sample_hris_messy.csv"


class AuditRequest(BaseModel):
    records: List[Dict[str, Any]]
    underpaid_threshold: float = 0.90
    overpaid_threshold: float = 1.10
    top_n: int = 5
    lens: str = "both"  # market | placement | both


class FlightRiskRequest(BaseModel):
    records: List[Dict[str, Any]]


class RemediationRequest(BaseModel):
    records: List[Dict[str, Any]]
    merit_pool: float = Field(..., ge=0)
    target_compa: float = Field(1.0, gt=0, le=1.5)
    underpaid_only: bool = True
    max_increase_pct: Optional[float] = Field(None, ge=0, le=50)
    target_mode: str = "mid"  # mid | expected_placement | max_of_both


class CloserRequest(BaseModel):
    base_salary: float = Field(..., gt=0)
    target_bonus_pct: float = Field(0, ge=0)
    lti_target_value: float = Field(0, ge=0)
    years: int = Field(4, ge=1, le=10)
    salary_growth_rate: float = Field(0.03, ge=0, le=0.2)
    lti_vest_years: int = Field(4, ge=1, le=10)
    company_name: str = "Company"
    candidate_name: str = "Candidate"
    job_title: str = "Role"
    years_experience: Optional[float] = None
    education: Optional[str] = None
    required_education: Optional[str] = None
    range_min: Optional[float] = None
    range_mid: Optional[float] = None
    range_max: Optional[float] = None
    use_recommended_base: bool = False


class PlacementRequest(BaseModel):
    """Single-person or batch placement (wage-calc engine)."""

    base_salary: Optional[float] = None
    range_min: Optional[float] = None
    range_mid: Optional[float] = None
    range_max: Optional[float] = None
    years_experience: Optional[float] = None
    education: Optional[str] = None
    required_education: Optional[str] = None
    related_fraction: float = 1.0
    records: Optional[List[Dict[str, Any]]] = None


class CleanJsonRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    csv_text: Optional[str] = None


class CandidateCreate(BaseModel):
    name: str
    role: str = "Role TBD"
    stage: str = "sourced"
    base_salary: float = 0
    target_bonus_pct: float = 0
    lti_target_value: float = 0
    source: str = ""
    owner: str = ""
    notes: str = ""
    company_name: str = "Company"


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    stage: Optional[str] = None
    base_salary: Optional[float] = None
    target_bonus_pct: Optional[float] = None
    lti_target_value: Optional[float] = None
    source: Optional[str] = None
    owner: Optional[str] = None
    notes: Optional[str] = None
    company_name: Optional[str] = None


def _read_text_bytes(content: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="replace")


def _clean_from_text(text: str) -> Dict[str, Any]:
    try:
        df = parse_tabular_text(text)
    except Exception as exc:  # noqa: BLE001
        # fallback simple pandas
        try:
            df = pd.read_csv(io.StringIO(text))
        except Exception as exc2:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Could not parse tabular data: {exc2}") from exc2
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    return clean_dataframe(df)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "total-rewards-accelerator",
        "version": "0.3.1",
        "demo_password_required": bool(_DEMO_PASSWORD),
    }


@app.get("/api/sample")
def get_sample() -> Dict[str, Any]:
    path = SAMPLE_MESSY if SAMPLE_MESSY.exists() else SAMPLE_CSV
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample data not found")
    raw = path.read_text(encoding="utf-8")
    df = parse_tabular_text(raw)
    return {
        "filename": path.name,
        "csv_text": raw,
        "records": df.where(pd.notna(df), None).to_dict(orient="records"),
        "row_count": len(df),
    }


@app.post("/api/cleaner/upload")
async def cleaner_upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    content = await file.read()
    text = _read_text_bytes(content)
    result = _clean_from_text(text)
    result["source"] = {"filename": file.filename, "type": "upload"}
    return result


@app.post("/api/cleaner/paste")
def cleaner_paste(payload: CleanJsonRequest) -> Dict[str, Any]:
    if payload.csv_text:
        result = _clean_from_text(payload.csv_text)
        result["source"] = {"type": "paste"}
        return result
    if payload.records:
        df = pd.DataFrame(payload.records)
        if df.empty:
            raise HTTPException(status_code=400, detail="No data rows found")
        result = clean_dataframe(df)
        result["source"] = {"type": "paste"}
        return result
    raise HTTPException(status_code=400, detail="Provide csv_text or records")


@app.get("/api/cleaner/sample")
def cleaner_sample() -> Dict[str, Any]:
    path = SAMPLE_MESSY if SAMPLE_MESSY.exists() else SAMPLE_CSV
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample data not found")
    text = path.read_text(encoding="utf-8")
    result = _clean_from_text(text)
    result["source"] = {"filename": path.name, "type": "sample"}
    return result


@app.post("/api/placement/run")
def placement_run(payload: PlacementRequest) -> Dict[str, Any]:
    """Wage-calc placement engine: YOE + education → expected rate / gap."""
    if payload.records:
        enriched = enrich_records(payload.records, related_fraction=payload.related_fraction)
        return {"records": enriched, "summary": placement_summary(enriched)}
    result = place_person(
        base_salary=payload.base_salary,
        range_min=payload.range_min,
        range_mid=payload.range_mid,
        range_max=payload.range_max,
        years_experience=payload.years_experience,
        education=payload.education,
        required_education=payload.required_education,
        related_fraction=payload.related_fraction,
    )
    return result


@app.post("/api/auditor/run")
def auditor_run(payload: AuditRequest) -> Dict[str, Any]:
    if not payload.records:
        raise HTTPException(status_code=400, detail="records list is empty")
    audit = audit_equity(
        payload.records,
        underpaid_threshold=payload.underpaid_threshold,
        overpaid_threshold=payload.overpaid_threshold,
        top_n=payload.top_n,
        lens=payload.lens,
    )
    # Attach flight risk to employee rows
    risk = assess_flight_risk(payload.records)
    risk_by_id = {str(e.get("employee_id")): e for e in risk["employees"]}
    for emp in audit["employees"]:
        r = risk_by_id.get(str(emp.get("employee_id")), {})
        emp["flight_risk"] = r.get("flight_risk")
        emp["flight_risk_band"] = r.get("flight_risk_band")
        emp["flight_risk_drivers"] = r.get("flight_risk_drivers")
    for t in audit["top_raise_targets"]:
        r = risk_by_id.get(str(t.get("employee_id")), {})
        t["flight_risk"] = r.get("flight_risk")
        t["flight_risk_band"] = r.get("flight_risk_band")
    for s in audit["scatter"]:
        r = risk_by_id.get(str(s.get("employee_id")), {})
        s["flight_risk"] = r.get("flight_risk")
        s["flight_risk_band"] = r.get("flight_risk_band")
    audit["flight_risk_summary"] = risk["summary"]
    audit["top_flight_risks"] = risk["top_risks"][:5]
    return audit


@app.post("/api/flight-risk/run")
def flight_risk_run(payload: FlightRiskRequest) -> Dict[str, Any]:
    if not payload.records:
        raise HTTPException(status_code=400, detail="records list is empty")
    return assess_flight_risk(payload.records)


@app.post("/api/remediation/run")
def remediation_run(payload: RemediationRequest) -> Dict[str, Any]:
    if not payload.records:
        raise HTTPException(status_code=400, detail="records list is empty")
    return remediate(
        payload.records,
        merit_pool=payload.merit_pool,
        target_compa=payload.target_compa,
        underpaid_only=payload.underpaid_only,
        max_increase_pct=payload.max_increase_pct,
        target_mode=payload.target_mode,
    )


@app.post("/api/closer/project")
def closer_project(payload: CloserRequest) -> Dict[str, Any]:
    return project_total_wealth(**payload.model_dump())


@app.post("/api/closer/pdf")
def closer_pdf(payload: CloserRequest) -> Response:
    projection = project_total_wealth(**payload.model_dump())
    pdf_bytes = build_wealth_pdf(projection)
    filename = f"total_wealth_{payload.candidate_name.replace(' ', '_').lower()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Candidate Tracker ---


@app.get("/api/candidates")
def candidates_list() -> Dict[str, Any]:
    return {"candidates": list_candidates(), "summary": pipeline_summary()}


@app.post("/api/candidates")
def candidates_create(payload: CandidateCreate) -> Dict[str, Any]:
    return create_candidate(payload.model_dump())


@app.get("/api/candidates/{candidate_id}")
def candidates_get(candidate_id: str) -> Dict[str, Any]:
    row = get_candidate(candidate_id)
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return row


@app.patch("/api/candidates/{candidate_id}")
def candidates_patch(candidate_id: str, payload: CandidateUpdate) -> Dict[str, Any]:
    row = update_candidate(candidate_id, payload.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return row


@app.delete("/api/candidates/{candidate_id}")
def candidates_delete(candidate_id: str) -> Dict[str, Any]:
    ok = delete_candidate(candidate_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"deleted": True, "id": candidate_id}


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "name": "Total Rewards Accelerator API",
        "tagline": "Stop crunching rows. Start designing strategy.",
        "version": "0.3.1",
        "modules": [
            "Market Data Cleaner",
            "Placement Engine (YOE + Education)",
            "Pay Equity Auditor",
            "Remediation / Merit Pool",
            "Flight Risk",
            "Candidate Tracker",
            "Candidate Closer",
        ],
        "docs": "/docs",
    }
