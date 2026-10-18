"""Signed-in governance library. Not a module, and not the national pack."""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Dataset
from app.db.session import get_session
from app.services.governance import library

router = APIRouter(prefix="/api/v1", tags=["saas-governance"])


@router.get("/governance")
def governance_library(
    as_of: Optional[date] = None,
    dataset_id: Optional[UUID] = None,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        if dataset_id:
            ds = session.get(Dataset, dataset_id)
            if not ds or ds.org_id != ctx.org.id:
                raise HTTPException(status_code=404, detail="Dataset not found")
        else:
            ds = session.scalars(
                select(Dataset)
                .where(Dataset.org_id == ctx.org.id)
                .order_by(Dataset.created_at.desc())
                .limit(1)
            ).first()
        records = (ds.records_json or []) if ds else []
        result = library(records, as_of)
        if ds is None:
            result["empty_reason"] = "no_file"
        result["dataset_id"] = str(ds.id) if ds else None
        result["dataset_name"] = ds.name if ds else None
        return result
