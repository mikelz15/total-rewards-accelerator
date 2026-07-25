"""Remediation sandbox + merit pool allocator (mid or expected-placement targets)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from app.services.flight_risk import score_employee
from app.services.placement import enrich_records


def _priority_score(row: pd.Series) -> float:
    gap = float(row.get("need") or row.get("gap_to_target") or 0)
    gap = max(gap, 0)
    perf = pd.to_numeric(row.get("performance"), errors="coerce")
    perf = float(perf) if pd.notna(perf) else 3.0
    risk = float(row.get("flight_risk") or 0)
    return gap * (0.55 + 0.1 * (perf / 5.0)) + risk * 40


def remediate(
    records: List[Dict[str, Any]],
    *,
    merit_pool: float,
    target_compa: float = 1.0,
    underpaid_only: bool = True,
    max_increase_pct: Optional[float] = None,
    target_mode: str = "mid",
) -> Dict[str, Any]:
    """
    target_mode:
      - mid: fund toward target_compa * range_mid (classic)
      - expected_placement: fund toward wage-calc expected_rate (YOE + education)
      - max_of_both: fund toward the higher of mid-target and expected_rate
    """
    if not records:
        return {
            "summary": {
                "merit_pool": merit_pool,
                "allocated": 0,
                "remaining": merit_pool,
                "employees_funded": 0,
                "employees_eligible": 0,
                "avg_increase_pct": None,
                "target_compa": target_compa,
                "target_mode": target_mode,
            },
            "allocations": [],
            "unfunded": [],
        }

    if "expected_rate" not in records[0]:
        records = enrich_records(records)

    df = pd.DataFrame(records)
    df["base_salary"] = pd.to_numeric(df.get("base_salary"), errors="coerce")
    df["range_mid"] = pd.to_numeric(df.get("range_mid"), errors="coerce")
    df["compa_ratio"] = pd.to_numeric(df.get("compa_ratio"), errors="coerce")
    df["performance"] = pd.to_numeric(df.get("performance"), errors="coerce")
    df["expected_rate"] = pd.to_numeric(df.get("expected_rate"), errors="coerce")
    df["placement_gap"] = pd.to_numeric(df.get("placement_gap"), errors="coerce")

    if "compa_ratio" not in df.columns or df["compa_ratio"].isna().all():
        df["compa_ratio"] = df["base_salary"] / df["range_mid"]

    mid_target = df["range_mid"] * target_compa
    expected = df["expected_rate"]

    if target_mode == "expected_placement":
        df["target_salary"] = expected
    elif target_mode == "max_of_both":
        df["target_salary"] = pd.concat([mid_target, expected], axis=1).max(axis=1)
    else:
        df["target_salary"] = mid_target
        target_mode = "mid"

    df["gap_to_target"] = (df["target_salary"] - df["base_salary"]).clip(lower=0)
    df["gap_to_mid"] = (df["range_mid"] - df["base_salary"]).clip(lower=0)

    risks = df.apply(score_employee, axis=1, result_type="expand")
    df = pd.concat([df, risks], axis=1)

    eligible = df[df["gap_to_target"] > 0].copy()
    if underpaid_only and target_mode == "mid":
        eligible = eligible[eligible["compa_ratio"].isna() | (eligible["compa_ratio"] < target_compa)]
    elif underpaid_only and target_mode == "expected_placement":
        eligible = eligible[eligible["placement_gap"].isna() | (eligible["placement_gap"] > 0)]

    if max_increase_pct is not None and max_increase_pct > 0:
        eligible["cap"] = eligible["base_salary"] * (max_increase_pct / 100.0)
        eligible["need"] = eligible[["gap_to_target", "cap"]].min(axis=1)
    else:
        eligible["need"] = eligible["gap_to_target"]

    eligible["priority"] = eligible.apply(_priority_score, axis=1)
    eligible = eligible.sort_values(["priority", "need"], ascending=[False, False])

    remaining = float(merit_pool)
    allocations: List[Dict[str, Any]] = []
    unfunded: List[Dict[str, Any]] = []

    for _, row in eligible.iterrows():
        need = float(row["need"])
        if need <= 0 or pd.isna(need):
            continue
        if remaining <= 0:
            unfunded.append(_row_payload(row, allocated=0, reason="pool_exhausted"))
            continue

        grant = min(need, remaining)
        remaining -= grant
        new_salary = float(row["base_salary"]) + grant
        mid = float(row["range_mid"]) if pd.notna(row["range_mid"]) else None
        new_cr = round(new_salary / mid, 3) if mid else None
        exp_rate = float(row["expected_rate"]) if pd.notna(row.get("expected_rate")) else None
        allocations.append(
            {
                **_row_payload(row, allocated=round(grant, 2), reason="funded"),
                "new_base_salary": round(new_salary, 2),
                "new_compa_ratio": new_cr,
                "target_salary": round(float(row["target_salary"]), 2)
                if pd.notna(row.get("target_salary"))
                else None,
                "expected_rate": exp_rate,
                "increase_pct": round(100.0 * grant / float(row["base_salary"]), 2)
                if row["base_salary"]
                else None,
                "fully_funded": grant >= need - 0.01,
            }
        )

    allocated_total = round(float(merit_pool) - remaining, 2)
    avg_inc = None
    if allocations:
        pcts = [a["increase_pct"] for a in allocations if a.get("increase_pct") is not None]
        avg_inc = round(sum(pcts) / len(pcts), 2) if pcts else None

    return {
        "summary": {
            "merit_pool": merit_pool,
            "allocated": allocated_total,
            "remaining": round(remaining, 2),
            "employees_funded": len(allocations),
            "employees_eligible": int(len(eligible)),
            "employees_unfunded": len(unfunded),
            "avg_increase_pct": avg_inc,
            "target_compa": target_compa,
            "target_mode": target_mode,
            "underpaid_only": underpaid_only,
            "max_increase_pct": max_increase_pct,
            "pool_utilization": round(100.0 * allocated_total / merit_pool, 1) if merit_pool else 0,
        },
        "allocations": allocations,
        "unfunded": unfunded[:50],
    }


def _row_payload(row: pd.Series, *, allocated: float, reason: str) -> Dict[str, Any]:
    def num(key: str) -> Optional[float]:
        v = pd.to_numeric(row.get(key), errors="coerce")
        return None if pd.isna(v) else float(v)

    return {
        "employee_id": row.get("employee_id"),
        "name": row.get("name"),
        "job_title": row.get("job_title"),
        "department": row.get("department"),
        "base_salary": num("base_salary"),
        "range_mid": num("range_mid"),
        "compa_ratio": num("compa_ratio"),
        "expected_rate": num("expected_rate"),
        "years_experience": num("years_experience"),
        "education_label": row.get("education_label") or row.get("education"),
        "performance": num("performance"),
        "flight_risk": int(row.get("flight_risk") or 0),
        "flight_risk_band": row.get("flight_risk_band"),
        "gap_to_target": round(float(row.get("gap_to_target") or 0), 2),
        "need": round(float(row.get("need") or row.get("gap_to_target") or 0), 2),
        "allocated": allocated,
        "reason": reason,
        "priority": round(float(row.get("priority") or 0), 2),
    }
