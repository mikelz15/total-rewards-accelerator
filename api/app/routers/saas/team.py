"""Team membership and invites."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Invite, Membership, SeatLicense
from app.db.session import bind_rls, get_session
from app.services.access import require_team_admin
from app.services.entitlements import ROLE_MODULES, normalize_role
from app.services.seat_license import (
    CUSTOMER_SEAT_CLOSED,
    LICENSE_NOT_OPEN,
    PASSAGE_WITHOUT_LICENSE,
    license_is_open,
)

router = APIRouter(prefix="/api/v1/team", tags=["saas-team"])


class InviteBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    role: str = "member"


class RoleBody(BaseModel):
    role: str


def _serialize_member(m: Membership, email: Optional[str] = None) -> Dict[str, Any]:
    return {
        "id": str(m.id),
        "user_id": str(m.user_id),
        "role": m.role,
        "email": email,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("")
def list_team(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        members = list(
            session.scalars(select(Membership).where(Membership.org_id == ctx.org.id)).all()
        )
        invites = list(
            session.scalars(
                select(Invite).where(Invite.org_id == ctx.org.id, Invite.accepted_at.is_(None))
            ).all()
        )
        # Email only known for current user without auth.users join
        out_members = []
        for m in members:
            email = user.email if m.user_id == user.user_id else None
            out_members.append(_serialize_member(m, email))
        return {
            "members": out_members,
            "invites": [
                {
                    "id": str(i.id),
                    "email": i.email,
                    "role": i.role,
                    "token": "",
                    "created_at": i.created_at.isoformat() if i.created_at else None,
                }
                for i in invites
            ],
            "roles": sorted(ROLE_MODULES.keys()),
            "you": {
                "user_id": str(user.user_id),
                "role": ctx.membership.role,
                "email": user.email,
            },
        }


@router.post("/invites")
def create_invite(body: InviteBody, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    """Customers do not mint seats. The platform issues a license first."""
    del body, user
    raise HTTPException(status_code=403, detail=CUSTOMER_SEAT_CLOSED)


class AcceptBody(BaseModel):
    token: str


@router.post("/invites/accept")
def accept_invite(body: AcceptBody, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    token = (body.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    with get_session() as session:
        bind_rls(session, user_id=str(user.user_id), invite_token=token)
        inv = session.scalar(select(Invite).where(Invite.token == token, Invite.accepted_at.is_(None)))
        if not inv:
            raise HTTPException(status_code=404, detail="Invite not found or already used")
        if user.email and inv.email.lower() != user.email.lower():
            raise HTTPException(
                status_code=403,
                detail=f"Invite is for {inv.email}. Sign in with that email.",
            )
        if inv.license_id is None:
            raise HTTPException(status_code=403, detail=PASSAGE_WITHOUT_LICENSE)
        lic = session.get(SeatLicense, inv.license_id)
        now = datetime.now(timezone.utc)
        if lic is None or not license_is_open(lic.starts_at, lic.ends_at, lic.membership_id, now):
            raise HTTPException(status_code=403, detail=LICENSE_NOT_OPEN)
        if lic.org_id != inv.org_id or lic.role != inv.role:
            raise HTTPException(status_code=403, detail=LICENSE_NOT_OPEN)
        existing = session.scalar(
            select(Membership).where(
                Membership.org_id == inv.org_id, Membership.user_id == user.user_id
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="This person is already in the workspace.")
        membership = Membership(org_id=inv.org_id, user_id=user.user_id, role=inv.role)
        session.add(membership)
        session.flush()
        lic.membership_id = membership.id
        inv.accepted_at = now
        session.flush()
        return {"ok": True, "org_id": str(inv.org_id), "role": inv.role}


@router.patch("/members/{user_id}")
def update_role(
    user_id: UUID,
    body: RoleBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    role = normalize_role(body.role)
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_team_admin(ctx.membership.role)
        if user_id == user.user_id and role != "owner" and ctx.membership.role == "owner":
            # prevent lockout: ensure another owner exists
            owners = session.scalars(
                select(Membership).where(
                    Membership.org_id == ctx.org.id, Membership.role == "owner"
                )
            ).all()
            if len(list(owners)) <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the only owner.")
        m = session.scalar(
            select(Membership).where(
                Membership.org_id == ctx.org.id, Membership.user_id == user_id
            )
        )
        if not m:
            raise HTTPException(status_code=404, detail="Member not found")
        if m.role == "owner" and role != "owner" and ctx.membership.role != "owner":
            raise HTTPException(status_code=403, detail="Only an owner can change another owner.")
        m.role = role
        session.flush()
        return _serialize_member(m)


@router.delete("/members/{user_id}")
def remove_member(user_id: UUID, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_team_admin(ctx.membership.role)
        if user_id == user.user_id:
            raise HTTPException(status_code=400, detail="Cannot remove yourself.")
        m = session.scalar(
            select(Membership).where(
                Membership.org_id == ctx.org.id, Membership.user_id == user_id
            )
        )
        if not m:
            raise HTTPException(status_code=404, detail="Member not found")
        if m.role == "owner" and ctx.membership.role != "owner":
            raise HTTPException(status_code=403, detail="Only an owner can remove an owner.")
        session.delete(m)
        return {"ok": True, "user_id": str(user_id)}
