"""Job matching: one internal job -> three external matches.

Basis is description + functional duties + family/function/focus + level,
not title alone. Credit distance reuses the survey-match rules from
resume_credit: same benchmark code = full, same family or grade-off =
half, different function = none. TRA-owned. No CompAnalyst import.

This module is part of the Compensation / Total Rewards professional
viewpoint (Rewards home), not the recruiter door.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from app.services.resume_credit import (
    CREDIT_FRACTION,
    FAMILIES,
    credit_from_benchmark,
    infer_family,
    infer_level,
)

MAX_MATCHES = 3
MAX_DESCRIPTION_CHARS = 50_000


def _tokenize(text: str) -> set:
    return {t for t in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(t) > 2}


def duty_overlap(a: str, b: str) -> float:
    ta, tb = _tokenize(a), _tokenize(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


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
    rank = {"full": 3, "half": 2, "none": 0, "unset": 1}
    blended = rank.get(fam, 0) + overlap
    return {
        "credit": fam,
        "overlap": round(overlap, 3),
        "blended": round(blended, 3),
    }


def _reason(credit: str, family: Optional[str], level: Optional[int], overlap: float) -> str:
    label = (family or "unknown").replace("_", " ")
    if credit == "full":
        return (
            f"Same {label} benchmark"
            + (f", level {level}." if level else ".")
            + f" Duty overlap {overlap:.0%}."
        )
    if credit == "half":
        return f"Same {label} family, different level. Duty overlap {overlap:.0%}."
    return f"Different function ({label}). No credit."


def match_to_external(
    internal: Dict[str, Any],
    catalog: List[Dict[str, Any]],
    *,
    max_matches: int = MAX_MATCHES,
) -> Dict[str, Any]:
    """Return the top external matches for one internal job."""
    scored = []
    for ext in catalog:
        s = score_external(internal, ext)
        if s["credit"] == "none":
            continue
        scored.append(
            {
                **ext,
                **s,
                "reason": _reason(
                    s["credit"],
                    ext.get("family"),
                    ext.get("level"),
                    s["overlap"],
                ),
            }
        )
    scored.sort(key=lambda r: (-r["blended"], r.get("code") or ""))
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
    overall = round(
        sum(CREDIT_FRACTION.get(m.get("credit"), 0) for m in top) / max_matches, 2
    )
    return {
        "internal": internal,
        "matches": top,
        "overall_match": overall,
        "can_confirm": all(m.get("credit") in CREDIT_FRACTION for m in top if m.get("title")),
    }
