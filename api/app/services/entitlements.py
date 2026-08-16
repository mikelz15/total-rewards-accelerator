"""Plan entitlements and role × module matrix."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Set

MODULES = ("cleaner", "equity", "tracker", "closer")

ALL_MODULES: Set[str] = set(MODULES)

# Org commercial access by plan code
PLAN_MODULES: Dict[str, Set[str]] = {
    "trial": set(ALL_MODULES),
    "demo": set(ALL_MODULES),
    "pilot": set(ALL_MODULES),
    "starter": set(ALL_MODULES),
    "suite": set(ALL_MODULES),
    "cleaner": {"cleaner"},
    "equity": {"equity"},
    "tracker": {"tracker"},
    "closer": {"closer"},
    "cleaner_equity": {"cleaner", "equity"},
    "ta_pack": {"tracker", "closer"},
    "none": set(),
    "suspended": set(),
}

# What each seat role may use (intersected with plan entitlements)
ROLE_MODULES: Dict[str, Set[str]] = {
    "owner": set(ALL_MODULES),
    "admin": set(ALL_MODULES),
    "member": set(ALL_MODULES),  # Comp analyst
    "ta": {"tracker", "closer"},
    "viewer": set(ALL_MODULES),  # read paths; write checks use can_write
}

WRITE_ROLES = {"owner", "admin", "member", "ta"}
BILLING_ROLES = {"owner"}
TEAM_ADMIN_ROLES = {"owner", "admin"}


def normalize_plan(plan: Optional[str]) -> str:
    p = (plan or "trial").strip().lower()
    return p if p in PLAN_MODULES else "trial"


def normalize_role(role: Optional[str]) -> str:
    r = (role or "member").strip().lower()
    return r if r in ROLE_MODULES else "member"


def modules_for_plan(plan: Optional[str], override: Optional[Iterable[str]] = None) -> Set[str]:
    if override is not None:
        return {m for m in override if m in ALL_MODULES}
    return set(PLAN_MODULES.get(normalize_plan(plan), set()))


def modules_for_role(role: Optional[str]) -> Set[str]:
    return set(ROLE_MODULES.get(normalize_role(role), set()))


def effective_modules(
    plan: Optional[str],
    role: Optional[str],
    *,
    suspended: bool = False,
    entitlement_override: Optional[Iterable[str]] = None,
) -> Set[str]:
    if suspended:
        return set()
    return modules_for_plan(plan, entitlement_override) & modules_for_role(role)


def can_access_module(
    module: str,
    plan: Optional[str],
    role: Optional[str],
    *,
    suspended: bool = False,
    entitlement_override: Optional[Iterable[str]] = None,
) -> bool:
    return module in effective_modules(
        plan, role, suspended=suspended, entitlement_override=entitlement_override
    )


def can_write(role: Optional[str]) -> bool:
    return normalize_role(role) in WRITE_ROLES


def can_manage_billing(role: Optional[str]) -> bool:
    return normalize_role(role) in BILLING_ROLES


def can_manage_team(role: Optional[str]) -> bool:
    return normalize_role(role) in TEAM_ADMIN_ROLES


def permission_payload(
    plan: Optional[str],
    role: Optional[str],
    *,
    suspended: bool = False,
    entitlement_override: Optional[Iterable[str]] = None,
) -> Dict[str, Any]:
    plan_mods = sorted(modules_for_plan(plan, entitlement_override if not suspended else []))
    role_mods = sorted(modules_for_role(role))
    effective = sorted(
        effective_modules(
            plan, role, suspended=suspended, entitlement_override=entitlement_override
        )
    )
    return {
        "plan": normalize_plan(plan),
        "role": normalize_role(role),
        "suspended": bool(suspended),
        "plan_modules": plan_mods,
        "role_modules": role_mods,
        "modules": effective,
        "can_write": can_write(role) and not suspended,
        "can_manage_billing": can_manage_billing(role) and not suspended,
        "can_manage_team": can_manage_team(role) and not suspended,
        "module_access": {m: m in effective for m in MODULES},
    }


def catalog() -> List[Dict[str, Any]]:
    return [
        {
            "id": "cleaner",
            "name": "Cleaner",
            "price_label": "$99–$149/mo",
            "stripe_price_env": "STRIPE_PRICE_CLEANER",
        },
        {
            "id": "equity",
            "name": "Equity + Merit",
            "price_label": "$199–$299/mo",
            "stripe_price_env": "STRIPE_PRICE_EQUITY",
        },
        {
            "id": "tracker",
            "name": "Candidate Tracker",
            "price_label": "$99–$149/mo",
            "stripe_price_env": "STRIPE_PRICE_TRACKER",
        },
        {
            "id": "closer",
            "name": "Closer",
            "price_label": "$149–$249/mo",
            "stripe_price_env": "STRIPE_PRICE_CLOSER",
        },
        {
            "id": "suite",
            "name": "Full suite",
            "price_label": "$399–$599/mo",
            "stripe_price_env": "STRIPE_PRICE_SUITE",
            "modules": sorted(ALL_MODULES),
        },
    ]
