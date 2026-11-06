"""Platform (system) admin — Mikéz operator console API."""

from __future__ import annotations

import os
import secrets
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.auth.deps import CurrentUser, get_current_user
from app.db.models import Dataset, Invite, Membership, Organization, SeatLicense
from app.db.session import allow_seat_roles, bind_rls, get_session
from app.services.access import perms_for
from app.services.entitlements import MODULES, ROLE_MODULES, normalize_plan
from app.services.seat_license import as_utc

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
        bind_rls(session, user_id=str(user.user_id), platform_admin=True)
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
        bind_rls(session, user_id=str(user.user_id), platform_admin=True)
        org = session.get(Organization, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Org not found")
        if body.plan is not None:
            org.plan = normalize_plan(body.plan)
            if org.plan != "trial":
                org.access_until = None
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


class LicenseBody(BaseModel):
    role: str
    starts_at: str
    ends_at: str
    email: Optional[str] = None


def _parse_when(value: str, label: str):
    from datetime import datetime

    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail=f"{label} is required.")
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{label} is not a time.") from exc
    return as_utc(parsed)


@router.post("/orgs/{org_id}/licenses")
def issue_license(
    org_id: UUID,
    body: LicenseBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """Open one license, then optionally the passage for one email. No membership yet."""
    require_system_admin(user)
    role = (body.role or "").strip().lower()
    if role not in ROLE_MODULES:
        raise HTTPException(status_code=400, detail="Unknown seat")
    starts_at = _parse_when(body.starts_at, "Start")
    ends_at = _parse_when(body.ends_at, "End")
    if ends_at <= starts_at:
        raise HTTPException(status_code=400, detail="The license has to end after it starts.")
    email = (body.email or "").strip().lower() or None
    with get_session() as session:
        allow_seat_roles(session)
        bind_rls(session, user_id=str(user.user_id), platform_admin=True)
        org = session.get(Organization, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Org not found")
        lic = SeatLicense(
            org_id=org.id,
            role=role,
            starts_at=starts_at,
            ends_at=ends_at,
            issued_by=user.user_id,
        )
        session.add(lic)
        session.flush()
        accept_path = None
        if email:
            token = secrets.token_urlsafe(24)
            session.add(
                Invite(
                    org_id=org.id,
                    email=email,
                    role=role,
                    token=token,
                    invited_by=user.user_id,
                    license_id=lic.id,
                )
            )
            session.flush()
            accept_path = f"/app/team?accept={token}"
        note = (
            f"License is open. Share {accept_path} after {email} has a TRA account."
            if accept_path
            else "License is open. No person is on it yet."
        )
        return {
            "id": str(lic.id),
            "org_id": str(org.id),
            "role": lic.role,
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
            "email": email,
            "accept_path": accept_path,
            "note": note,
        }


class SeatBody(BaseModel):
    role: str


@router.patch("/seat")
def sit_as(body: SeatBody, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    """Switch the operator's own seat so a home can be filmed. Admin stays open."""
    require_system_admin(user)
    role = (body.role or "").strip().lower()
    if role not in ROLE_MODULES:
        raise HTTPException(status_code=400, detail="Unknown role")
    with get_session() as session:
        allow_seat_roles(session)
        bind_rls(session, user_id=str(user.user_id), platform_admin=True)
        membership = session.scalar(
            select(Membership)
            .where(Membership.user_id == user.user_id)
            .order_by(Membership.created_at.asc())
            .limit(1)
        )
        if not membership:
            raise HTTPException(status_code=404, detail="No workspace seat to switch")
        membership.role = role
        session.flush()
        return {"role": membership.role, "org_id": str(membership.org_id)}
