"""Backwards test: does the pay file support a stated compensation philosophy?"""

from __future__ import annotations

import csv
import math
from datetime import date, datetime
from pathlib import Path
from statistics import median
from typing import Any, Dict, List, Optional

import numpy as np

SAMPLE_CSV = Path(__file__).resolve().parents[1] / "data" / "sample_hris.csv"
AS_OF = date(2026, 10, 9)
MARKET_LOW = 0.97
MARKET_HIGH = 1.03
BAND_LOW = 0.90
BAND_HIGH = 1.10
DEPT_LOG_CAP = 0.08

CAVEAT = (
    "A thin file can illustrate a claim. It cannot prove a company is running the philosophy."
)


def _num(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if math.isnan(float(value)):
            return None
        return float(value)
    text = str(value).strip().replace("$", "").replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _first(raw: Dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in raw and raw[key] not in (None, ""):
            return raw[key]
    lowered = {str(k).strip().lower(): v for k, v in raw.items()}
    for key in keys:
        hit = lowered.get(key.lower())
        if hit not in (None, ""):
            return hit
    return None


def _hire(value: Any) -> Optional[date]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def load_sample_records() -> List[Dict[str, Any]]:
    with SAMPLE_CSV.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _prepare(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    people: List[Dict[str, Any]] = []
    for index, raw in enumerate(records, start=1):
        base = _num(_first(raw, "base", "base_salary", "annual_salary", "Annual Salary", "salary"))
        mid = _num(_first(raw, "range_mid", "midpoint", "Midpoint", "market_mid"))
        rating = _num(_first(raw, "perf_rating", "Perf Rating", "rating", "performance"))
        if not base or not mid or base <= 0 or mid <= 0:
            continue
        hired = _hire(_first(raw, "hire_date", "Hire Date"))
        tenure = None
        if hired is not None:
            tenure = max(0.0, (AS_OF - hired).days / 365.25)
        department = str(_first(raw, "department", "Department") or "Unassigned").strip() or "Unassigned"
        name = str(_first(raw, "name", "Employee Name") or f"Employee {index}")
        title = str(_first(raw, "title", "job_title", "Job Title") or "")
        person_id = str(_first(raw, "id", "employee_id", "EE#") or index)
        ratio = base / mid
        people.append(
            {
                "id": person_id,
                "name": name,
                "title": title,
                "department": department,
                "base": round(base, 2),
                "mid": round(mid, 2),
                "ratio": ratio,
                "rating": rating,
                "tenure_years": None if tenure is None else round(tenure, 2),
                "outside": ratio < BAND_LOW or ratio > BAND_HIGH,
            }
        )
    return people


def _vary(values: List[Optional[float]]) -> bool:
    present = [v for v in values if v is not None]
    if len(present) < 2:
        return False
    return max(present) - min(present) > 1e-9


def _fit(people: List[Dict[str, Any]]) -> Dict[str, Any]:
    """OLS of ln(pay) on ln(midpoint), rating, tenure, and department."""
    usable = [p for p in people if p["rating"] is not None]
    note = None
    if len(usable) < 8:
        return {
            "fit": False,
            "note": "Fewer than 8 people have pay, a midpoint, and a rating, so the regression is not fit.",
            "drivers": [],
            "reference_department": None,
            "r_squared": None,
            "residual_variance": None,
            "rating_coef": None,
            "rating_se": None,
            "department_max_abs": None,
        }

    counts: Dict[str, int] = {}
    for person in usable:
        counts[person["department"]] = counts.get(person["department"], 0) + 1
    reference = sorted(counts, key=lambda name: (-counts[name], name))[0]
    departments = sorted(name for name in counts if name != reference)

    names = ["Log midpoint"]
    columns: List[List[float]] = []
    log_mid = [math.log(p["mid"]) for p in usable]
    columns.append(log_mid)

    rating_values = [p["rating"] for p in usable]
    rating_index = None
    if _vary(rating_values):
        rating_index = len(names)
        names.append("Performance rating")
        columns.append([float(v) for v in rating_values])

    tenure_values = [p["tenure_years"] for p in usable]
    if _vary(tenure_values) and all(v is not None for v in tenure_values):
        names.append("Tenure (years)")
        columns.append([float(v) for v in tenure_values])

    dept_index: Dict[str, int] = {}
    for department in departments:
        if counts[department] < 1:
            continue
        dept_index[department] = len(names)
        names.append(f"{department} vs {reference}")
        columns.append([1.0 if p["department"] == department else 0.0 for p in usable])

    y = np.array([math.log(p["base"]) for p in usable], dtype=float)
    intercept = np.ones(len(usable))
    if columns:
        x_body = np.column_stack(columns)
        design = np.column_stack([intercept, x_body])
    else:
        design = intercept.reshape(-1, 1)
    driver_names = ["Intercept", *names]

    beta, _, _, _ = np.linalg.lstsq(design, y, rcond=None)
    fitted = design @ beta
    resid = y - fitted
    sst = float(((y - y.mean()) ** 2).sum())
    sse = float(resid @ resid)
    n, k = design.shape
    dof = n - k
    r2 = None if sst <= 0 else 1.0 - sse / sst
    sigma2 = None if dof <= 0 else sse / dof
    se = [None] * k
    if sigma2 is not None and sigma2 >= 0 and dof > 0:
        cov = sigma2 * np.linalg.pinv(design.T @ design)
        for i in range(k):
            var = float(cov[i, i])
            se[i] = math.sqrt(var) if var > 0 else None

    drivers = []
    for i, name in enumerate(driver_names):
        coef = float(beta[i])
        drivers.append(
            {
                "name": name,
                "coef": round(coef, 4),
                "se": None if se[i] is None else round(float(se[i]), 4),
                "kind": "department" if " vs " in name else "core",
            }
        )

    rating_coef = None
    if rating_index is not None:
        rating_coef = float(beta[rating_index + 1])

    dept_abs = [
        abs(float(beta[dept_index[name] + 1]))
        for name in dept_index
    ]
    return {
        "fit": True,
        "note": note,
        "drivers": drivers,
        "reference_department": reference,
        "r_squared": None if r2 is None else round(r2, 4),
        "residual_variance": None if sigma2 is None else round(sigma2, 6),
        "rating_coef": None if rating_coef is None else round(rating_coef, 4),
        "rating_se": None
        if rating_index is None or se[rating_index + 1] is None
        else round(float(se[rating_index + 1]), 4),
        "department_max_abs": None if not dept_abs else round(max(dept_abs), 4),
        "n": n,
        "k": k,
    }


def check_philosophy(
    records: Optional[List[Dict[str, Any]]] = None,
    *,
    demo: Optional[bool] = None,
    market_low: float = MARKET_LOW,
    market_high: float = MARKET_HIGH,
    dept_log_cap: float = DEPT_LOG_CAP,
) -> Dict[str, Any]:
    if market_low >= market_high:
        raise ValueError("The midpoint band needs a low end below the high end.")
    if dept_log_cap <= 0:
        raise ValueError("The department cap has to be above zero.")
    if records is None:
        records = load_sample_records()
        demo = True
    if demo is None:
        demo = False
    if not records:
        raise ValueError("No records to test.")

    people = _prepare(records)
    if len(people) < 4:
        raise ValueError("Need at least 4 people with a salary and a midpoint.")

    ratios = [p["ratio"] for p in people]
    med = float(median(ratios))
    outside = sum(1 for p in people if p["outside"])
    fit = _fit(people)

    market_aligned = market_low <= med <= market_high
    claims: List[Dict[str, Any]] = [
        {
            "id": "market",
            "statement": "Target the market midpoint.",
            "test": f"Median of actual base / midpoint is between {market_low:.2f} and {market_high:.2f}.",
            "status": "aligned" if market_aligned else "not_aligned",
            "detail": f"Median ratio is {med:.3f}.",
        }
    ]

    rating = fit["rating_coef"]
    if not fit["fit"] or rating is None:
        claims.append(
            {
                "id": "performance",
                "statement": "Performance differentiates pay after level and market.",
                "test": "In log pay on log midpoint, rating, tenure, and department, the rating coefficient is positive.",
                "status": "untested",
                "detail": fit["note"] or "Rating does not vary, so the coefficient cannot be read.",
            }
        )
    else:
        pay_pct = (math.exp(rating) - 1.0) * 100.0
        detail = (
            f"A one-point rating difference lines up with about {pay_pct:.1f}% pay "
            f"after midpoint, tenure, and department."
        )
        rating_se = fit.get("rating_se")
        if rating_se is not None and abs(rating) < rating_se:
            detail += " The standard error is wider than the coefficient, so the sign is a thin-file reading."
        claims.append(
            {
                "id": "performance",
                "statement": "Performance differentiates pay after level and market.",
                "test": "In log pay on log midpoint, rating, tenure, and department, the rating coefficient is positive.",
                "status": "aligned" if rating > 0 else "not_aligned",
                "detail": detail,
            }
        )

    dept_max = fit["department_max_abs"]
    reference = fit["reference_department"]
    if not fit["fit"] or dept_max is None or reference is None:
        claims.append(
            {
                "id": "department",
                "statement": "Department is not a large leftover driver.",
                "test": f"The largest department effect versus the reference group is under {dept_log_cap:.2f} log points.",
                "status": "untested",
                "detail": fit["note"] or "One department, so a department effect cannot be read.",
            }
        )
    else:
        approx_pct = (math.exp(dept_max) - 1.0) * 100.0
        claims.append(
            {
                "id": "department",
                "statement": "Department is not a large leftover driver.",
                "test": f"The largest department effect versus {reference} is under {dept_log_cap:.2f} log points.",
                "status": "aligned" if dept_max < dept_log_cap else "not_aligned",
                "detail": (
                    f"Largest gap versus {reference} is {dept_max:.3f} log points, about {approx_pct:.1f}% pay."
                ),
            }
        )

    listed = []
    for person in sorted(people, key=lambda row: row["ratio"]):
        listed.append(
            {
                **person,
                "ratio": round(person["ratio"], 4),
            }
        )

    return {
        "demo": bool(demo),
        "as_of": AS_OF.isoformat(),
        "caveat": CAVEAT,
        "philosophy": {
            "name": "Target midpoint. Pay for performance. Department is not the driver.",
        },
        "headcount": len(records),
        "usable": len(people),
        "claims": claims,
        "scores": {
            "median_ratio": round(med, 4),
            "target_low": market_low,
            "target_high": market_high,
            "rating_coef": rating,
            "rating_pay_pct": None if rating is None else round((math.exp(rating) - 1.0) * 100.0, 2),
            "residual_variance": fit["residual_variance"],
            "r_squared": fit["r_squared"],
            "outside_band": outside,
            "outside_band_pct": round(100.0 * outside / len(people), 1),
            "band_low": BAND_LOW,
            "band_high": BAND_HIGH,
            "department_max_abs": dept_max,
            "department_cap": dept_log_cap,
            "reference_department": reference,
        },
        "drivers": fit["drivers"],
        "people": listed,
    }
