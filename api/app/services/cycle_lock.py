"""Range-first cycle lock: merit pool by penetration, scarce exceptions by confirm-chip."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


DEMO_TEAM: List[Dict[str, Any]] = [
    {"id": "e01", "name": "Amina Cole", "title": "Manufacturing Supervisor", "base": 78500, "range_min": 72000, "range_mid": 90000, "range_max": 108000, "last_increase": "2024-07-01", "lti": 4000, "exception_seed": False},
    {"id": "e02", "name": "Diego Ruiz", "title": "Controls Engineer", "base": 98000, "range_min": 110000, "range_mid": 132000, "range_max": 158000, "last_increase": "2025-04-01", "lti": 18000, "exception_seed": False},
    {"id": "e03", "name": "Priya Shah", "title": "Staff Software Engineer", "base": 168000, "range_min": 145000, "range_mid": 175000, "range_max": 210000, "last_increase": "2025-07-15", "lti": 42000, "exception_seed": False},
    {"id": "e04", "name": "Jonah Hale", "title": "Production Planner", "base": 64000, "range_min": 62000, "range_mid": 76000, "range_max": 90000, "last_increase": "2023-11-01", "lti": 2000, "exception_seed": False},
    {"id": "e05", "name": "Maya Ortiz", "title": "Senior Recruiter", "base": 112000, "range_min": 88000, "range_mid": 105000, "range_max": 126000, "last_increase": "2025-08-01", "lti": 8000, "exception_seed": False},
    {"id": "e06", "name": "Chris Lang", "title": "Quality Engineer", "base": 91000, "range_min": 86000, "range_mid": 102000, "range_max": 122000, "last_increase": "2024-10-01", "lti": 6000, "exception_seed": False},
    {"id": "e07", "name": "Elena Voss", "title": "Finance Partner", "base": 128000, "range_min": 115000, "range_mid": 138000, "range_max": 165000, "last_increase": "2025-03-01", "lti": 12000, "exception_seed": False},
    {"id": "e08", "name": "Marcus Bell", "title": "Cell Lead", "base": 72500, "range_min": 78000, "range_mid": 94000, "range_max": 112000, "last_increase": "2024-06-01", "lti": 2500, "exception_seed": True, "exception_reason": "Retention — competing offer, critical cell coverage", "exception_amount": 4000},
    {"id": "e09", "name": "Sofia Park", "title": "Data Analyst", "base": 82000, "range_min": 78000, "range_mid": 95000, "range_max": 114000, "last_increase": "2025-01-15", "lti": 5000, "exception_seed": False},
    {"id": "e10", "name": "Owen Drake", "title": "Facilities Supervisor", "base": 69000, "range_min": 64000, "range_mid": 78000, "range_max": 92000, "last_increase": "2024-09-01", "lti": 1500, "exception_seed": False},
    {"id": "e11", "name": "Hannah Cho", "title": "Program Manager", "base": 142000, "range_min": 120000, "range_mid": 148000, "range_max": 178000, "last_increase": "2025-06-01", "lti": 16000, "exception_seed": False},
    {"id": "e12", "name": "Nate Brooks", "title": "Technician III", "base": 58500, "range_min": 52000, "range_mid": 64000, "range_max": 76000, "last_increase": "2024-02-01", "lti": 1000, "exception_seed": False},
]


def _num(v: Any) -> Optional[float]:
    try:
        if v is None or v == "":
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def _penetration(base: float, mid: float) -> Optional[float]:
    if not mid:
        return None
    return base / mid


def _band(pen: Optional[float]) -> str:
    if pen is None:
        return "unknown"
    if pen < 0.80:
        return "under_range"
    if pen < 1.00:
        return "to_mid"
    return "above_mid"


def _wealth(base: float, lti: float, growth: float = 0.03) -> Dict[str, Any]:
    years = []
    cum = 0.0
    b = base
    vest = lti / 4.0 if lti else 0.0
    for y in range(1, 5):
        bonus = b * 0.08
        total = b + bonus + vest
        cum += total
        years.append(
            {
                "year": y,
                "base": round(b, 0),
                "bonus": round(bonus, 0),
                "vesting": round(vest, 0),
                "year_total": round(total, 0),
                "cumulative": round(cum, 0),
            }
        )
        b *= 1 + growth
    return {"years": years, "four_year_total": round(cum, 0), "year_1_cash": years[0]["base"] + years[0]["bonus"]}


def lock_cycle(
    records: Optional[List[Dict[str, Any]]] = None,
    *,
    envelope_pct: float = 0.032,
    floor_pen: float = 0.80,
    mid_pen: float = 1.00,
    pool_split: Optional[Dict[str, float]] = None,
    confirm_exceptions: Optional[Dict[str, bool]] = None,
) -> Dict[str, Any]:
    """
    Allocate a merit envelope by range physics.

    Order:
      1. Under-range repair (toward floor_pen * mid) — first claim
      2. To-midpoint movement, decelerating as pen approaches 1.0
      3. Above-midpoint cash merit = 0
      4. Scarce exceptions only if confirm-chip is on
    """
    split = pool_split or {"under_range": 0.50, "to_mid": 0.35, "exceptions": 0.15}
    confirm = confirm_exceptions or {}
    src = records if records else DEMO_TEAM

    people: List[Dict[str, Any]] = []
    salary_base = 0.0
    for raw in src:
        base = _num(raw.get("base") or raw.get("base_salary")) or 0.0
        mid = _num(raw.get("range_mid")) or 0.0
        rmin = _num(raw.get("range_min")) or 0.0
        rmax = _num(raw.get("range_max")) or 0.0
        pen = _penetration(base, mid)
        salary_base += base
        people.append(
            {
                "id": str(raw.get("id") or raw.get("employee_id") or raw.get("name")),
                "name": raw.get("name") or "Employee",
                "title": raw.get("title") or raw.get("job_title") or "",
                "base": base,
                "range_min": rmin,
                "range_mid": mid,
                "range_max": rmax,
                "penetration": round(pen, 4) if pen is not None else None,
                "band": _band(pen),
                "last_increase": raw.get("last_increase") or "",
                "lti": _num(raw.get("lti") or raw.get("lti_target_value")) or 0.0,
                "exception_seed": bool(raw.get("exception_seed")),
                "exception_reason": raw.get("exception_reason") or "",
                "exception_amount": _num(raw.get("exception_amount")) or 0.0,
            }
        )

    envelope = round(salary_base * envelope_pct, 2)
    under_budget = envelope * split["under_range"]
    mid_budget = envelope * split["to_mid"]
    exc_budget = envelope * split["exceptions"]

    under = [p for p in people if p["band"] == "under_range"]
    toward = [p for p in people if p["band"] == "to_mid"]
    above = [p for p in people if p["band"] == "above_mid"]

    # Need to floor
    under_need = []
    for p in under:
        floor = (p["range_mid"] or 0) * floor_pen
        need = max(floor - p["base"], 0)
        under_need.append((p, need))
    total_under_need = sum(n for _, n in under_need) or 1.0

    allocations: Dict[str, float] = {p["id"]: 0.0 for p in people}
    under_spent = 0.0
    for p, need in under_need:
        share = min(need, under_budget * (need / total_under_need))
        allocations[p["id"]] += share
        under_spent += share

    leftover_under = max(under_budget - under_spent, 0)
    mid_budget += leftover_under

    mid_need = []
    for p in toward:
        target = (p["range_mid"] or 0) * mid_pen
        raw_need = max(target - p["base"], 0)
        # decelerate as they approach mid
        pen = p["penetration"] or 0.9
        weight = max(1.0 - (pen - floor_pen) / max(mid_pen - floor_pen, 0.01), 0.15)
        mid_need.append((p, raw_need * weight, raw_need))
    total_mid_w = sum(w for _, w, _ in mid_need) or 1.0
    mid_spent = 0.0
    for p, w, raw_need in mid_need:
        share = min(raw_need, mid_budget * (w / total_mid_w))
        allocations[p["id"]] += share
        mid_spent += share

    leftover_mid = max(mid_budget - mid_spent, 0)
    exc_budget += leftover_mid

    pending = []
    exception_spent = 0.0
    above_merit = 0.0
    for p in people:
        if p["band"] == "above_mid":
            above_merit += 0.0
        seeded = p["exception_seed"] and p["exception_amount"] > 0
        confirmed = confirm.get(p["id"], False)
        if seeded:
            chip = {
                "id": p["id"],
                "name": p["name"],
                "amount": p["exception_amount"],
                "reason": p["exception_reason"],
                "confirmed": confirmed,
                "material": True,
            }
            if confirmed and exception_spent + p["exception_amount"] <= exc_budget + 0.01:
                allocations[p["id"]] += p["exception_amount"]
                exception_spent += p["exception_amount"]
                chip["applied"] = True
            else:
                chip["applied"] = False
            pending.append(chip)

    remaining = round(envelope - sum(allocations.values()), 2)
    rows = []
    under_dollars = 0.0
    for p in people:
        cash = round(allocations[p["id"]], 2)
        new_base = p["base"] + cash
        new_pen = _penetration(new_base, p["range_mid"] or 0)
        if p["band"] == "under_range":
            under_dollars += cash
        wealth = _wealth(new_base, p["lti"])
        rows.append(
            {
                **p,
                "proposed_cash": cash,
                "proposed_pct": round(cash / p["base"] * 100, 2) if p["base"] else 0,
                "new_base": round(new_base, 2),
                "new_penetration": round(new_pen, 4) if new_pen is not None else None,
                "wealth": wealth,
            }
        )

    rows.sort(key=lambda r: (r["penetration"] is None, r["penetration"] or 99))

    paycheck_gap = round((salary_base / max(len(people), 1)) * 0.005 / 26, 2)

    return {
        "philosophy": {
            "name": "comfort / range-first",
            "rule": "Range penetration spends the pool. Ratings do not. Exceptions require a confirm-chip.",
            "split": split,
            "envelope_pct": envelope_pct,
        },
        "team": {
            "name": "Monday 8:00 cycle lock — Plant + Eng sample",
            "headcount": len(people),
            "salary_base": round(salary_base, 2),
        },
        "envelope": envelope,
        "summary": {
            "envelope": envelope,
            "allocated": round(sum(allocations.values()), 2),
            "remaining": remaining,
            "under_range_repaired": round(under_dollars, 2),
            "above_midpoint_merit": round(above_merit, 2),
            "exceptions_pending": sum(1 for c in pending if not c["applied"]),
            "exceptions_applied": sum(1 for c in pending if c["applied"]),
            "exception_dollars": round(exception_spent, 2),
            "paycheck_half_point": paycheck_gap,
        },
        "people": rows,
        "chips": pending,
        "demo": True,
    }
