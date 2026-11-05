"""Formula Evaluator — ranked data, logic, and equity flags on uploaded merit/bonus files.

First-pass screening only. Not a legal or compliance determination.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd


@dataclass
class Issue:
    code: str
    severity: str  # Critical | High | Medium
    title: str
    explanation: str
    affected_count: int
    suggested_action: str
    employee_ids: list[str] = field(default_factory=list)


def _safe_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def run_checks(df: pd.DataFrame, mapping: dict[str, str] | None = None) -> dict[str, Any]:
    """Run the locked MVP checks and return a ranked result payload."""
    if mapping:
        rename = {v: k for k, v in mapping.items() if v in df.columns}
        df = df.rename(columns=rename)

    issues: list[Issue] = []

    # Required columns (soft)
    required = ["employee_id", "base_salary", "merit_increase_pct", "performance_rating"]
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        issues.append(
            Issue(
                code="missing_critical_fields",
                severity="Critical",
                title="Missing critical fields",
                explanation=f"Required columns not found or not mapped: {', '.join(missing_cols)}.",
                affected_count=len(df),
                suggested_action="Map or add employee_id, base_salary, merit_increase_pct, and performance_rating.",
            )
        )

    # Duplicate IDs
    if "employee_id" in df.columns:
        dups = df[df["employee_id"].duplicated(keep=False)]
        if len(dups):
            issues.append(
                Issue(
                    code="duplicate_ids",
                    severity="Critical",
                    title="Duplicate employee IDs",
                    explanation=f"{len(dups)} rows share employee IDs.",
                    affected_count=len(dups),
                    suggested_action="Deduplicate before running the cycle.",
                    employee_ids=dups["employee_id"].astype(str).unique().tolist()[:50],
                )
            )

    # Negative or zero base
    if "base_salary" in df.columns:
        base = _safe_numeric(df["base_salary"])
        bad = df[base.isna() | (base <= 0)]
        if len(bad):
            issues.append(
                Issue(
                    code="invalid_base",
                    severity="Critical",
                    title="Negative, zero, or non-numeric base salaries",
                    explanation=f"{len(bad)} rows have invalid base salary.",
                    affected_count=len(bad),
                    suggested_action="Correct base salary values before merit modeling.",
                    employee_ids=bad.get("employee_id", pd.Series()).astype(str).tolist()[:50],
                )
            )

    # Increase % bounds
    if "merit_increase_pct" in df.columns:
        pct = _safe_numeric(df["merit_increase_pct"])
        outliers = df[(pct < -0.10) | (pct > 0.30)]
        if len(outliers):
            issues.append(
                Issue(
                    code="increase_bounds",
                    severity="High",
                    title="Increase % outside realistic bounds",
                    explanation=f"{len(outliers)} rows have increases below –10% or above 30%.",
                    affected_count=len(outliers),
                    suggested_action="Review outliers for data entry or special-case justification.",
                    employee_ids=outliers.get("employee_id", pd.Series()).astype(str).tolist()[:50],
                )
            )

    # Merit by rating inversion (simple)
    if {"merit_increase_pct", "performance_rating"}.issubset(df.columns):
        grp = df.groupby("performance_rating")["merit_increase_pct"].mean()
        # Heuristic: flag if a higher rating has lower average (very rough)
        if len(grp) >= 2:
            sorted_means = grp.sort_index()
            if not sorted_means.is_monotonic_increasing:
                issues.append(
                    Issue(
                        code="merit_rating_inversion",
                        severity="High",
                        title="Merit increase does not rise with rating",
                        explanation="Average increase is not higher for higher performance ratings.",
                        affected_count=len(df),
                        suggested_action="Review the merit matrix or rating distribution.",
                    )
                )

    # Exact increase clusters
    if "merit_increase_pct" in df.columns:
        pct = _safe_numeric(df["merit_increase_pct"]).round(4)
        counts = pct.value_counts()
        big = counts[counts >= max(10, int(0.05 * len(df)))]
        if len(big):
            issues.append(
                Issue(
                    code="exact_increase_clusters",
                    severity="Medium",
                    title="Large clusters of identical increase %",
                    explanation=f"{len(big)} increase percentages appear on 5%+ of the population.",
                    affected_count=int(big.sum()),
                    suggested_action="Check for hard-coded values or incomplete differentiation.",
                )
            )

    # Range penetration outliers (if ranges present)
    if {"base_salary", "range_min", "range_max"}.issubset(df.columns):
        base = _safe_numeric(df["base_salary"])
        rmin = _safe_numeric(df["range_min"])
        rmax = _safe_numeric(df["range_max"])
        pen = (base - rmin) / (rmax - rmin).replace(0, pd.NA)
        extreme = df[(pen > 1.2) | (pen < -0.2)]
        if len(extreme):
            issues.append(
                Issue(
                    code="range_penetration",
                    severity="High",
                    title="Range penetration outliers",
                    explanation=f"{len(extreme)} employees are outside typical range penetration.",
                    affected_count=len(extreme),
                    suggested_action="Review range data or employee placement.",
                    employee_ids=extreme.get("employee_id", pd.Series()).astype(str).tolist()[:50],
                )
            )

    # Simple equity concentration (if gender or similar present — optional)
    # Placeholder for more checks

    severity_order = {"Critical": 0, "High": 1, "Medium": 2}
    issues.sort(key=lambda i: (severity_order.get(i.severity, 9), -i.affected_count))

    # Rough health score
    penalties = {"Critical": 25, "High": 12, "Medium": 5}
    score = 100
    for iss in issues:
        score -= min(penalties.get(iss.severity, 5), 30)
    score = max(0, score)

    return {
        "row_count": len(df),
        "logic_health_score": score,
        "issue_count": len(issues),
        "issues": [
            {
                "code": i.code,
                "severity": i.severity,
                "title": i.title,
                "explanation": i.explanation,
                "affected_count": i.affected_count,
                "suggested_action": i.suggested_action,
                "employee_ids": i.employee_ids,
            }
            for i in issues
        ],
        "disclaimer": "These are flags for review, not legal conclusions.",
    }
