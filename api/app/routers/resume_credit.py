"""Resume credit tally. Public route stores nothing.

The signed-in route serves Tracker and Closer: the tally widget is embedded
on both the Candidate Tracker screen and the Closer screen, so either module
entitlement opens it."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.access import require_any_module, require_write
from app.services.resume_credit import extract_text, infer_family, infer_level, tally_jobs, tally_text

SAMPLE_PATH = Path(__file__).resolve().parents[1] / "data" / "sample_resume.txt"
SAMPLE_TARGET = "Compensation Partner"

public_router = APIRouter(tags=["resume-credit"])
saas_router = APIRouter(prefix="/api/v1", tags=["saas-resume-credit"])


class JobIn(BaseModel):
    title: str = ""
    employer: str = ""
    start: Optional[str] = None
    end: Optional[str] = None
    credit: Optional[str] = None
    family: Optional[str] = None
    level: Optional[int] = None
    reason: str = ""
    bullets: List[str] = Field(default_factory=list)


class TallyIn(BaseModel):
    text: Optional[str] = None
    jobs: Optional[List[JobIn]] = None
    target_title: Optional[str] = None
    target_family: Optional[str] = None
    target_level: Optional[int] = None
    as_of: Optional[str] = None


def _as_of(value: Optional[str]) -> date:
    if not value:
        return date.today()
    try:
        return date.fromisoformat(value[:10])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="as_of must be YYYY-MM-DD") from exc


def run_tally(payload: TallyIn) -> Dict[str, Any]:
    as_of = _as_of(payload.as_of)
    family = payload.target_family or infer_family(payload.target_title or "")
    level = payload.target_level if payload.target_level is not None else infer_level(payload.target_title or "")
    try:
        if payload.text:
            return tally_text(
                payload.text,
                as_of=as_of,
                target_title=payload.target_title,
                target_family=family,
                target_level=level,
            )
        if payload.jobs:
            ledger = tally_jobs(
                [job.model_dump() for job in payload.jobs],
                as_of=as_of,
                target_family=family,
                target_level=level,
            )
            ledger["education"] = None
            ledger["target"] = {
                "title": payload.target_title,
                "family": family,
                "level": level,
            }
            return ledger
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=400, detail="Provide a resume paste or a list of jobs.")


def _sample() -> Dict[str, Any]:
    if not SAMPLE_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample resume not found")
    text = SAMPLE_PATH.read_text(encoding="utf-8")
    ledger = tally_text(text, target_title=SAMPLE_TARGET, as_of=date(2026, 10, 18))
    ledger["source"] = "sample"
    ledger["resume_text"] = text
    return ledger


@public_router.get("/api/resume-credit/sample")
def resume_credit_sample() -> Dict[str, Any]:
    return _sample()


@public_router.post("/api/resume-credit/tally")
def resume_credit_tally(payload: TallyIn) -> Dict[str, Any]:
    """Computed and dropped. Nothing is stored."""
    return run_tally(payload)


@public_router.post("/api/resume-credit/upload")
async def resume_credit_upload(
    file: UploadFile = File(...),
    target_title: str = Form(""),
) -> Dict[str, Any]:
    content = await file.read()
    if len(content) > 1_000_000:
        raise HTTPException(status_code=400, detail="That file is too large for one resume.")
    try:
        text = extract_text(file.filename or "", content)
        return tally_text(text, target_title=target_title or None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@saas_router.get("/resume-credit/sample")
def saas_resume_credit_sample(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_any_module(ctx.org, ctx.membership.role, ["closer", "tracker"])
    return _sample()


@saas_router.post("/resume-credit/tally")
def saas_resume_credit_tally(
    payload: TallyIn,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_any_module(ctx.org, ctx.membership.role, ["closer", "tracker"])
        require_write(ctx.membership.role)
    return run_tally(payload)
