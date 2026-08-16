"""Current user + org bootstrap + permissions."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends

from app.auth.deps import CurrentUser, OrgContext, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.access import perms_for

router = APIRouter(prefix="/api/v1", tags=["saas"])


def _is_system_admin(email: Optional[str]) -> bool:
    raw = os.environ.get("SYSTEM_ADMIN_EMAILS", "mikez.lopez15@gmail.com")
    allowed = {e.strip().lower() for e in raw.split(",") if e.strip()}
    return (email or "").lower() in allowed


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx: OrgContext = ensure_user_org(session, user)
        perms = perms_for(ctx.org, ctx.membership.role)
        return {
            "user": {
                "id": str(user.user_id),
                "email": user.email,
                "is_system_admin": _is_system_admin(user.email),
            },
            "org": {
                "id": str(ctx.org.id),
                "name": ctx.org.name,
                "slug": ctx.org.slug,
                "plan": ctx.org.plan,
                "max_upload_rows": ctx.org.max_upload_rows,
                "suspended": bool(getattr(ctx.org, "suspended", False)),
                "entitlements": getattr(ctx.org, "entitlements_json", None),
            },
            "membership": {
                "role": ctx.membership.role,
            },
            "permissions": perms,
            "workspace": (
                {
                    "id": str(ctx.workspace.id),
                    "name": ctx.workspace.name,
                }
                if ctx.workspace
                else None
            ),
        }
