"""Total Rewards Accelerator API."""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

# Load api/.env for local SaaS (DATABASE_URL, SUPABASE_JWT_SECRET)
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:
    pass

# Optional composite secrets from TRA_SAAS_JSON (Render single-var workaround)
try:
    from app.db.session import apply_composite_saas_env

    apply_composite_saas_env()
except Exception:
    pass

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.db.session import saas_config_status, saas_enabled
from app.routers.saas import admin as saas_admin
from app.routers.saas import analysis as saas_analysis
from app.routers.saas import billing as saas_billing
from app.routers.saas import candidates as saas_candidates
from app.routers.saas import cleaner as saas_cleaner
from app.routers.saas import datasets as saas_datasets
from app.routers.saas import governance as saas_governance
from app.routers.saas import me as saas_me
from app.routers.saas import team as saas_team
from app.routers import muse as muse_router
from app.routers import resume_credit as resume_credit_router
from app.routers import job_match as job_match_router
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
from app.services.demo_guard import (
    DEMO_DISCLAIMER,
    DEMO_MAX_ROWS,
    client_ip,
    enforce_demo_clean,
)
from app.services.flight_risk import assess_flight_risk
from app.services.placement import enrich_records, place_person, placement_summary
from app.services.remediation import remediate
from app.services.cycle_lock import lock_cycle
from app.services.philosophy_check import check_philosophy

# Public demo: Candidate Tracker + Closer stay on synthetic sample data only
DEMO_SAMPLE_ONLY_PIPELINE = True


def _cors_config() -> Dict[str, Any]:
    """
    CORS_ORIGINS — comma-separated list, or * (default) for open demo.
    CORS_ORIGIN_REGEX — optional, e.g. https://.*\\.vercel\\.app
    After Vercel cutover, set CORS_ORIGINS to the exact production web URL.
    """
    raw = os.environ.get("CORS_ORIGINS", "*").strip()
    regex = os.environ.get("CORS_ORIGIN_REGEX", "").strip() or None
    on_render = bool(os.environ.get("RENDER") or os.environ.get("RENDER_SERVICE_ID"))

    if raw == "*":
        return {"allow_origins": ["*"], "allow_origin_regex": regex}
    origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    if on_render and not regex:
        regex = r"https://.*\.vercel\.app"
    return {"allow_origins": origins or ["*"], "allow_origin_regex": regex}


_cors = _cors_config()

app = FastAPI(
    title="Total Rewards Accelerator API",
    description=(
        "Comp Engineering Toolkit — Cleaner, Equity + Merit, Candidate Tracker, Closer, Job Matching. "
        "Shared Placement Engine (YOE + education). Public demo enforces row caps, "
        "PHI header scan, and upload rate limits. SaaS routes under /api/v1 require "
        "Supabase Bearer tokens when DATABASE_URL + SUPABASE_JWT_SECRET are set."
    ),
    version="0.6.7",
)

# Multi-tenant SaaS (no-op impact on demo routes)
app.include_router(saas_me.router)
app.include_router(saas_datasets.router)
app.include_router(saas_candidates.router)
app.include_router(saas_cleaner.router)
app.include_router(saas_analysis.router)
app.include_router(saas_team.router)
app.include_router(saas_billing.router)
app.include_router(saas_admin.router)
app.include_router(saas_governance.router)
app.include_router(muse_router.router)
app.include_router(resume_credit_router.public_router)
app.include_router(resume_credit_router.saas_router)
app.include_router(job_match_router.public_router)
app.include_router(job_match_router.saas_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors["allow_origins"],
    allow_origin_regex=_cors.get("allow_origin_regex"),
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
    # SaaS JWT auth owns /api/v1/* — do not require demo password there
    # Stripe webhooks also hit /api/v1/billing/webhook without demo password
    if path.startswith("/api/v1") or path.startswith("/v1"):
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


class CycleLockRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    envelope_pct: float = Field(0.032, ge=0, le=0.2)
    confirm_exceptions: Optional[Dict[str, bool]] = None


class PhilosophyRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    csv_text: Optional[str] = None
    market_low: float = Field(0.97, gt=0, lt=3)
    market_high: float = Field(1.03, gt=0, lt=3)
    dept_log_cap: float = Field(0.08, gt=0, le=1)


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


def _parse_to_df(text: str) -> pd.DataFrame:
    try:
        df = parse_tabular_text(text)
    except Exception as exc:  # noqa: BLE001
        try:
            df = pd.read_csv(io.StringIO(text))
        except Exception as exc2:  # noqa: BLE001
            raise HTTPException(
                status_code=400, detail=f"Could not parse tabular data: {exc2}"
            ) from exc2
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    return df


def _clean_user_dataframe(
    df: pd.DataFrame,
    *,
    request: Request,
    count_toward_rate_limit: bool,
) -> Dict[str, Any]:
    ip = client_ip(
        {k.lower(): v for k, v in request.headers.items()},
        request.client.host if request.client else None,
    )
    try:
        demo_meta = enforce_demo_clean(
            list(df.columns),
            len(df),
            count_toward_rate_limit=count_toward_rate_limit,
            ip=ip,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    issues_prefix: List[Dict[str, Any]] = []
    if demo_meta.get("truncated_to_max_rows"):
        issues_prefix.append(
            {
                "level": "warning",
                "message": (
                    f"Demo limit: only the first {DEMO_MAX_ROWS} data rows were processed "
                    f"({demo_meta['rows_submitted']} submitted)."
                ),
                "row": None,
            }
        )
        df = df.head(DEMO_MAX_ROWS).copy()

    result = clean_dataframe(df)
    result["demo"] = demo_meta
    result.setdefault("issues", [])
    result["issues"] = issues_prefix + list(result["issues"])
    return result


def _clean_from_text(text: str) -> Dict[str, Any]:
    """Sample path / internal: no rate limit (still caps rows for parity)."""
    df = _parse_to_df(text)
    if len(df) > DEMO_MAX_ROWS:
        df = df.head(DEMO_MAX_ROWS).copy()
    return clean_dataframe(df)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "total-rewards-accelerator",
        "version": "0.6.7",
        "demo_password_required": bool(_DEMO_PASSWORD),
        "saas": {
            "enabled": saas_enabled(),
            "routes": "/api/v1/*",
            "auth": "supabase_jwt",
            "config": saas_config_status(),
        },
        "stripe": {
            "configured": bool(os.environ.get("STRIPE_SECRET_KEY", "").strip()),
            "webhook_configured": bool(os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()),
            "prices": {
                k: bool(os.environ.get(f"STRIPE_PRICE_{k.upper()}", "").strip())
                for k in ("cleaner", "equity", "tracker", "closer", "job_match", "suite")
            },
        },
        "demo": {
            "max_upload_rows": DEMO_MAX_ROWS,
            "uploads_per_week": 5,
            "sample_only_pipeline": DEMO_SAMPLE_ONLY_PIPELINE,
            "disclaimer": DEMO_DISCLAIMER,
        },
    }


# ... (rest of main.py remains unchanged from prior version; truncated here for the update)
# Full file content continues with all existing endpoints unchanged.
