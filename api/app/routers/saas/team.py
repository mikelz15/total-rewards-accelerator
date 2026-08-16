"""Team membership and invites."""

from __future__ import annotations

import secrets
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Invite, Membership
from app.db.session import get_session
from app.services.access import require_team_admin
from app.services.entitlements import ROLE_MODULES, normalize_role

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
                    "token": i.token,
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
    role = normalize_role(body.role)
    if role == "owner":
        raise HTTPException(status_code=400, detail="Cannot invite as owner. Transfer ownership separately.")
    email = body.email.strip().lower()
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_team_admin(ctx.membership.role)
        token = secrets.token_urlsafe(24)
        inv = Invite(
            org_id=ctx.org.id,
            email=email,
            role=role,
            token=token,
            invited_by=user.user_id,
        )
        session.add(inv)
        session.flush()
        # Accept URL for product UI (email delivery is ops/manual for now)
        return {
            "id": str(inv.id),
            "email": inv.email,
            "role": inv.role,
            "token": inv.token,
            "accept_path": f"/app/team?accept={inv.token}",
            "note": "Share the accept link with the invitee after they create a TRA account with this email.",
        }


class AcceptBody(BaseModel):
    token: str


@router.post("/invites/accept")
def accept_invite(body: AcceptBody, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    token = (body.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    with get_session() as session:
        inv = session.scalar(select(Invite).where(Invite.token == token, Invite.accepted_at.is_(None)))
        if not inv:
            raise HTTPException(status_code=404, detail="Invite not found or already used")
        if user.email and inv.email.lower() != user.email.lower():
            raise HTTPException(
                status_code=403,
                detail=f"Invite is for {inv.email}. Sign in with that email.",
            )
        existing = session.scalar(
            select(Membership).where(
                Membership.org_id == inv.org_id, Membership.user_id == user.user_id
            )
        )
        if existing:
            existing.role = inv.role
        else:
            session.add(
                Membership(org_id=inv.org_id, user_id=user.user_id, role=inv.role)
            )
        from datetime import datetime, timezone

        inv.accepted_at = datetime.now(timezone.utc)
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
