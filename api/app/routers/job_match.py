"""Job matching for the Rewards seat.

Public routes compute and drop. The signed-in confirm writes the ledger.
The sample catalog is TRA-owned. Survey books are not accepted.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import JobMatchJob, JobMatchLedger
from app.db.session import get_session
from app.services.access import can_write, require_module, require_write
from app.services.job_match import match_to_external, sample_catalog, sample_internal, slim_match

public_router = APIRouter(tags=["job-match"])
saas_router = APIRouter(prefix="/api/v1", tags=["saas-job-match"])

MAX_TITLE = 200
MAX_DESCRIPTION = 20_000
MAX_DUTY = 300
MAX_DUTIES = 20
MAX_CATALOG = 12


class ExternalJob(BaseModel):
    title: str = Field(max_length=MAX_TITLE)
    code: Optional[str] = Field(default=None, max_length=80)
    family: Optional[str] = Field(default=None, max_length=40)
    function: Optional[str] = Field(default=None, max_length=80)
    focus: Optional[str] = Field(default=None, max_length=80)
    level: Optional[int] = Field(default=None, ge=1, le=10)
    description: str = Field(default="", max_length=MAX_DESCRIPTION)
    duties: List[str] = Field(default_factory=list, max_length=MAX_DUTIES)


class InternalJob(ExternalJob):
    pass


class MatchIn(BaseModel):
    internal: InternalJob
    catalog: List[ExternalJob] = Field(default_factory=list, max_length=MAX_CATALOG)
    confirm: bool = False


def _clean_duties(duties: List[str]) -> List[str]:
    out = []
    for duty in duties[:MAX_DUTIES]:
        text = duty.strip()
        if text:
            out.append(text[:MAX_DUTY])
    return out


def _payload(body: MatchIn) -> Dict[str, Any]:
    internal = body.internal.model_dump()
    internal["duties"] = _clean_duties(internal.get("duties") or [])
    catalog = body.catalog or [ExternalJob(**row) for row in sample_catalog()]
    rows = []
    for job in catalog[:MAX_CATALOG]:
        row = job.model_dump() if isinstance(job, ExternalJob) else job
        row["duties"] = _clean_duties(row.get("duties") or [])
        rows.append(row)
    return match_to_external(internal, rows)


def _public_view(result: Dict[str, Any]) -> Dict[str, Any]:
    return {**result, "stored": False, "sample_catalog": True}


@public_router.get("/api/job-match/sample")
def job_match_sample() -> Dict[str, Any]:
    return _public_view(match_to_external(sample_internal(), sample_catalog()))


@public_router.post("/api/job-match")
def job_match(payload: MatchIn) -> Dict[str, Any]:
    """Computed and dropped. Nothing is stored."""
    if payload.confirm:
        raise HTTPException(status_code=400, detail="Confirm is signed-in only.")
    return _public_view(_payload(payload))


def _serialize(ledger: JobMatchLedger, job: JobMatchJob) -> Dict[str, Any]:
    confirmed = ledger.confirmed_at.isoformat() if ledger.confirmed_at else None
    return {
        "id": str(ledger.id),
        "job_id": str(job.id),
        "title": job.title,
        "family": job.family,
        "level": job.level,
        "overall_match": ledger.overall_match,
        "matches": ledger.matches_json or [],
        "confirmed_at": confirmed,
    }


@saas_router.get("/job-match")
def list_job_matches(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "job_match")
        rows = session.execute(
            select(JobMatchLedger, JobMatchJob)
            .join(JobMatchJob, JobMatchJob.id == JobMatchLedger.job_id)
            .where(JobMatchLedger.org_id == ctx.org.id)
            .order_by(JobMatchLedger.created_at.desc())
            .limit(20)
        ).all()
        return {
            "matches": [_serialize(ledger, job) for ledger, job in rows],
            "can_write": can_write(ctx.membership.role),
        }


@saas_router.post("/job-match")
def saas_job_match(
    payload: MatchIn,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    result = _payload(payload)
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "job_match")
        if not payload.confirm:
            return {**result, "stored": False}
        require_write(ctx.membership.role)
        if not result["can_confirm"]:
            raise HTTPException(status_code=400, detail="No match to confirm.")
        internal = result["internal"]
        job = JobMatchJob(
            org_id=ctx.org.id,
            title=internal["title"][:MAX_TITLE],
            family=internal.get("family"),
            function=internal.get("function"),
            focus=internal.get("focus"),
            level=internal.get("level"),
            description=(internal.get("description") or "")[:MAX_DESCRIPTION],
            duties_json=internal.get("duties") or [],
            created_by=user.user_id,
        )
        session.add(job)
        session.flush()
        ledger = JobMatchLedger(
            org_id=ctx.org.id,
            job_id=job.id,
            matches_json=[slim_match(row) for row in result["matches"] if row.get("title")],
            overall_match=result["overall_match"],
            confirmed_by=user.user_id,
            confirmed_at=datetime.now(timezone.utc),
        )
        session.add(ledger)
        session.flush()
        return {**result, "stored": True, "ledger": _serialize(ledger, job)}
