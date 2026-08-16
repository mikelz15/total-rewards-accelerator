"""FastAPI dependencies for SaaS routes."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.supabase_jwt import verify_supabase_token
from app.db.models import Membership, Organization, Workspace
from app.db.session import get_session, saas_enabled


@dataclass
class CurrentUser:
    user_id: uuid.UUID
    email: Optional[str]
    raw: dict


@dataclass
class OrgContext:
    user: CurrentUser
    org: Organization
    membership: Membership
    workspace: Optional[Workspace]


def require_saas() -> None:
    if not saas_enabled():
        from app.db.session import saas_config_status

        cfg = saas_config_status()
        missing = [
            name
            for name, ok in (
                ("DATABASE_URL", cfg["has_database_url"]),
                ("SUPABASE_URL", cfg["has_supabase_url"]),
                ("SUPABASE_ANON_KEY", cfg["has_supabase_anon_key"]),
            )
            if not ok
        ]
        # JWT secret optional when URL+anon present
        hint = (
            f"Missing env: {', '.join(missing)}. "
            if missing
            else "Set SUPABASE_JWT_SECRET or both SUPABASE_URL + SUPABASE_ANON_KEY. "
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "SaaS mode is offline. "
                + hint
                + "Add vars on Render, then Manual Deploy."
            ),
        )


def get_current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    require_saas()
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    payload = verify_supabase_token(token)
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=401, detail="Invalid user id in token") from exc
    email = payload.get("email")
    return CurrentUser(user_id=user_id, email=email, raw=payload)


def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "org"
    return f"{base[:40]}-{uuid.uuid4().hex[:8]}"


def ensure_user_org(session: Session, user: CurrentUser) -> OrgContext:
    """Return primary org for user; bootstrap personal org on first visit."""
    membership = session.scalar(
        select(Membership)
        .where(Membership.user_id == user.user_id)
        .order_by(Membership.created_at.asc())
        .limit(1)
    )
    if membership:
        org = session.get(Organization, membership.org_id)
        if not org:
            raise HTTPException(status_code=500, detail="Membership org missing")
        workspace = session.scalar(
            select(Workspace).where(Workspace.org_id == org.id).order_by(Workspace.created_at.asc()).limit(1)
        )
        return OrgContext(user=user, org=org, membership=membership, workspace=workspace)

    # Bootstrap personal organization (trial = full modules, soft-paywall later via plan)
    label = (user.email or "My workspace").split("@")[0]
    org_name = f"{label}'s workspace"
    org = Organization(
        name=org_name,
        slug=_slugify(label),
        plan="trial",
        max_upload_rows=5000,
        suspended=False,
    )
    session.add(org)
    session.flush()
    membership = Membership(org_id=org.id, user_id=user.user_id, role="owner")
    session.add(membership)
    workspace = Workspace(org_id=org.id, name="Default")
    session.add(workspace)
    session.flush()
    return OrgContext(user=user, org=org, membership=membership, workspace=workspace)


def get_org_context(user: CurrentUser = Depends(get_current_user)) -> OrgContext:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        # Detach-safe copies of ids/attrs we need after session closes
        session.expunge_all()
        # Re-attach by refreshing identity — simpler: return within open session pattern
        # Callers that need more DB work should open their own session.
        return ctx
