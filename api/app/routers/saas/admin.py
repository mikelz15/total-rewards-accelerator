"""Platform (system) admin — Mikéz operator console API."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.auth.deps import CurrentUser, get_current_user
from app.db.models import Dataset, Membership, Organization
from app.db.session import get_session
from app.services.access import perms_for
from app.services.entitlements import MODULES, normalize_plan

router = APIRouter(prefix="/api/v1/admin", tags=["platform-admin"])


def _admin_emails() -> List[str]:
    raw = os.environ.get("SYSTEM_ADMIN_EMAILS", "").strip()
    if not raw:
        # Sensible default for this product owner; override via env in production
        return ["mikez.lopez15@gmail.com"]
    return [e.strip().lower() for e in raw.split(",") if e.strip()]


def require_system_admin(user: CurrentUser) -> None:
    email = (user.email or "").lower()
    if email not in _admin_emails():
        raise HTTPException(status_code=403, detail="Platform admin only")


class OrgPatch(BaseModel):
    plan: Optional[str] = None
    suspended: Optional[bool] = None
    max_upload_rows: Optional[int] = Field(None, ge=10, le=500000)
    entitlements: Optional[List[str]] = None  # explicit module list or null to clear
    name: Optional[str] = None


@router.get("/me")
def admin_me(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    email = (user.email or "").lower()
    allowed = email in _admin_emails()
    return {
        "is_system_admin": allowed,
        "email": user.email,
        "admin_emails_configured": _admin_emails(),
    }


@router.get("/orgs")
def list_orgs(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    require_system_admin(user)
    with get_session() as session:
        orgs = list(session.scalars(select(Organization).order_by(Organization.created_at.desc())).all())
        rows = []
        for o in orgs:
            member_count = session.scalar(
                select(func.count()).select_from(Membership).where(Membership.org_id == o.id)
            )
            dataset_count = session.scalar(
                select(func.count()).select_from(Dataset).where(Dataset.org_id == o.id)
            )
            rows.append(
                {
                    "id": str(o.id),
                    "name": o.name,
                    "slug": o.slug,
                    "plan": o.plan,
                    "suspended": bool(getattr(o, "suspended", False)),
                    "max_upload_rows": o.max_upload_rows,
                    "entitlements": getattr(o, "entitlements_json", None),
                    "member_count": int(member_count or 0),
                    "dataset_count": int(dataset_count or 0),
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                    "effective_modules": perms_for(o, "owner")["plan_modules"],
                }
            )
        return {"orgs": rows, "modules": list(MODULES)}


@router.patch("/orgs/{org_id}")
def patch_org(
    org_id: UUID,
    body: OrgPatch,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    require_system_admin(user)
    with get_session() as session:
        org = session.get(Organization, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Org not found")
        if body.plan is not None:
            org.plan = normalize_plan(body.plan)
        if body.suspended is not None:
            org.suspended = body.suspended
        if body.max_upload_rows is not None:
            org.max_upload_rows = body.max_upload_rows
        if body.entitlements is not None:
            if len(body.entitlements) == 0:
                org.entitlements_json = None
            else:
                org.entitlements_json = [m for m in body.entitlements if m in MODULES]
        if body.name is not None and body.name.strip():
            org.name = body.name.strip()
        session.flush()
        return {
            "id": str(org.id),
            "name": org.name,
            "plan": org.plan,
            "suspended": bool(org.suspended),
            "max_upload_rows": org.max_upload_rows,
            "entitlements": org.entitlements_json,
            "effective_modules": perms_for(org, "owner")["plan_modules"],
        }
