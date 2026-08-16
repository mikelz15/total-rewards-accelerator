"""Access helpers binding org + membership to entitlement checks."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from fastapi import HTTPException

from app.db.models import Organization
from app.services.entitlements import (
    can_access_module,
    can_manage_billing,
    can_manage_team,
    can_write,
    effective_modules,
    permission_payload,
)


def org_override(org: Organization) -> Optional[List[str]]:
    raw = getattr(org, "entitlements_json", None)
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return None


def org_suspended(org: Organization) -> bool:
    return bool(getattr(org, "suspended", False))


def perms_for(org: Organization, role: str) -> Dict[str, Any]:
    return permission_payload(
        org.plan,
        role,
        suspended=org_suspended(org),
        entitlement_override=org_override(org),
    )


def require_module(org: Organization, role: str, module: str) -> None:
    if org_suspended(org):
        raise HTTPException(status_code=403, detail="Organization is suspended. Contact support.")
    if not can_access_module(
        module,
        org.plan,
        role,
        suspended=False,
        entitlement_override=org_override(org),
    ):
        plan_ok = module in effective_modules(
            org.plan, "owner", entitlement_override=org_override(org)
        )
        if not plan_ok:
            raise HTTPException(
                status_code=402,
                detail={
                    "code": "upgrade_required",
                    "module": module,
                    "message": f"Your plan does not include “{module}”. Upgrade in Billing.",
                },
            )
        raise HTTPException(
            status_code=403,
            detail={
                "code": "role_denied",
                "module": module,
                "message": f"Your role cannot access “{module}”. Ask an org admin.",
            },
        )


def require_write(role: str) -> None:
    if not can_write(role):
        raise HTTPException(status_code=403, detail="Viewers cannot modify data.")


def require_team_admin(role: str) -> None:
    if not can_manage_team(role):
        raise HTTPException(status_code=403, detail="Only owners and admins can manage the team.")


def require_billing_admin(role: str) -> None:
    if not can_manage_billing(role):
        raise HTTPException(status_code=403, detail="Only the org owner can manage billing.")
