"""
Placement Engine — wage-calc mindset shared across Auditor, Merit, Closer, Flight Risk.

Philosophy (aligned to portfolio Wage Calc / TA Offer Tool):
  - Classic mid-compa stays: pay / range_mid
  - Expected placement uses years of experience + education credits
  - Education credit for completed degrees at/above required (not partial)
  - Related experience can be full or half credit
  - Exp substituting for education is not double-counted into YOE credit

Outputs per person:
  actual_compa, expected_rate, expected_compa, expected_pir (0–1 in range),
  placement_gap ($), placement_flag
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

# Education ladder (ordinal). Higher = more education.
EDU_LEVELS: Dict[str, int] = {
    "none": 0,
    "hs": 1,
    "high school": 1,
    "high school/ged": 1,
    "ged": 1,
    "hs/ged": 1,
    "associates": 2,
    "associate": 2,
    "aa": 2,
    "as": 2,
    "bachelors": 3,
    "bachelor": 3,
    "bachelor's": 3,
    "ba": 3,
    "bs": 3,
    "b.s.": 3,
    "b.a.": 3,
    "masters": 4,
    "master": 4,
    "master's": 4,
    "ma": 4,
    "ms": 4,
    "mba": 4,
    "m.s.": 4,
    "doctorate": 5,
    "doctoral": 5,
    "phd": 5,
    "ph.d.": 5,
    "md": 5,
    "jd": 5,
}

# Years of relevant experience credit typically associated with holding each level
# above "none" — used when converting degree surplus to YOE-equivalent credit.
EDU_YEARS_CREDIT: Dict[int, float] = {
    0: 0.0,
    1: 0.0,  # HS is usually the floor, not extra credit
    2: 1.0,  # Associates ~ +1 yr vs HS floor in many healthcare ladders
    3: 2.0,  # Bachelors ~ +2
    4: 4.0,  # Masters ~ +4
    5: 6.0,  # Doctorate ~ +6
}

# Default assumed required education when job does not specify
DEFAULT_REQUIRED_EDU = "bachelors"

# Experience horizon (years) to go from range min → max under full credit.
# Mirrors "how long to mid / how long to max" thinking in offer tools.
YEARS_TO_MID = 5.0
YEARS_MID_TO_MAX = 10.0  # total YOE-equivalent from min to max = YEARS_TO_MID + this after mid path


def normalize_education(value: Any) -> Tuple[Optional[str], Optional[int]]:
    """Return (canonical_label, ordinal) or (None, None)."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None, None
    s = str(value).strip().lower()
    if not s or s in {"nan", "none", "n/a", "na", "-"}:
        return None, None
    # direct
    if s in EDU_LEVELS:
        level = EDU_LEVELS[s]
        return _label_for_level(level), level
    # contains
    for key, level in sorted(EDU_LEVELS.items(), key=lambda kv: -len(kv[0])):
        if key in s:
            return _label_for_level(level), level
    return None, None


def _label_for_level(level: int) -> str:
    return {
        0: "None",
        1: "High School/GED",
        2: "Associates",
        3: "Bachelors",
        4: "Masters",
        5: "Doctorate",
    }.get(level, "Unknown")


def education_credit_years(
    candidate_edu_level: Optional[int],
    required_edu_level: Optional[int],
) -> float:
    """
    Credit only for completed education at or above required.
    Surplus education above required converts to YOE-equivalent years.
    """
    if candidate_edu_level is None:
        return 0.0
    req = required_edu_level if required_edu_level is not None else EDU_LEVELS.get(DEFAULT_REQUIRED_EDU, 3)
    if candidate_edu_level < req:
        # Below required: no positive credit (could later flag qualification risk)
        return 0.0
    # Credit = difference in ladder years between required and candidate
    cand_yrs = EDU_YEARS_CREDIT.get(candidate_edu_level, 0.0)
    req_yrs = EDU_YEARS_CREDIT.get(req, 0.0)
    return max(0.0, cand_yrs - req_yrs)


def experience_credit_years(
    years_experience: Optional[float],
    *,
    related_fraction: float = 1.0,
) -> float:
    """
    related_fraction: 1.0 = full credit (directly related), 0.5 = half credit.
    """
    if years_experience is None or pd.isna(years_experience):
        return 0.0
    y = max(0.0, float(years_experience))
    frac = min(1.0, max(0.0, float(related_fraction)))
    return y * frac


def combined_credit_years(
    years_experience: Optional[float],
    candidate_edu: Any,
    required_edu: Any = None,
    *,
    related_fraction: float = 1.0,
    exp_substitutes_for_edu: bool = False,
) -> Dict[str, Any]:
    """
    Build total YOE-equivalent credit.

    If exp_substitutes_for_edu is True, experience used to meet the degree
    requirement is not also counted as progression credit (wage-calc rule).
    """
    _, cand_lvl = normalize_education(candidate_edu)
    _, req_lvl = normalize_education(required_edu) if required_edu is not None else (None, None)
    if req_lvl is None:
        req_lvl = EDU_LEVELS.get(DEFAULT_REQUIRED_EDU, 3)

    edu_credit = education_credit_years(cand_lvl, req_lvl)
    exp_credit = experience_credit_years(years_experience, related_fraction=related_fraction)

    # If below required edu and substituting with experience, carve out substitute years
    substitute_years_used = 0.0
    if exp_substitutes_for_edu and cand_lvl is not None and cand_lvl < req_lvl:
        # Rough: each missing ladder step needs ~2 years exp (common JD language)
        steps_short = req_lvl - cand_lvl
        substitute_years_used = min(exp_credit, steps_short * 2.0)
        exp_credit = max(0.0, exp_credit - substitute_years_used)
        edu_credit = 0.0  # did not meet via degree

    total = exp_credit + edu_credit
    return {
        "candidate_education_level": cand_lvl,
        "candidate_education_label": _label_for_level(cand_lvl) if cand_lvl is not None else None,
        "required_education_level": req_lvl,
        "required_education_label": _label_for_level(req_lvl) if req_lvl is not None else None,
        "education_credit_years": round(edu_credit, 2),
        "experience_credit_years": round(exp_credit, 2),
        "substitute_years_used": round(substitute_years_used, 2),
        "total_credit_years": round(total, 2),
    }


def expected_placement_from_credits(
    range_min: float,
    range_mid: float,
    range_max: float,
    total_credit_years: float,
    *,
    years_to_mid: float = YEARS_TO_MID,
    years_mid_to_max: float = YEARS_MID_TO_MAX,
) -> Dict[str, Any]:
    """
    Map credit years into a dollar point in range.

    Path: min → mid over years_to_mid, then mid → max over years_mid_to_max.
    Caps at max. At 0 credit years → min.
    """
    if any(pd.isna(x) for x in (range_min, range_mid, range_max)):
        return {
            "expected_rate": None,
            "expected_compa": None,
            "expected_pir": None,
            "path_segment": "missing_range",
        }

    rmin, rmid, rmax = float(range_min), float(range_mid), float(range_max)
    if rmin <= 0 or rmid <= 0 or rmax <= 0 or rmax < rmin:
        return {
            "expected_rate": None,
            "expected_compa": None,
            "expected_pir": None,
            "path_segment": "invalid_range",
        }

    y = max(0.0, float(total_credit_years or 0.0))
    y_mid = max(0.1, years_to_mid)
    y_max = max(0.1, years_mid_to_max)

    if y <= y_mid:
        # interpolate min → mid
        t = y / y_mid
        rate = rmin + t * (rmid - rmin)
        segment = "min_to_mid"
    else:
        t = min(1.0, (y - y_mid) / y_max)
        rate = rmid + t * (rmax - rmid)
        segment = "mid_to_max"

    rate = min(rmax, max(rmin, rate))
    expected_compa = rate / rmid if rmid else None
    # Position in range 0–1
    span = rmax - rmin
    pir = (rate - rmin) / span if span > 0 else None

    return {
        "expected_rate": round(rate, 2),
        "expected_compa": round(expected_compa, 3) if expected_compa is not None else None,
        "expected_pir": round(pir, 3) if pir is not None else None,
        "path_segment": segment,
    }


def place_person(
    *,
    base_salary: Optional[float] = None,
    range_min: Optional[float] = None,
    range_mid: Optional[float] = None,
    range_max: Optional[float] = None,
    years_experience: Optional[float] = None,
    education: Any = None,
    required_education: Any = None,
    related_fraction: float = 1.0,
    exp_substitutes_for_edu: bool = False,
    years_to_mid: float = YEARS_TO_MID,
    years_mid_to_max: float = YEARS_MID_TO_MAX,
) -> Dict[str, Any]:
    """Full placement for one person or candidate offer."""
    credits = combined_credit_years(
        years_experience,
        education,
        required_education,
        related_fraction=related_fraction,
        exp_substitutes_for_edu=exp_substitutes_for_edu,
    )

    # Infer mid if only min/max
    rmin = pd.to_numeric(range_min, errors="coerce")
    rmid = pd.to_numeric(range_mid, errors="coerce")
    rmax = pd.to_numeric(range_max, errors="coerce")
    if pd.isna(rmid) and not pd.isna(rmin) and not pd.isna(rmax):
        rmid = (float(rmin) + float(rmax)) / 2.0

    placement = expected_placement_from_credits(
        float(rmin) if not pd.isna(rmin) else float("nan"),
        float(rmid) if not pd.isna(rmid) else float("nan"),
        float(rmax) if not pd.isna(rmax) else float("nan"),
        credits["total_credit_years"],
        years_to_mid=years_to_mid,
        years_mid_to_max=years_mid_to_max,
    )

    pay = pd.to_numeric(base_salary, errors="coerce")
    actual_compa = None
    if not pd.isna(pay) and not pd.isna(rmid) and float(rmid) > 0:
        actual_compa = round(float(pay) / float(rmid), 3)

    # Actual position in range
    actual_pir = None
    if not pd.isna(pay) and not pd.isna(rmin) and not pd.isna(rmax) and float(rmax) > float(rmin):
        actual_pir = round((float(pay) - float(rmin)) / (float(rmax) - float(rmin)), 3)

    expected_rate = placement["expected_rate"]
    placement_gap = None
    if expected_rate is not None and not pd.isna(pay):
        placement_gap = round(expected_rate - float(pay), 2)

    # Flags
    if expected_rate is None:
        placement_flag = "missing_inputs"
    elif placement_gap is None:
        placement_flag = "missing_pay"
    elif placement_gap > 500:  # under expected by > $500
        placement_flag = "below_expected"
    elif placement_gap < -500:
        placement_flag = "above_expected"
    else:
        placement_flag = "at_expected"

    return {
        **credits,
        **placement,
        "actual_compa": actual_compa,
        "actual_pir": actual_pir,
        "base_salary": None if pd.isna(pay) else float(pay),
        "range_min": None if pd.isna(rmin) else float(rmin),
        "range_mid": None if pd.isna(rmid) else float(rmid),
        "range_max": None if pd.isna(rmax) else float(rmax),
        "years_experience": None
        if years_experience is None or pd.isna(years_experience)
        else float(years_experience),
        "placement_gap": placement_gap,
        "placement_flag": placement_flag,
    }


def enrich_records(
    records: List[Dict[str, Any]],
    *,
    related_fraction: float = 1.0,
    years_to_mid: float = YEARS_TO_MID,
    years_mid_to_max: float = YEARS_MID_TO_MAX,
) -> List[Dict[str, Any]]:
    """Attach placement fields to each cleaned record (non-destructive copy)."""
    out: List[Dict[str, Any]] = []
    for row in records:
        placed = place_person(
            base_salary=row.get("base_salary"),
            range_min=row.get("range_min"),
            range_mid=row.get("range_mid"),
            range_max=row.get("range_max"),
            years_experience=row.get("years_experience"),
            education=row.get("education"),
            required_education=row.get("required_education"),
            related_fraction=related_fraction,
            years_to_mid=years_to_mid,
            years_mid_to_max=years_mid_to_max,
        )
        merged = dict(row)
        # Prefer placement's actual_compa if row missing
        if merged.get("compa_ratio") is None and placed.get("actual_compa") is not None:
            merged["compa_ratio"] = placed["actual_compa"]
        merged.update(
            {
                "education_label": placed.get("candidate_education_label"),
                "required_education_label": placed.get("required_education_label"),
                "education_credit_years": placed.get("education_credit_years"),
                "experience_credit_years": placed.get("experience_credit_years"),
                "total_credit_years": placed.get("total_credit_years"),
                "expected_rate": placed.get("expected_rate"),
                "expected_compa": placed.get("expected_compa"),
                "expected_pir": placed.get("expected_pir"),
                "actual_pir": placed.get("actual_pir"),
                "placement_gap": placed.get("placement_gap"),
                "placement_flag": placed.get("placement_flag"),
                "placement_path": placed.get("path_segment"),
            }
        )
        out.append(merged)
    return out


def placement_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {
            "with_expected": 0,
            "below_expected": 0,
            "at_expected": 0,
            "above_expected": 0,
            "total_placement_gap": 0,
            "avg_expected_compa": None,
            "avg_actual_compa": None,
        }
    df = pd.DataFrame(records)
    flags = df.get("placement_flag", pd.Series(dtype=str))
    gap = pd.to_numeric(df.get("placement_gap"), errors="coerce")
    exp_c = pd.to_numeric(df.get("expected_compa"), errors="coerce")
    act_c = pd.to_numeric(df.get("compa_ratio"), errors="coerce")
    below = (flags == "below_expected").sum() if len(flags) else 0
    return {
        "with_expected": int(exp_c.notna().sum()),
        "below_expected": int(below),
        "at_expected": int((flags == "at_expected").sum()) if len(flags) else 0,
        "above_expected": int((flags == "above_expected").sum()) if len(flags) else 0,
        "total_placement_gap": round(float(gap.clip(lower=0).sum(skipna=True)), 2),
        "avg_expected_compa": round(float(exp_c.mean()), 3) if exp_c.notna().any() else None,
        "avg_actual_compa": round(float(act_c.mean()), 3) if act_c.notna().any() else None,
    }
