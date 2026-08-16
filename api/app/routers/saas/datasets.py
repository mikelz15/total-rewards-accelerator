"""Persist cleaned HRIS datasets per org."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Dataset
from app.db.session import get_session
from app.services.access import require_module, require_write

router = APIRouter(prefix="/api/v1/datasets", tags=["saas-datasets"])


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    source_filename: Optional[str] = None
    records: List[Dict[str, Any]] = Field(default_factory=list)
    stats: Dict[str, Any] = Field(default_factory=dict)
    issues: List[Dict[str, Any]] = Field(default_factory=list)


def _serialize(ds: Dataset) -> Dict[str, Any]:
    return {
        "id": str(ds.id),
        "org_id": str(ds.org_id),
        "workspace_id": str(ds.workspace_id) if ds.workspace_id else None,
        "name": ds.name,
        "source_filename": ds.source_filename,
        "row_count": ds.row_count,
        "stats": ds.stats_json or {},
        "issues": ds.issues_json or [],
        "created_by": str(ds.created_by) if ds.created_by else None,
        "created_at": ds.created_at.isoformat() if ds.created_at else None,
    }


@router.get("")
def list_datasets(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "cleaner")
        rows = session.scalars(
            select(Dataset)
            .where(Dataset.org_id == ctx.org.id)
            .order_by(Dataset.created_at.desc())
            .limit(50)
        ).all()
        return {"datasets": [_serialize(r) for r in rows]}


@router.post("")
def create_dataset(payload: DatasetCreate, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_module(ctx.org, ctx.membership.role, "cleaner")
        require_write(ctx.membership.role)
        max_rows = ctx.org.max_upload_rows or 5000
        records = payload.records[:max_rows]
        ds = Dataset(
            org_id=ctx.org.id,
            workspace_id=ctx.workspace.id if ctx.workspace else None,
            name=payload.name,
            source_filename=payload.source_filename,
            row_count=len(records),
            records_json=records,
            stats_json=payload.stats,
            issues_json=payload.issues,
            created_by=user.user_id,
        )
        session.add(ds)
        session.flush()
        return _serialize(ds)


@router.get("/{dataset_id}")
def get_dataset(dataset_id: UUID, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        ds = session.get(Dataset, dataset_id)
        if not ds or ds.org_id != ctx.org.id:
            raise HTTPException(status_code=404, detail="Dataset not found")
        out = _serialize(ds)
        out["records"] = ds.records_json or []
        return out


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: UUID, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        ds = session.get(Dataset, dataset_id)
        if not ds or ds.org_id != ctx.org.id:
            raise HTTPException(status_code=404, detail="Dataset not found")
        session.delete(ds)
        return {"ok": True, "id": str(dataset_id)}
