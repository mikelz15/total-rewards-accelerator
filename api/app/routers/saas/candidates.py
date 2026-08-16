"""Org-scoped candidate tracker (persistent)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Candidate
from app.db.session import get_session
from app.services.access import require_module, require_write

router = APIRouter(prefix="/api/v1/candidates", tags=["saas-candidates"])

STAGES = {"sourced", "screen", "interview", "offer", "accepted", "declined", "withdrawn"}


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


def _serialize(c: Candidate) -> Dict[str, Any]:
    return {
        "id": str(c.id),
        "org_id": str(c.org_id),
        "name": c.name,
        "role": c.role,
        "stage": c.stage,
        "base_salary": c.base_salary,
        "target_bonus_pct": c.target_bonus_pct,
        "lti_target_value": c.lti_target_value,
        "source": c.source,
        "owner": c.owner,
        "notes": c.notes,
        "company_name": c.company_name,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


def _pipeline_summary(rows: list[Candidate]) -> Dict[str, Any]:
    by_stage: Dict[str, int] = {}
    for c in rows:
        by_stage[c.stage] = by_stage.get(c.stage, 0) + 1
    return {"total": len(rows), "by_stage": by_stage}


@router.get("")
def list_candidates(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "tracker")
        rows = list(
            session.scalars(
                select(Candidate)
                .where(Candidate.org_id == ctx.org.id)
                .order_by(Candidate.updated_at.desc())
            ).all()
        )
        return {
            "candidates": [_serialize(c) for c in rows],
            "summary": _pipeline_summary(rows),
            "demo": {"sample_only": False},
        }


@router.post("")
def create_candidate(payload: CandidateCreate, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    if payload.stage not in STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage; use one of {sorted(STAGES)}")
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "tracker")
        require_write(ctx.membership.role)
        c = Candidate(
            org_id=ctx.org.id,
            workspace_id=ctx.workspace.id if ctx.workspace else None,
            **payload.model_dump(),
        )
        session.add(c)
        session.flush()
        return _serialize(c)


@router.patch("/{candidate_id}")
def update_candidate(
    candidate_id: UUID,
    payload: CandidateUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)
    if "stage" in data and data["stage"] not in STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage; use one of {sorted(STAGES)}")
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "tracker")
        require_write(ctx.membership.role)
        c = session.get(Candidate, candidate_id)
        if not c or c.org_id != ctx.org.id:
            raise HTTPException(status_code=404, detail="Candidate not found")
        for k, v in data.items():
            setattr(c, k, v)
        c.updated_at = datetime.now(timezone.utc)
        session.flush()
        return _serialize(c)


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: UUID, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "tracker")
        require_write(ctx.membership.role)
        c = session.get(Candidate, candidate_id)
        if not c or c.org_id != ctx.org.id:
            raise HTTPException(status_code=404, detail="Candidate not found")
        session.delete(c)
        return {"ok": True, "id": str(candidate_id)}
