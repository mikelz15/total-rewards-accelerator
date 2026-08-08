"""Demo-site safety: row caps, PHI header scan, IP upload rate limits."""

from __future__ import annotations

import re
import time
from collections import defaultdict, deque
from typing import Any, Deque, Dict, List, Optional, Tuple

DEMO_MAX_ROWS = 10
UPLOADS_PER_WEEK = 5
RATE_WINDOW_SECONDS = 7 * 24 * 60 * 60

DEMO_DISCLAIMER = (
    "PUBLIC DEMO — Sample or synthetic data only. Do not upload real employee, "
    "candidate, or patient files. Files are processed in memory and not retained "
    "as a production system of record. This environment is not HIPAA-certified."
)

_PHI_HEADER_PATTERNS: List[re.Pattern[str]] = [
    re.compile(p, re.I)
    for p in (
        r"\bssn\b",
        r"social[_\s-]?security",
        r"\bdob\b",
        r"date[_\s-]?of[_\s-]?birth",
        r"birth[_\s-]?date",
        r"\bmrn\b",
        r"medical[_\s-]?record",
        r"patient[_\s-]?(id|name|number)",
        r"\bdiagnosis\b",
        r"\bicd[-_]?10\b",
        r"health[_\s-]?plan",
        r"insurance[_\s-]?(id|member)",
        r"\bnpi\b",
        r"home[_\s-]?address",
        r"street[_\s-]?address",
        r"mailing[_\s-]?address",
        r"\baddress\s*1\b",
        r"\bphone\b",
        r"mobile[_\s-]?phone",
        r"cell[_\s-]?phone",
        r"\bemail\b",
        r"e-?mail",
        r"driver.?s?[_\s-]?licen[sc]e",
        r"\bpassport\b",
        r"national[_\s-]?id",
        r"tax[_\s-]?id",
        r"\btin\b",
        r"\bein\b",
        r"bank[_\s-]?account",
        r"routing[_\s-]?number",
        r"\biban\b",
        r"credit[_\s-]?card",
        r"\bcvv\b",
    )
]

_upload_hits: Dict[str, Deque[float]] = defaultdict(deque)


def client_ip(headers: Dict[str, str], client_host: Optional[str]) -> str:
    for key in ("cf-connecting-ip", "x-real-ip", "x-forwarded-for"):
        raw = headers.get(key) or headers.get(key.title()) or headers.get(key.upper())
        if raw:
            return raw.split(",")[0].strip() or "unknown"
    return (client_host or "unknown").strip() or "unknown"


def check_upload_rate_limit(ip: str) -> Tuple[bool, int, int]:
    now = time.time()
    q = _upload_hits[ip]
    while q and now - q[0] > RATE_WINDOW_SECONDS:
        q.popleft()
    remaining = max(0, UPLOADS_PER_WEEK - len(q))
    if len(q) >= UPLOADS_PER_WEEK:
        return False, 0, UPLOADS_PER_WEEK
    return True, remaining, UPLOADS_PER_WEEK


def record_upload(ip: str) -> int:
    now = time.time()
    q = _upload_hits[ip]
    while q and now - q[0] > RATE_WINDOW_SECONDS:
        q.popleft()
    q.append(now)
    return max(0, UPLOADS_PER_WEEK - len(q))


def scan_headers_for_phi(columns: List[str]) -> List[str]:
    hits: List[str] = []
    for col in columns:
        name = str(col).strip()
        if not name:
            continue
        for pat in _PHI_HEADER_PATTERNS:
            if pat.search(name):
                hits.append(name)
                break
    return hits


def enforce_demo_clean(
    df_columns: List[str],
    row_count: int,
    *,
    count_toward_rate_limit: bool,
    ip: str,
) -> Dict[str, Any]:
    phi_hits = scan_headers_for_phi([str(c) for c in df_columns])
    if phi_hits:
        raise ValueError(
            "Upload blocked: column headers look like protected personal or health data "
            f"({', '.join(phi_hits[:6])}{'…' if len(phi_hits) > 6 else ''}). "
            "Remove SSN, DOB, address, phone, email, MRN, and similar fields. "
            f"{DEMO_DISCLAIMER}"
        )

    allowed, remaining_before, limit = check_upload_rate_limit(ip)
    if count_toward_rate_limit and not allowed:
        raise ValueError(
            f"Demo upload limit reached ({limit} custom uploads per IP per rolling week). "
            "Use the built-in messy HRIS sample, or try again next week. "
            f"{DEMO_DISCLAIMER}"
        )

    truncated = row_count > DEMO_MAX_ROWS
    effective_rows = min(row_count, DEMO_MAX_ROWS)
    remaining_after = remaining_before
    if count_toward_rate_limit:
        remaining_after = record_upload(ip)

    return {
        "demo_mode": True,
        "disclaimer": DEMO_DISCLAIMER,
        "max_rows": DEMO_MAX_ROWS,
        "rows_submitted": row_count,
        "rows_accepted": effective_rows,
        "truncated_to_max_rows": truncated,
        "phi_scan": {
            "method": "header_pattern",
            "status": "pass",
            "flagged_headers": [],
        },
        "rate_limit": {
            "limit_per_week": limit,
            "remaining": remaining_after,
            "counted": count_toward_rate_limit,
        },
    }
