"""Org branding. Owners and admins set the org image; everyone in the org sees it."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.access import require_team_admin
from app.services.branding import (
    BRANDING_BUCKET,
    branding_available,
    get_brand_image_path,
    set_brand_image_path,
    valid_brand_path,
)

router = APIRouter(prefix="/api/v1/org", tags=["saas-branding"])


class BrandingBody(BaseModel):
    # Storage object key from the browser upload, or null to clear.
    path: Optional[str] = Field(default=None, max_length=200)


def _unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail="Org branding is not set up on this database yet (migration 008_org_branding).",
    )


@router.get("/branding")
def read_branding(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        return {
            "available": branding_available(session),
            "bucket": BRANDING_BUCKET,
            "brand_image_path": get_brand_image_path(session, ctx.org.id),
        }


@router.put("/branding")
def update_branding(
    body: BrandingBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_team_admin(ctx.membership.role)
        if ctx.org.suspended:
            raise HTTPException(status_code=403, detail="This organization is suspended.")
        if not branding_available(session):
            raise _unavailable()
        path = (body.path or "").strip() or None
        if path is not None and not valid_brand_path(ctx.org.id, path):
            raise HTTPException(
                status_code=400,
                detail="Image path must be <org id>/<file>.png|jpg|svg|webp in your org's folder.",
            )
        previous = get_brand_image_path(session, ctx.org.id)
        set_brand_image_path(session, ctx.org.id, path)
        session.flush()
        return {
            "available": True,
            "bucket": BRANDING_BUCKET,
            "brand_image_path": path,
            "previous_path": previous,
        }
