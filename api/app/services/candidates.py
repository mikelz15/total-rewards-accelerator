"""Candidate Tracker — recruiting pipeline (in-memory MVP)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Simple process-local store (resets on API restart — fine for MVP demo)
_CANDIDATES: Dict[str, Dict[str, Any]] = {}


STAGES = [
    "sourced",
    "screen",
    "interview",
    "offer",
    "accepted",
    "declined",
    "withdrawn",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def seed_if_empty() -> None:
    if _CANDIDATES:
        return
    samples = [
        {
            "name": "Jordan Blake",
            "role": "Compensation Analyst",
            "stage": "offer",
            "base_salary": 92000,
            "target_bonus_pct": 8,
            "lti_target_value": 0,
            "source": "LinkedIn",
            "owner": "TA Partner",
            "notes": "Strong Excel + Workday; offer pending equity review",
        },
        {
            "name": "Samira Noor",
            "role": "Senior Software Engineer",
            "stage": "interview",
            "base_salary": 165000,
            "target_bonus_pct": 15,
            "lti_target_value": 250000,
            "source": "Referral",
            "owner": "Eng Recruiter",
            "notes": "Competing offer next week",
        },
        {
            "name": "Chris Alvarez",
            "role": "Nurse Manager",
            "stage": "screen",
            "base_salary": 125000,
            "target_bonus_pct": 5,
            "lti_target_value": 0,
            "source": "Indeed",
            "owner": "Nursing TA",
            "notes": "Needs night differential modeled",
        },
    ]
    for s in samples:
        create_candidate(s)


def list_candidates() -> List[Dict[str, Any]]:
    seed_if_empty()
    return sorted(_CANDIDATES.values(), key=lambda c: c.get("updated_at") or "", reverse=True)


def get_candidate(candidate_id: str) -> Optional[Dict[str, Any]]:
    seed_if_empty()
    return _CANDIDATES.get(candidate_id)


def create_candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    cid = str(uuid.uuid4())[:8]
    stage = payload.get("stage") or "sourced"
    if stage not in STAGES:
        stage = "sourced"
    now = _now()
    row = {
        "id": cid,
        "name": payload.get("name") or "Unnamed candidate",
        "role": payload.get("role") or "Role TBD",
        "stage": stage,
        "base_salary": float(payload.get("base_salary") or 0),
        "target_bonus_pct": float(payload.get("target_bonus_pct") or 0),
        "lti_target_value": float(payload.get("lti_target_value") or 0),
        "source": payload.get("source") or "",
        "owner": payload.get("owner") or "",
        "notes": payload.get("notes") or "",
        "company_name": payload.get("company_name") or "Company",
        "created_at": now,
        "updated_at": now,
    }
    _CANDIDATES[cid] = row
    return row


def update_candidate(candidate_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    seed_if_empty()
    row = _CANDIDATES.get(candidate_id)
    if not row:
        return None
    for key in (
        "name",
        "role",
        "stage",
        "base_salary",
        "target_bonus_pct",
        "lti_target_value",
        "source",
        "owner",
        "notes",
        "company_name",
    ):
        if key in payload and payload[key] is not None:
            if key in ("base_salary", "target_bonus_pct", "lti_target_value"):
                row[key] = float(payload[key])
            else:
                row[key] = payload[key]
    if row.get("stage") not in STAGES:
        row["stage"] = "sourced"
    row["updated_at"] = _now()
    return row


def delete_candidate(candidate_id: str) -> bool:
    seed_if_empty()
    return _CANDIDATES.pop(candidate_id, None) is not None


def pipeline_summary() -> Dict[str, Any]:
    rows = list_candidates()
    by_stage: Dict[str, int] = {s: 0 for s in STAGES}
    for r in rows:
        by_stage[r.get("stage", "sourced")] = by_stage.get(r.get("stage", "sourced"), 0) + 1
    offer_value = sum(
        float(r.get("base_salary") or 0)
        for r in rows
        if r.get("stage") in {"offer", "accepted"}
    )
    return {
        "total": len(rows),
        "by_stage": by_stage,
        "open_pipeline": sum(by_stage[s] for s in ("sourced", "screen", "interview", "offer")),
        "offer_base_total": offer_value,
    }
