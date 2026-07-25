"""Pay Equity Auditor — mid-compa + experience/education placement lens."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from app.services.placement import enrich_records, placement_summary


def audit_equity(
    records: List[Dict[str, Any]],
    *,
    underpaid_threshold: float = 0.90,
    overpaid_threshold: float = 1.10,
    top_n: int = 5,
    lens: str = "both",
) -> Dict[str, Any]:
    """
    Analyze cleaned compensation records.

    lens:
      - market: classic mid-compa only
      - placement: expected placement from YOE + education
      - both: default — surface both views
    """
    if not records:
        return {
            "summary": {
                "total": 0,
                "underpaid": 0,
                "overpaid": 0,
                "at_market": 0,
                "missing_compa": 0,
                "avg_compa_ratio": None,
                "median_compa_ratio": None,
            },
            "placement_summary": placement_summary([]),
            "scatter": [],
            "top_raise_targets": [],
            "top_placement_gaps": [],
            "employees": [],
            "lens": lens,
        }

    # Ensure placement fields exist
    if any(r.get("expected_rate") is None and r.get("years_experience") is not None for r in records) or (
        "expected_rate" not in records[0]
    ):
        records = enrich_records(records)

    df = pd.DataFrame(records)

    if "compa_ratio" not in df.columns and {"base_salary", "range_mid"} <= set(df.columns):
        df["compa_ratio"] = pd.to_numeric(df["base_salary"], errors="coerce") / pd.to_numeric(
            df["range_mid"], errors="coerce"
        )

    df["compa_ratio"] = pd.to_numeric(df.get("compa_ratio"), errors="coerce")
    df["base_salary"] = pd.to_numeric(df.get("base_salary"), errors="coerce")
    df["range_mid"] = pd.to_numeric(df.get("range_mid"), errors="coerce")
    df["performance"] = pd.to_numeric(df.get("performance"), errors="coerce")
    df["years_experience"] = pd.to_numeric(df.get("years_experience"), errors="coerce")
    df["expected_rate"] = pd.to_numeric(df.get("expected_rate"), errors="coerce")
    df["expected_compa"] = pd.to_numeric(df.get("expected_compa"), errors="coerce")
    df["placement_gap"] = pd.to_numeric(df.get("placement_gap"), errors="coerce")

    def classify(cr: Optional[float]) -> str:
        if cr is None or pd.isna(cr):
            return "missing"
        if cr < underpaid_threshold:
            return "underpaid"
        if cr > overpaid_threshold:
            return "overpaid"
        return "at_market"

    df["equity_flag"] = df["compa_ratio"].apply(classify)

    # Gap to midpoint (positive = dollars below mid)
    df["gap_to_mid"] = df["range_mid"] - df["base_salary"]
    df["gap_to_mid"] = df["gap_to_mid"].where(df["gap_to_mid"].notna(), 0)

    # Gap to expected placement (positive = below expected)
    if "placement_gap" not in df.columns or df["placement_gap"].isna().all():
        df["placement_gap"] = df["expected_rate"] - df["base_salary"]

    if df["performance"].isna().all():
        df["performance_plot"] = 3.0
    else:
        df["performance_plot"] = df["performance"].fillna(df["performance"].median())

    valid = df[df["compa_ratio"].notna()]
    summary = {
        "total": int(len(df)),
        "underpaid": int((df["equity_flag"] == "underpaid").sum()),
        "overpaid": int((df["equity_flag"] == "overpaid").sum()),
        "at_market": int((df["equity_flag"] == "at_market").sum()),
        "missing_compa": int((df["equity_flag"] == "missing").sum()),
        "avg_compa_ratio": round(float(valid["compa_ratio"].mean()), 3) if len(valid) else None,
        "median_compa_ratio": round(float(valid["compa_ratio"].median()), 3) if len(valid) else None,
        "underpaid_threshold": underpaid_threshold,
        "overpaid_threshold": overpaid_threshold,
        "total_gap_to_parity": round(float(df.loc[df["gap_to_mid"] > 0, "gap_to_mid"].sum()), 2),
        "total_gap_to_expected": round(
            float(df.loc[df["placement_gap"] > 0, "placement_gap"].sum(skipna=True)), 2
        ),
    }

    scatter = []
    for _, row in df.iterrows():
        scatter.append(
            {
                "employee_id": row.get("employee_id"),
                "name": row.get("name"),
                "job_title": row.get("job_title"),
                "performance": None if pd.isna(row.get("performance_plot")) else float(row["performance_plot"]),
                "compa_ratio": None if pd.isna(row.get("compa_ratio")) else float(row["compa_ratio"]),
                "expected_compa": None if pd.isna(row.get("expected_compa")) else float(row["expected_compa"]),
                "base_salary": None if pd.isna(row.get("base_salary")) else float(row["base_salary"]),
                "years_experience": None
                if pd.isna(row.get("years_experience"))
                else float(row["years_experience"]),
                "education_label": row.get("education_label") or row.get("education"),
                "equity_flag": row.get("equity_flag"),
                "placement_flag": row.get("placement_flag"),
                "placement_gap": None
                if pd.isna(row.get("placement_gap"))
                else float(row["placement_gap"]),
            }
        )

    # Top raise targets by market mid
    targets = df[df["equity_flag"] == "underpaid"].copy()
    if len(targets):
        targets = targets.sort_values(
            by=["gap_to_mid", "performance_plot"],
            ascending=[False, False],
        ).head(top_n)

    top_raise_targets = []
    for _, row in targets.iterrows():
        top_raise_targets.append(_person_payload(row, gap_key="gap_to_mid"))

    # Top placement gaps (YOE + edu expected)
    place_targets = df[df["placement_gap"] > 0].copy()
    if len(place_targets):
        place_targets = place_targets.sort_values(
            by=["placement_gap", "performance_plot"],
            ascending=[False, False],
        ).head(top_n)

    top_placement_gaps = []
    for _, row in place_targets.iterrows():
        top_placement_gaps.append(_person_payload(row, gap_key="placement_gap"))

    employees = []
    for _, row in df.iterrows():
        employees.append(_person_payload(row, gap_key="gap_to_mid", full=True))

    return {
        "summary": summary,
        "placement_summary": placement_summary(records),
        "scatter": scatter,
        "top_raise_targets": top_raise_targets,
        "top_placement_gaps": top_placement_gaps,
        "employees": employees,
        "lens": lens,
    }


def _person_payload(row: pd.Series, *, gap_key: str, full: bool = False) -> Dict[str, Any]:
    def num(key: str) -> Optional[float]:
        v = pd.to_numeric(row.get(key), errors="coerce")
        return None if pd.isna(v) else float(v)

    tenure = row.get("tenure_years")
    try:
        tenure_val = float(tenure) if tenure is not None and not pd.isna(tenure) else None
    except (TypeError, ValueError):
        tenure_val = None

    base = {
        "employee_id": row.get("employee_id"),
        "name": row.get("name"),
        "job_title": row.get("job_title"),
        "department": row.get("department"),
        "base_salary": num("base_salary"),
        "range_mid": num("range_mid"),
        "compa_ratio": num("compa_ratio"),
        "expected_rate": num("expected_rate"),
        "expected_compa": num("expected_compa"),
        "placement_gap": num("placement_gap"),
        "placement_flag": row.get("placement_flag"),
        "years_experience": num("years_experience"),
        "education_label": row.get("education_label") or row.get("education"),
        "total_credit_years": num("total_credit_years"),
        "performance": num("performance"),
        "equity_flag": row.get("equity_flag"),
        "gap_to_mid": round(num("gap_to_mid") or 0, 2),
        "recommended_increase": round(max(num(gap_key) or 0, 0), 2),
    }
    if full:
        base["tenure_years"] = tenure_val
    return base
