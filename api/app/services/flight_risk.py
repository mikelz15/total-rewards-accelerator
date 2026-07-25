"""Flight risk assessment — rules-based 0–100 score (MVP; ML-ready interface)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd


def _tenure_years(row: pd.Series) -> Optional[float]:
    if pd.notna(row.get("tenure_years")):
        try:
            return float(row["tenure_years"])
        except (TypeError, ValueError):
            pass
    hire = row.get("hire_date")
    if hire is None or (isinstance(hire, float) and pd.isna(hire)):
        return None
    try:
        d = pd.to_datetime(hire, errors="coerce")
        if pd.isna(d):
            return None
        return (pd.Timestamp(datetime.utcnow().date()) - d).days / 365.25
    except Exception:  # noqa: BLE001
        return None


def score_employee(row: pd.Series) -> Dict[str, Any]:
    """
    Score one employee 0–100 (higher = more likely to leave).

    Drivers (transparent, explainable):
      - Low compa-ratio (under-market pay)
      - High performance while underpaid (regrettable attrition risk)
      - Tenure sweet-spot (1–3 years) or very long tenure stagnation signal
      - Missing market alignment / equity flags
    """
    score = 15.0  # baseline
    drivers: List[str] = []

    cr = pd.to_numeric(row.get("compa_ratio"), errors="coerce")
    perf = pd.to_numeric(row.get("performance"), errors="coerce")
    tenure = _tenure_years(row)
    equity = str(row.get("equity_flag") or "").lower()
    placement_gap = pd.to_numeric(row.get("placement_gap"), errors="coerce")
    placement_flag = str(row.get("placement_flag") or "").lower()

    # Compa-ratio pressure
    if pd.notna(cr):
        if cr < 0.80:
            score += 35
            drivers.append(f"Deeply under market (compa {cr:.2f})")
        elif cr < 0.90:
            score += 25
            drivers.append(f"Below market (compa {cr:.2f})")
        elif cr < 0.95:
            score += 12
            drivers.append(f"Slightly below mid (compa {cr:.2f})")
        elif cr > 1.15:
            score -= 8
            drivers.append("Well above mid — retention pay cushion")
    else:
        score += 8
        drivers.append("Missing compa-ratio")

    # Below wage-calc expected placement (YOE + education)
    if pd.notna(placement_gap) and placement_gap > 0:
        if placement_gap >= 15000:
            score += 15
            drivers.append(f"Well below expected placement (gap ${placement_gap:,.0f})")
        elif placement_gap >= 5000:
            score += 10
            drivers.append(f"Below expected placement for exp/edu (gap ${placement_gap:,.0f})")
        elif placement_flag == "below_expected":
            score += 6
            drivers.append("Below expected position-in-range for experience/education")
    elif placement_flag == "above_expected":
        score -= 4
        drivers.append("Paid above experience/education expected placement")

    # High performer underpaid = classic flight risk
    if pd.notna(perf) and pd.notna(cr):
        if perf >= 4.0 and cr < 0.95:
            score += 20
            drivers.append(f"High performer ({perf:.1f}) under-aligned on pay")
        elif perf >= 4.0 and cr < 1.0:
            score += 10
            drivers.append("Strong performer near/below mid")
        elif perf <= 2.0:
            score -= 5
            drivers.append("Lower performance rating reduces external mobility pressure")

    # Tenure curve
    if tenure is not None:
        if 0.5 <= tenure < 1.5:
            score += 10
            drivers.append(f"Early-career window ({tenure:.1f} yrs) — shopping market")
        elif 1.5 <= tenure < 3.5:
            score += 15
            drivers.append(f"Peak mobility tenure ({tenure:.1f} yrs)")
        elif tenure >= 10 and pd.notna(cr) and cr < 0.95:
            score += 8
            drivers.append("Long tenure + below mid — stagnation risk")
        elif tenure < 0.5:
            score -= 5
            drivers.append("New hire — lower immediate flight probability")

    if equity == "underpaid":
        score += 8
        if "underpaid" not in " ".join(drivers).lower():
            drivers.append("Flagged underpaid vs range")

    score = max(0, min(100, round(score)))

    if score >= 75:
        band = "critical"
    elif score >= 55:
        band = "high"
    elif score >= 35:
        band = "moderate"
    else:
        band = "low"

    return {
        "flight_risk": int(score),
        "flight_risk_band": band,
        "flight_risk_drivers": drivers[:5],
    }


def assess_flight_risk(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {
            "summary": {
                "total": 0,
                "critical": 0,
                "high": 0,
                "moderate": 0,
                "low": 0,
                "avg_flight_risk": None,
            },
            "employees": [],
            "top_risks": [],
        }

    # Ensure placement fields when YOE/edu present
    if records and "placement_gap" not in records[0]:
        try:
            from app.services.placement import enrich_records

            records = enrich_records(records)
        except Exception:  # noqa: BLE001
            pass

    df = pd.DataFrame(records)
    # Ensure equity flag if possible
    if "equity_flag" not in df.columns and "compa_ratio" in df.columns:
        cr = pd.to_numeric(df["compa_ratio"], errors="coerce")
        df["equity_flag"] = cr.apply(
            lambda x: "underpaid"
            if pd.notna(x) and x < 0.90
            else ("overpaid" if pd.notna(x) and x > 1.10 else ("at_market" if pd.notna(x) else "missing"))
        )

    enriched = []
    for _, row in df.iterrows():
        scored = score_employee(row)
        enriched.append(
            {
                "employee_id": row.get("employee_id"),
                "name": row.get("name"),
                "job_title": row.get("job_title"),
                "department": row.get("department"),
                "base_salary": None
                if pd.isna(row.get("base_salary"))
                else float(pd.to_numeric(row.get("base_salary"), errors="coerce")),
                "compa_ratio": None
                if pd.isna(row.get("compa_ratio"))
                else float(pd.to_numeric(row.get("compa_ratio"), errors="coerce")),
                "performance": None
                if pd.isna(row.get("performance"))
                else float(pd.to_numeric(row.get("performance"), errors="coerce")),
                "tenure_years": _tenure_years(row),
                "equity_flag": row.get("equity_flag"),
                **scored,
            }
        )

    edf = pd.DataFrame(enriched)
    summary = {
        "total": int(len(edf)),
        "critical": int((edf["flight_risk_band"] == "critical").sum()),
        "high": int((edf["flight_risk_band"] == "high").sum()),
        "moderate": int((edf["flight_risk_band"] == "moderate").sum()),
        "low": int((edf["flight_risk_band"] == "low").sum()),
        "avg_flight_risk": round(float(edf["flight_risk"].mean()), 1) if len(edf) else None,
    }

    top = edf.sort_values("flight_risk", ascending=False).head(10)
    top_risks = top.to_dict(orient="records")
    # Clean NaN
    for r in top_risks:
        for k, v in list(r.items()):
            if v is not None and isinstance(v, float) and pd.isna(v):
                r[k] = None

    employees = []
    for r in enriched:
        clean = {}
        for k, v in r.items():
            if v is not None and isinstance(v, float) and pd.isna(v):
                clean[k] = None
            else:
                clean[k] = v
        employees.append(clean)

    return {"summary": summary, "employees": employees, "top_risks": top_risks}
