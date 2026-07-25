"""Market Data Cleaner — harden messy real-world HRIS / survey exports."""

from __future__ import annotations

import csv
import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

# Canonical fields + aliases seen across Workday, Lawson/Infor, Oracle, ADP, SuccessFactors, Excel dumps
COLUMN_ALIASES: Dict[str, List[str]] = {
    "employee_id": [
        "employee_id",
        "ee#",
        "ee_id",
        "eeid",
        "empid",
        "emp_id",
        "employee id",
        "employee_number",
        "employee number",
        "emp_number",
        "person_id",
        "personid",
        "worker_id",
        "worker id",
        "associate_id",
        "associate id",
        "badge",
        "badge_id",
        "file_number",
        "file number",
        "emplid",
        "employee_code",
        "id",
    ],
    "name": [
        "name",
        "employee_name",
        "employee name",
        "full_name",
        "full name",
        "ee_name",
        "worker",
        "worker_name",
        "legal_name",
        "preferred_name",
        "display_name",
    ],
    "first_name": ["first_name", "firstname", "first", "given_name", "legal_first_name"],
    "last_name": ["last_name", "lastname", "last", "surname", "family_name", "legal_last_name"],
    "job_title": [
        "job_title",
        "title",
        "job title",
        "position",
        "position_title",
        "position title",
        "job",
        "business_title",
        "business title",
        "job_name",
        "working_title",
        "role",
        "job_profile",
        "job profile",
    ],
    "job_code": [
        "job_code",
        "jobcode",
        "job code",
        "jc",
        "position_code",
        "job_profile_id",
        "classification",
        "class_code",
    ],
    "department": [
        "department",
        "dept",
        "dept_name",
        "department_name",
        "org_unit",
        "organizational_unit",
        "business_unit",
        "business unit",
        "cost_center",
        "cost center",
        "cost_center_name",
        "division",
        "supervisory_org",
        "supervisory organization",
        "org",
        "unit",
        "clinic",
        "nursing_unit",
    ],
    "location": [
        "location",
        "work_location",
        "work location",
        "site",
        "facility",
        "campus",
        "work_site",
        "office",
        "city",
        "region",
        "state",
    ],
    "manager": [
        "manager",
        "manager_name",
        "manager name",
        "supervisor",
        "supervisor_name",
        "reports_to",
        "reports to",
        "line_manager",
    ],
    "base_salary": [
        "base_salary",
        "salary",
        "annual_salary",
        "annual salary",
        "base pay",
        "base_pay",
        "basepay",
        "annual pay",
        "annual_pay",
        "current_salary",
        "current salary",
        "current_base",
        "annual_base",
        "annualized_salary",
        "annualized base",
        "comp_rate_annual",
        "total_base_pay_annualized",
        "total base pay annualized",
        "pay_amount_annual",
        "yearly_salary",
    ],
    "hourly_rate": [
        "hourly_rate",
        "hourly",
        "rate",
        "hrly_rate",
        "pay_rate",
        "pay rate",
        "hourly_pay",
        "hourly pay",
        "base_hourly",
        "comp_rate",
        "compensation_rate",
        "reg_rate",
        "regular_rate",
    ],
    "pay_frequency": [
        "pay_frequency",
        "pay frequency",
        "frequency",
        "pay_cycle",
        "payroll_frequency",
        "comp_frequency",
        "salary_frequency",
    ],
    "range_min": [
        "range_min",
        "min",
        "salary_min",
        "grade_min",
        "pay_min",
        "range minimum",
        "minimum",
        "min_rate",
        "pay_range_min",
        "salary_range_min",
        "grade_minimum",
        "band_min",
    ],
    "range_mid": [
        "range_mid",
        "mid",
        "midpoint",
        "mid_point",
        "salary_mid",
        "grade_mid",
        "pay_mid",
        "range midpoint",
        "market_mid",
        "market midpoint",
        "pay_range_mid",
        "salary_range_mid",
        "target_pay",
        "control_point",
    ],
    "range_max": [
        "range_max",
        "max",
        "salary_max",
        "grade_max",
        "pay_max",
        "range maximum",
        "maximum",
        "max_rate",
        "pay_range_max",
        "salary_range_max",
        "grade_maximum",
        "band_max",
    ],
    "performance": [
        "performance",
        "perf",
        "rating",
        "perf_rating",
        "performance_rating",
        "performance rating",
        "overall_rating",
        "overall rating",
        "appraisal_rating",
        "pa_rating",
        "review_rating",
        "performance_score",
        "last_rating",
    ],
    "hire_date": [
        "hire_date",
        "hire date",
        "start_date",
        "start date",
        "dh_hire_date",
        "date_hired",
        "date hired",
        "original_hire_date",
        "original hire date",
        "continuous_service_date",
        "seniority_date",
        "company_service_date",
        "rehire_date",
        "worker_start_date",
        "employment_start_date",
    ],
    "fte": [
        "fte",
        "f.t.e.",
        "full_time_equivalent",
        "full time equivalent",
        "fte_percent",
        "fte %",
        "scheduled_fte",
        "position_fte",
    ],
    "grade": [
        "grade",
        "pay_grade",
        "salary_grade",
        "band",
        "pay_band",
        "salary_band",
        "comp_grade",
        "compensation_grade",
        "grade_profile",
        "level",
        "job_level",
        "career_level",
    ],
    "flsa": [
        "flsa",
        "flsa_status",
        "flsa status",
        "exempt_status",
        "exempt",
        "overtime_status",
        "ot_status",
    ],
    "employment_status": [
        "employment_status",
        "employee_status",
        "status",
        "worker_status",
        "active_status",
        "hr_status",
    ],
    "employee_type": [
        "employee_type",
        "worker_type",
        "emp_type",
        "full_part",
        "full_part_time",
        "time_type",
        "regular_temporary",
    ],
    "gender": ["gender", "sex", "gender_identity"],
    "ethnicity": ["ethnicity", "race", "race_ethnicity", "eeo_ethnicity"],
    "years_experience": [
        "years_experience",
        "yoe",
        "years_of_experience",
        "years of experience",
        "relevant_experience",
        "relevant experience",
        "exp_years",
        "experience_years",
        "total_experience",
        "related_experience",
        "yrs_exp",
        "years_exp",
    ],
    "education": [
        "education",
        "highest_education",
        "highest education",
        "degree",
        "highest_degree",
        "highest degree",
        "edu_level",
        "education_level",
        "education level",
        "degree_level",
        "academic_level",
    ],
    "required_education": [
        "required_education",
        "required education",
        "min_education",
        "minimum_education",
        "minimum education",
        "education_required",
        "req_education",
        "required_degree",
        "min_degree",
    ],
}


def _normalize_header(value: str) -> str:
    s = str(value).replace("\ufeff", "").strip().lower()
    s = s.replace("%", " percent ")
    s = re.sub(r"[^\w]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def detect_delimiter(sample: str) -> str:
    try:
        dialect = csv.Sniffer().sniff(sample[:8192], delimiters=",\t|;")
        return dialect.delimiter
    except csv.Error:
        if sample.count("\t") > sample.count(","):
            return "\t"
        if sample.count(";") > sample.count(","):
            return ";"
        if sample.count("|") > sample.count(","):
            return "|"
        return ","


def _looks_like_header(row: List[str]) -> bool:
    joined = " ".join(str(c).lower() for c in row)
    tokens = [
        "employee",
        "salary",
        "job",
        "title",
        "grade",
        "dept",
        "department",
        "hire",
        "rate",
        "name",
        "fte",
        "midpoint",
        "worker",
        "comp",
        "pay",
    ]
    hits = sum(1 for t in tokens if t in joined)
    non_empty = sum(1 for c in row if str(c).strip())
    return hits >= 2 and non_empty >= 3


def parse_tabular_text(text: str) -> pd.DataFrame:
    """Parse CSV/TSV/pipe text with delimiter sniffing and metadata-row skip."""
    text = text.replace("\ufeff", "")
    if not text.strip():
        raise ValueError("Empty file")

    delimiter = detect_delimiter(text)
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    rows = [r for r in reader if any(str(c).strip() for c in r)]
    if not rows:
        raise ValueError("No data rows found")

    header_idx = 0
    for i, row in enumerate(rows[:25]):
        if _looks_like_header(row):
            header_idx = i
            break

    header = [str(h).strip() or f"col_{i}" for i, h in enumerate(rows[header_idx])]
    # De-dupe headers
    seen: Dict[str, int] = {}
    clean_header: List[str] = []
    for h in header:
        key = h
        if key in seen:
            seen[key] += 1
            key = f"{h}_{seen[h]}"
        else:
            seen[key] = 0
        clean_header.append(key)

    data_rows = rows[header_idx + 1 :]
    width = len(clean_header)
    normalized = []
    for r in data_rows:
        if len(r) < width:
            r = r + [""] * (width - len(r))
        elif len(r) > width:
            r = r[:width]
        # skip total/footer-ish rows
        first = str(r[0]).strip().lower()
        if first in {"total", "totals", "grand total", "sum", "count"}:
            continue
        normalized.append(r)

    df = pd.DataFrame(normalized, columns=clean_header)
    # Drop completely empty columns
    df = df.dropna(axis=1, how="all")
    return df


def map_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str], List[str]]:
    """Map raw headers to canonical names. Returns renamed df, mapping, unmapped headers."""
    raw_headers = {col: _normalize_header(col) for col in df.columns}
    mapping: Dict[str, str] = {}
    used_canonical: set = set()

    # Exact alias match first
    for original, normalized in raw_headers.items():
        for canonical, aliases in COLUMN_ALIASES.items():
            if canonical in used_canonical:
                continue
            alias_set = {_normalize_header(a) for a in aliases}
            if normalized in alias_set:
                mapping[original] = canonical
                used_canonical.add(canonical)
                break

    # Fuzzy contains match for leftovers (careful with short tokens)
    for original, normalized in raw_headers.items():
        if original in mapping:
            continue
        for canonical, aliases in COLUMN_ALIASES.items():
            if canonical in used_canonical:
                continue
            for alias in aliases:
                an = _normalize_header(alias)
                if len(an) < 4:
                    continue
                if an in normalized or normalized in an:
                    # avoid mapping generic "id" twice etc.
                    if canonical == "employee_id" and "job" in normalized:
                        continue
                    if canonical == "name" and any(
                        x in normalized for x in ("manager", "department", "job", "file")
                    ):
                        continue
                    mapping[original] = canonical
                    used_canonical.add(canonical)
                    break
            if original in mapping:
                break

    renamed = df.rename(columns=mapping)
    unmapped = [c for c in df.columns if c not in mapping]
    return renamed, mapping, unmapped


def _parse_money(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype(str)
        .str.replace("\u00a0", "", regex=False)
        .str.replace(r"[\$,]", "", regex=True)
        .str.replace(r"\((.*)\)", r"-\1", regex=True)
        .str.replace(r"[^0-9.\-]", "", regex=True)
        .str.strip()
    )
    cleaned = cleaned.replace({"": None, "nan": None, "none": None, "-": None})
    return pd.to_numeric(cleaned, errors="coerce")


def _parse_date(series: pd.Series) -> pd.Series:
    # Try common HRIS formats explicitly then fallback
    s = series.astype(str).str.strip()
    parsed = pd.to_datetime(s, errors="coerce", format="%m/%d/%Y")
    still = parsed.isna()
    if still.any():
        parsed2 = pd.to_datetime(s[still], errors="coerce", format="%Y-%m-%d")
        parsed = parsed.fillna(parsed2)
    still = parsed.isna()
    if still.any():
        parsed3 = pd.to_datetime(s[still], errors="coerce", format="%m-%d-%Y")
        parsed = parsed.fillna(parsed3)
    still = parsed.isna()
    if still.any():
        parsed4 = pd.to_datetime(s[still], errors="coerce")
        parsed = parsed.fillna(parsed4)
    return parsed


_PERF_MAP = {
    "outstanding": 5.0,
    "exceeds": 4.5,
    "exceeds expectations": 4.5,
    "above": 4.0,
    "above expectations": 4.0,
    "successful": 3.0,
    "meets": 3.0,
    "meets expectations": 3.0,
    "fully meets": 3.0,
    "satisfactory": 3.0,
    "developing": 2.0,
    "needs improvement": 2.0,
    "below": 1.5,
    "below standards": 1.5,
    "unsatisfactory": 1.0,
    "does not meet": 1.0,
}


def _parse_performance(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.notna().sum() >= max(1, int(0.5 * len(series))):
        return numeric

    def map_one(v: Any) -> Optional[float]:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return None
        s = str(v).strip().lower()
        if not s or s in {"nan", "none", "n/a", "na"}:
            return None
        if s in _PERF_MAP:
            return _PERF_MAP[s]
        for key, score in _PERF_MAP.items():
            if key in s:
                return score
        try:
            return float(s)
        except ValueError:
            return None

    return series.apply(map_one)


def _annualize_pay(amount: float, frequency: Optional[str], fte: float) -> float:
    if amount is None or pd.isna(amount):
        return float("nan")
    freq = (frequency or "annual").strip().lower()
    fte = fte if fte and not pd.isna(fte) else 1.0
    if freq in {"h", "hr", "hour", "hourly"}:
        return amount * 2080 * fte
    if freq in {"d", "day", "daily"}:
        return amount * 260 * fte
    if freq in {"w", "week", "weekly"}:
        return amount * 52 * fte
    if freq in {"b", "biweekly", "bi-weekly", "bi weekly"}:
        return amount * 26 * fte
    if freq in {"s", "semi", "semimonthly", "semi-monthly", "semi monthly"}:
        return amount * 24 * fte
    if freq in {"m", "month", "monthly"}:
        return amount * 12 * fte
    # annual / yearly / default
    return amount


def clean_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Clean and standardize an HRIS-like dataframe for Auditor / Flight Risk / Remediation.
    """
    original_rows = len(df)
    original_cols = list(df.columns.astype(str))

    # Strip cell whitespace
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip().replace({"": None, "nan": None, "None": None})

    work, column_mapping, unmapped = map_columns(df)

    # Combine first/last into name
    if "name" not in work.columns and {"first_name", "last_name"} <= set(work.columns):
        work["name"] = (
            work["first_name"].fillna("").astype(str).str.strip()
            + " "
            + work["last_name"].fillna("").astype(str).str.strip()
        ).str.strip()
        work.loc[work["name"] == "", "name"] = None

    money_cols = ["base_salary", "hourly_rate", "range_min", "range_mid", "range_max"]
    for col in money_cols:
        if col in work.columns:
            work[col] = _parse_money(work[col])

    if "hire_date" in work.columns:
        work["hire_date"] = _parse_date(work["hire_date"])

    if "performance" in work.columns:
        work["performance"] = _parse_performance(work["performance"])

    if "years_experience" in work.columns:
        work["years_experience"] = pd.to_numeric(work["years_experience"], errors="coerce")

    # Normalize education labels later via placement; keep cleaned strings
    for edu_col in ("education", "required_education"):
        if edu_col in work.columns:
            work[edu_col] = work[edu_col].astype(str).str.strip().replace(
                {"nan": None, "None": None, "": None}
            )

    if "fte" in work.columns:
        fte = pd.to_numeric(work["fte"], errors="coerce")
        # Handle 90 / 100 style percents
        fte = fte.apply(lambda x: x / 100.0 if pd.notna(x) and x > 1.5 else x)
        work["fte"] = fte.fillna(1.0).clip(0.05, 1.5)
    else:
        work["fte"] = 1.0

    # Annualize base from frequency or hourly
    if "base_salary" in work.columns:
        if "pay_frequency" in work.columns:
            work["base_salary"] = [
                _annualize_pay(amt, freq, fte)
                for amt, freq, fte in zip(work["base_salary"], work["pay_frequency"], work["fte"])
            ]
            work["base_salary"] = pd.to_numeric(work["base_salary"], errors="coerce")
        else:
            # Heuristic: values under 500 likely hourly mislabeled as salary
            suspicious = work["base_salary"].notna() & (work["base_salary"] < 500)
            if suspicious.any() and "hourly_rate" not in work.columns:
                work.loc[suspicious, "hourly_rate"] = work.loc[suspicious, "base_salary"]
                work.loc[suspicious, "base_salary"] = pd.NA

    if "base_salary" not in work.columns and "hourly_rate" in work.columns:
        work["base_salary"] = work["hourly_rate"] * 2080 * work["fte"]
    elif "base_salary" in work.columns and "hourly_rate" in work.columns:
        missing_salary = work["base_salary"].isna() & work["hourly_rate"].notna()
        work.loc[missing_salary, "base_salary"] = (
            work.loc[missing_salary, "hourly_rate"] * 2080 * work.loc[missing_salary, "fte"]
        )

    if "range_mid" not in work.columns and {"range_min", "range_max"} <= set(work.columns):
        work["range_mid"] = (work["range_min"] + work["range_max"]) / 2

    # If ranges look hourly (all < 500) but salary annual, annualize ranges
    if "range_mid" in work.columns and "base_salary" in work.columns:
        mid_med = work["range_mid"].median(skipna=True)
        sal_med = work["base_salary"].median(skipna=True)
        if pd.notna(mid_med) and pd.notna(sal_med) and mid_med < 500 and sal_med > 10000:
            for col in ("range_min", "range_mid", "range_max"):
                if col in work.columns:
                    work[col] = work[col] * 2080

    if "base_salary" in work.columns and "range_mid" in work.columns:
        work["compa_ratio"] = (work["base_salary"] / work["range_mid"]).round(3)
    else:
        work["compa_ratio"] = pd.NA

    # Tenure years from hire date
    if "hire_date" in work.columns:
        today = pd.Timestamp(datetime.utcnow().date())
        work["tenure_years"] = work["hire_date"].apply(
            lambda d: round((today - d).days / 365.25, 2) if pd.notna(d) else None
        )
    else:
        work["tenure_years"] = None

    # Active filter heuristic
    dropped_inactive = 0
    if "employment_status" in work.columns:
        status = work["employment_status"].astype(str).str.lower()
        inactive_mask = status.str.contains(
            r"terminat|inactive|separated|retired|deceased|leave.*unpaid",
            regex=True,
            na=False,
        )
        # keep unknown; drop clear inactive
        dropped_inactive = int(inactive_mask.sum())
        if dropped_inactive and dropped_inactive < len(work):
            work = work.loc[~inactive_mask].copy()

    issues: List[Dict[str, Any]] = []
    if "employee_id" not in work.columns:
        issues.append(
            {"level": "warning", "message": "No employee_id column found — row index used as ID."}
        )
        work["employee_id"] = [f"ROW-{i+1}" for i in range(len(work))]
    else:
        work["employee_id"] = work["employee_id"].astype(str)

    if "base_salary" not in work.columns:
        issues.append({"level": "error", "message": "No base_salary or hourly_rate column found."})

    if "range_mid" not in work.columns:
        issues.append(
            {
                "level": "warning",
                "message": "No salary range midpoint found — compa-ratio cannot be calculated until ranges are provided.",
            }
        )

    if unmapped:
        issues.append(
            {
                "level": "info",
                "message": f"{len(unmapped)} columns left unmapped (preserved in output): "
                + ", ".join(str(u) for u in unmapped[:12])
                + ("…" if len(unmapped) > 12 else ""),
            }
        )

    if dropped_inactive:
        issues.append(
            {
                "level": "info",
                "message": f"Excluded {dropped_inactive} inactive/terminated rows based on employment_status.",
            }
        )

    work = work.dropna(how="all")

    # Duplicate employee IDs
    if "employee_id" in work.columns:
        dupes = work["employee_id"].duplicated(keep=False)
        n_dupes = int(dupes.sum())
        if n_dupes:
            issues.append(
                {
                    "level": "warning",
                    "message": f"{n_dupes} rows share duplicate employee_id values — review before merit processing.",
                }
            )

    if "base_salary" in work.columns:
        missing_pay = work["base_salary"].isna()
        n_missing = int(missing_pay.sum())
        if n_missing:
            issues.append(
                {
                    "level": "warning",
                    "message": f"{n_missing} employees missing base salary after cleaning.",
                }
            )
            for idx in list(work.index[missing_pay])[:10]:
                issues.append(
                    {
                        "level": "warning",
                        "message": f"Missing base salary for employee_id={work.at[idx, 'employee_id']}",
                        "row": int(idx) if isinstance(idx, (int, float)) else None,
                    }
                )

    # Quality score 0-100
    required_ok = sum(
        1
        for c in ("employee_id", "base_salary", "range_mid", "job_title")
        if c in work.columns and work[c].notna().any()
    )
    quality = int(round(25 * required_ok))
    if "performance" in work.columns and work["performance"].notna().any():
        quality = min(100, quality + 10)
    if "hire_date" in work.columns and work["hire_date"].notna().any():
        quality = min(100, quality + 10)
    if any(i["level"] == "error" for i in issues):
        quality = min(quality, 40)

    records = work.copy()
    if "hire_date" in records.columns:
        records["hire_date"] = records["hire_date"].apply(
            lambda x: x.strftime("%Y-%m-%d")
            if isinstance(x, (pd.Timestamp, datetime)) and pd.notna(x)
            else None
        )

    records = records.where(pd.notna(records), None)
    data = records.to_dict(orient="records")

    # Placement engine: expected rate from YOE + education (shared across modules)
    from app.services.placement import enrich_records, placement_summary

    data = enrich_records(data)
    place_sum = placement_summary(data)

    # Detect likely source system
    joined_headers = " ".join(original_cols).lower()
    source_guess = "generic"
    if "worker" in joined_headers or "supervisory" in joined_headers:
        source_guess = "workday-like"
    elif "emplid" in joined_headers or "file number" in joined_headers:
        source_guess = "peopleSoft/adp-like"
    elif "jc-lawson" in joined_headers or "lawson" in joined_headers:
        source_guess = "lawson-like"
    elif "infor" in joined_headers:
        source_guess = "infor-like"

    # Quality bump when YOE/education present
    if "years_experience" in work.columns and work["years_experience"].notna().any():
        quality = min(100, quality + 5)
    if "education" in work.columns and work["education"].notna().any():
        quality = min(100, quality + 5)

    return {
        "stats": {
            "rows_in": original_rows,
            "rows_out": len(data),
            "columns_in": original_cols,
            "columns_mapped": column_mapping,
            "columns_unmapped": [str(u) for u in unmapped],
            "canonical_columns": sorted(
                set(list(records.columns.astype(str)) + list(data[0].keys() if data else []))
            ),
            "quality_score": quality,
            "source_system_guess": source_guess,
            "dropped_inactive": dropped_inactive,
            "placement": place_sum,
            "cleaned_at": datetime.utcnow().isoformat() + "Z",
        },
        "issues": issues[:80],
        "records": data,
    }
