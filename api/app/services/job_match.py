"""Job matching: one internal job to three external matches.

Basis is the description, the duties, the family, and the level. Title is
not the match. Credit distance reuses the survey-match rules from
resume_credit: same family and level is full, same family and a different
level is half, a different family is none. TRA-owned sample catalog only.
No survey book and no market rate.

This module sits on the Rewards home. It is not a recruiter door.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from app.services.resume_credit import (
    CREDIT_FRACTION,
    credit_from_benchmark,
    infer_family,
    infer_level,
)

MAX_MATCHES = 3
MAX_CATALOG = 12
KEPT = {"full", "half"}


def _tokenize(text: str) -> set:
    return {t for t in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(t) > 2}


def duty_overlap(a: str, b: str) -> float:
    ta, tb = _tokenize(a), _tokenize(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def prepare_job(job: Dict[str, Any]) -> Dict[str, Any]:
    title = str(job.get("title") or "").strip()
    family = job.get("family") or infer_family(title)
    level = job.get("level")
    if level is None:
        level = infer_level(title)
    duties = [str(d).strip() for d in (job.get("duties") or []) if str(d).strip()]
    return {
        "title": title,
        "code": job.get("code"),
        "family": family,
        "function": job.get("function"),
        "focus": job.get("focus"),
        "level": level,
        "description": str(job.get("description") or ""),
        "duties": duties[:20],
    }


def score_external(internal: Dict[str, Any], external: Dict[str, Any]) -> Dict[str, Any]:
    fam = credit_from_benchmark(
        internal.get("family"),
        internal.get("level"),
        external.get("family"),
        external.get("level"),
    )
    overlap = duty_overlap(
        (internal.get("description") or "") + " " + " ".join(internal.get("duties") or []),
        (external.get("description") or "") + " " + " ".join(external.get("duties") or []),
    )
    rank = {"full": 3, "half": 2}
    return {
        "credit": fam,
        "overlap": round(overlap, 3),
        "blended": round(rank.get(fam, 0) + overlap, 3),
    }


def _reason(credit: str, family: Optional[str], level: Optional[int], overlap: float) -> str:
    label = (family or "unknown").replace("_", " ")
    if credit == "full":
        return (
            f"Same {label} benchmark"
            + (f", level {level}." if level else ".")
            + f" Duty overlap {overlap:.0%}."
        )
    return f"Same {label} family, different level. Duty overlap {overlap:.0%}."


def slim_match(match: Dict[str, Any]) -> Dict[str, Any]:
    """Ledger row. Description and duties stay off the stored match."""
    return {
        "title": match.get("title"),
        "code": match.get("code"),
        "family": match.get("family"),
        "level": match.get("level"),
        "credit": match.get("credit"),
        "overlap": match.get("overlap"),
        "blended": match.get("blended"),
        "reason": match.get("reason"),
    }


def match_to_external(
    internal: Dict[str, Any],
    catalog: List[Dict[str, Any]],
    *,
    max_matches: int = MAX_MATCHES,
) -> Dict[str, Any]:
    """Return the top external matches for one internal job."""
    internal_job = prepare_job(internal)
    scored = []
    for raw in catalog[:MAX_CATALOG]:
        ext = prepare_job(raw)
        scored_row = score_external(internal_job, ext)
        if scored_row["credit"] not in KEPT:
            continue
        row = {**ext, **scored_row}
        row["reason"] = _reason(
            scored_row["credit"],
            ext.get("family"),
            ext.get("level"),
            scored_row["overlap"],
        )
        scored.append(row)
    scored.sort(key=lambda r: (-r["blended"], r.get("code") or "", r.get("title") or ""))
    top = scored[:max_matches]
    while len(top) < max_matches:
        top.append(
            {
                "title": None,
                "code": None,
                "credit": "unset",
                "reason": "No additional match found.",
                "overlap": 0.0,
                "blended": 0.0,
            }
        )
    titled = [m for m in top if m.get("title")]
    overall = round(
        sum(CREDIT_FRACTION.get(m.get("credit"), 0) for m in top) / max_matches, 2
    )
    return {
        "internal": internal_job,
        "matches": top,
        "overall_match": overall,
        "can_confirm": bool(titled) and all(m.get("credit") in KEPT for m in titled),
    }


def sample_internal() -> Dict[str, Any]:
    return {
        "title": "Compensation Partner",
        "family": "compensation",
        "level": 4,
        "description": "Own salary structures and place offers against the compensation benchmark.",
        "duties": [
            "Own salary structures and pay ranges",
            "Place offers against market benchmark",
            "Match jobs to survey roles",
            "Support annual cycle",
        ],
    }


def sample_catalog() -> List[Dict[str, Any]]:
    return [
        {
            "title": "Compensation Partner – Corporate",
            "code": "TRA-Comp-Partner",
            "family": "compensation",
            "level": 4,
            "description": "Owns structures, places offers, matches jobs to the survey.",
            "duties": ["Own structures", "Place offers", "Match jobs"],
        },
        {
            "title": "Senior Compensation Analyst",
            "code": "TRA-Comp-SrAnalyst",
            "family": "compensation",
            "level": 3,
            "description": "Supports matching and offer worksheets.",
            "duties": ["Support matching", "Offer worksheets"],
        },
        {
            "title": "Total Rewards Manager",
            "code": "TRA-TR-Manager",
            "family": "compensation",
            "level": 5,
            "description": "Broader total rewards including benefits.",
            "duties": ["Compensation", "Benefits", "Equity"],
        },
        {
            "title": "Nurse Manager",
            "code": "TRA-Nurse-Mgr",
            "family": "nursing",
            "level": 4,
            "description": "Runs a nursing unit.",
            "duties": ["Staff the unit", "Patient care"],
        },
    ]
