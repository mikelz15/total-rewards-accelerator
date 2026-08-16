"""Current user + org bootstrap."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.auth.deps import CurrentUser, OrgContext, ensure_user_org, get_current_user
from app.db.session import get_session

router = APIRouter(prefix="/api/v1", tags=["saas"])


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx: OrgContext = ensure_user_org(session, user)
        return {
            "user": {
                "id": str(user.user_id),
                "email": user.email,
            },
            "org": {
                "id": str(ctx.org.id),
                "name": ctx.org.name,
                "slug": ctx.org.slug,
                "plan": ctx.org.plan,
                "max_upload_rows": ctx.org.max_upload_rows,
            },
            "membership": {
                "role": ctx.membership.role,
            },
            "workspace": (
                {
                    "id": str(ctx.workspace.id),
                    "name": ctx.workspace.name,
                }
                if ctx.workspace
                else None
            ),
        }
