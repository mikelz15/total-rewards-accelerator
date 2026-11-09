"""Notes beside each chair's steps. The file stays in datasets."""

from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.access import require_write

router = APIRouter(prefix="/api/v1/workbook", tags=["saas-workbook"])


class WorkbookNote(BaseModel):
    note: str = Field(default="", max_length=4000)
    status: Optional[str] = Field(default=None, pattern="^(open|in_review|done)$")


def _row(item: Any) -> Dict[str, Any]:
    return {
        "id": str(item["id"]),
        "seat": item["seat"],
        "step_key": item["step_key"],
        "title": item["title"],
        "note": item["note"] or "",
        "assignee_role": item["assignee_role"],
        "status": item["status"],
        "updated_at": item["updated_at"].isoformat() if item["updated_at"] else None,
    }


@router.get("")
def list_items(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        rows = session.execute(
            text(
                """
                SELECT id, seat, step_key, title, note, assignee_role, status, updated_at
                FROM workbook_items
                WHERE org_id = :org
                ORDER BY seat, step_key
                """
            ),
            {"org": ctx.org.id},
        ).mappings().all()
        return {"items": [_row(row) for row in rows]}


@router.patch("/{item_id}")
def update_item(
    item_id: UUID,
    body: WorkbookNote,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_write(ctx.membership.role)
        row = session.execute(
            text(
                """
                UPDATE workbook_items
                SET note = :note,
                    status = COALESCE(:status, status),
                    updated_at = now()
                WHERE id = :id AND org_id = :org
                RETURNING id, seat, step_key, title, note, assignee_role, status, updated_at
                """
            ),
            {
                "note": body.note.strip(),
                "status": body.status,
                "id": item_id,
                "org": ctx.org.id,
            },
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="That note is not in this workspace")
        return _row(row)
