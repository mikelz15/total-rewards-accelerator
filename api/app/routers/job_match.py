"""Job matching for Compensation / Total Rewards professionals.

Public route computes and drops. Signed-in routes store in the account
repository and require the job_match module (Rewards viewpoint).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.access import require_module, require_write
from app.services.job_match import match_to_external

public_router = APIRouter(tags=["job-match"])
saas_router = APIRouter(prefix="/api/v1", tags=["saas-job-match"])


class ExternalJob(BaseModel):
    title: str
    code: Optional[str] = None
    family: Optional[str] = None
    function: Optional[str] = None
    focus: Optional[str] = None
    level: Optional[int] = None
    description: str = ""
    duties: List[str] = Field(default_factory=list)


class InternalJob(BaseModel):
    title: str
    family: Optional[str] = None
    function: Optional[str] = None
    focus: Optional[str] = None
    level: Optional[int] = None
    description: str = ""
    duties: List[str] = Field(default_factory=list)


class MatchIn(BaseModel):
    internal: InternalJob
    catalog: List[ExternalJob] = Field(default_factory=list)


def _sample_internal() -> Dict[str, Any]:
    return {
        "title": "Compensation Partner",
        "family": "compensation",
        "level": 4,
        "description": "Own salary structures and place offers against the compensation benchmark.",
        "duties": [
            "Own salary structures and pay ranges",
            "Place offers against market benchmark",
            "Match jobs to survey roles",
            "Support annual cycle",
        ],
    }


def _sample_catalog() -> List[Dict[str, Any]]:
    return [
        {
            "title": "Compensation Partner – Corporate",
            "code": "CA-Comp-Partner",
            "family": "compensation",
            "level": 4,
            "description": "Owns structures, places offers, matches jobs to the survey.",
            "duties": ["Own structures", "Place offers", "Match jobs"],
        },
        {
            "title": "Senior Compensation Analyst",
            "code": "CA-Comp-SrAnalyst",
            "family": "compensation",
            "level": 3,
            "description": "Supports matching and offer worksheets.",
            "duties": ["Support matching", "Offer worksheets"],
        },
        {
            "title": "Total Rewards Manager",
            "code": "CA-TR-Manager",
            "family": "compensation",
            "level": 5,
            "description": "Broader total rewards including benefits.",
            "duties": ["Compensation", "Benefits", "Equity"],
        },
    ]


@public_router.get("/api/job-match/sample")
def job_match_sample() -> Dict[str, Any]:
    return match_to_external(_sample_internal(), _sample_catalog())


@public_router.post("/api/job-match")
def job_match(payload: MatchIn) -> Dict[str, Any]:
    """Computed and dropped. Nothing is stored."""
    return match_to_external(payload.internal.model_dump(), [c.model_dump() for c in payload.catalog])


@saas_router.post("/job-match")
def saas_job_match(
    payload: MatchIn,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "job_match")
        require_write(ctx.membership.role)
    # Storage of the ledger into the account repository is wired once the
    # migration is applied. For now return the computed matches.
    return match_to_external(payload.internal.model_dump(), [c.model_dump() for c in payload.catalog])
