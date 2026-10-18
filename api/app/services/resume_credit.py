"""Resume credit ledger.

Turns a resume into credited years for the Placement Engine.

Full, half, and none follow a survey match, the way the 2020 benchmark
workbooks match a job to a CompAnalyst code:

- same benchmark code: full credit
- same family, or a note that the match is a grade off or not confident: half
- a different family: none

Those workbooks also carry market rates and a company job catalog. This
module does not read them. The sample uses a short family list we wrote.
The Years of Experience column on the grade file is how a matched job sits
in range. It is not this tally. The person's years still come from dates.

The fraction is applied here. Callers pass the credited total into
place_person with related_fraction left at 1.0 so the career is not cut twice.

One calendar month counts once, at the highest credit. A tie goes to the
earlier job. Vendor survey books are not loaded.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from app.services.placement import normalize_education

CREDIT_FRACTION = {"full": 1.0, "half": 0.5, "none": 0.0}

MAX_PASTE_CHARS = 20_000
MAX_JOBS = 40

_MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

_MONTH_RE = (
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
)
_SPAN_RE = re.compile(
    rf"(?P<sm>{_MONTH_RE})\.?\s+(?P<sy>(?:19|20)\d{{2}})\s*(?:–|—|-|to)\s*"
    rf"(?:(?P<em>{_MONTH_RE})\.?\s+(?P<ey>(?:19|20)\d{{2}})|(?P<pres>Present|Current))",
    re.I,
)
_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)

# TRA-owned labels for the sample. Not a vendor catalog.
FAMILIES: Dict[str, str] = {
    "compensation": r"compensation|total rewards|\brewards\b",
    "talent": r"recruiter|talent acquisition|\bsourcer\b",
    "nursing": r"\bnurse\b|\brn\b|nursing",
    "finance": r"accountan|finance|controller",
}

_LEVELS: List[Tuple[int, str]] = [
    (5, r"\b(director|vice president|\bvp\b|chief)\b"),
    (4, r"\b(manager|partner|lead|principal)\b"),
    (3, r"\b(senior|sr\.?)\b"),
    (2, r"\b(analyst|specialist|consultant|recruiter|nurse|rn)\b"),
    (1, r"\b(coordinator|assistant|associate)\b"),
]


def parse_month(value: Any, *, as_of: Optional[date] = None) -> Optional[date]:
    """First of the month, or None when the value cannot be read."""
    if value is None:
        return None
    if isinstance(value, date):
        return date(value.year, value.month, 1)
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "n/a", "na", "-"}:
        return None
    if text.lower() in {"present", "current"}:
        if as_of is None:
            return None
        return date(as_of.year, as_of.month, 1)
    iso = re.match(r"^(\d{4})-(\d{1,2})(?:-\d{1,2})?$", text)
    if iso:
        year, month = int(iso.group(1)), int(iso.group(2))
        if 1 <= month <= 12:
            return date(year, month, 1)
        return None
    named = re.match(rf"^({_MONTH_RE})\.?\s+((?:19|20)\d{{2}})$", text, re.I)
    if named:
        month = _MONTHS.get(named.group(1).lower()[:3]) or _MONTHS.get(named.group(1).lower())
        if month is None:
            key = named.group(1).lower().rstrip(".")
            month = _MONTHS.get(key[:3], _MONTHS.get(key))
        if month is None:
            return None
        return date(int(named.group(2)), month, 1)
    return None


def _months_inclusive(start: date, end: date) -> List[Tuple[int, int]]:
    if end < start:
        return []
    out: List[Tuple[int, int]] = []
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        out.append((year, month))
        month += 1
        if month == 13:
            month = 1
            year += 1
    return out


def infer_family(title: str) -> Optional[str]:
    text = title or ""
    for family, pattern in FAMILIES.items():
        if re.search(pattern, text, re.I):
            return family
    return None


def infer_level(title: str) -> Optional[int]:
    text = title or ""
    found = [level for level, pattern in _LEVELS if re.search(pattern, text, re.I)]
    return max(found) if found else None


def credit_from_benchmark(
    target_family: Optional[str],
    target_level: Optional[int],
    family: Optional[str],
    level: Optional[int],
) -> str:
    """Survey-match distance. Unknown family stays unset so a person can pick."""
    if not target_family or not family:
        return "unset"
    if family != target_family:
        return "none"
    if target_level is None or level is None:
        return "unset"
    if level == target_level:
        return "full"
    return "half"


def _normalize_credit(value: Any) -> str:
    if value is None:
        return "unset"
    text = str(value).strip().lower()
    if text in CREDIT_FRACTION or text == "unset":
        return text
    if text in {"1", "1.0", "same"}:
        return "full"
    if text in {"0.5", ".5", "similar", "partial"}:
        return "half"
    if text in {"0", "0.0", "unrelated"}:
        return "none"
    return "unset"


def tally_jobs(
    jobs: List[Dict[str, Any]],
    *,
    as_of: Optional[date] = None,
    target_family: Optional[str] = None,
    target_level: Optional[int] = None,
) -> Dict[str, Any]:
    """Credit a list of jobs. Does not read a resume file."""
    as_of = as_of or date.today()
    prepared: List[Dict[str, Any]] = []
    for index, raw in enumerate(jobs[:MAX_JOBS]):
        title = str(raw.get("title") or "").strip()
        family = raw.get("family") or infer_family(title)
        level = raw.get("level")
        if level is None:
            level = infer_level(title)
        else:
            try:
                level = int(level)
            except (TypeError, ValueError):
                level = infer_level(title)
        credit = _normalize_credit(raw.get("credit"))
        if credit == "unset" and target_family:
            credit = credit_from_benchmark(target_family, target_level, family, level)
        start = parse_month(raw.get("start"), as_of=as_of)
        end = parse_month(raw.get("end"), as_of=as_of)
        readable = start is not None and end is not None and end >= start
        prepared.append(
            {
                "index": index,
                "title": title,
                "employer": str(raw.get("employer") or "").strip(),
                "start": start,
                "end": end,
                "family": family,
                "level": level,
                "credit": credit,
                "reason": str(raw.get("reason") or "").strip(),
                "readable": readable,
                "months": _months_inclusive(start, end) if readable else [],
            }
        )

    winner: Dict[Tuple[int, int], int] = {}
    for job in prepared:
        fraction = CREDIT_FRACTION.get(job["credit"])
        if fraction is None or not job["readable"]:
            continue
        for key in job["months"]:
            current = winner.get(key)
            if current is None:
                winner[key] = job["index"]
                continue
            current_fraction = CREDIT_FRACTION[prepared[current]["credit"]]
            if fraction > current_fraction:
                winner[key] = job["index"]

    rows: List[Dict[str, Any]] = []
    credited_month_units = 0.0
    for job in prepared:
        won = [key for key, owner in winner.items() if owner == job["index"]]
        dropped = len(job["months"]) - len(won) if job["readable"] else 0
        fraction = CREDIT_FRACTION.get(job["credit"], 0.0)
        if job["credit"] not in CREDIT_FRACTION:
            fraction = 0.0
        credited_years = round(len(won) * fraction / 12.0, 2) if job["readable"] else 0.0
        credited_month_units += len(won) * fraction
        reason = job["reason"]
        if not reason and job["credit"] in CREDIT_FRACTION and job["family"]:
            reason = _default_reason(job["credit"], job["family"], job["level"])
        rows.append(
            {
                "title": job["title"],
                "employer": job["employer"],
                "start": job["start"].isoformat() if job["start"] else None,
                "end": job["end"].isoformat() if job["end"] else None,
                "family": job["family"],
                "level": job["level"],
                "credit": job["credit"],
                "reason": reason,
                "readable": job["readable"],
                "calendar_months": len(job["months"]),
                "credited_years": credited_years,
                "dropped_months": dropped,
            }
        )

    calendar_months = len(winner)
    blocking = [
        row["title"] or f"Job {i + 1}"
        for i, row in enumerate(rows)
        if not row["readable"] or row["credit"] not in CREDIT_FRACTION
    ]
    return {
        "jobs": rows,
        "calendar_months": calendar_months,
        "calendar_years": round(calendar_months / 12.0, 2),
        "credited_years": round(credited_month_units / 12.0, 2),
        "can_confirm": len(rows) > 0 and not blocking,
        "blocking": blocking,
        "as_of": as_of.isoformat(),
    }


def _default_reason(credit: str, family: str, level: Optional[int]) -> str:
    label = family.replace("_", " ")
    if credit == "full":
        return f"Same {label} benchmark" + (f", level {level}." if level else ".")
    if credit == "half":
        return f"Same {label} family, different level. Half credit."
    return f"Different function from the target ({label}). No credit."


def screen_paste(text: str) -> None:
    """Refuse a batch or an SSN. One resume is allowed to name a person."""
    if text is None or not str(text).strip():
        raise ValueError("Paste a resume, or open the sample.")
    if len(text) > MAX_PASTE_CHARS:
        raise ValueError("That paste is too long for one resume.")
    if _SSN_RE.search(text):
        raise ValueError("This looks like it contains an SSN. Remove it and try again.")
    if len(_EMAIL_RE.findall(text)) >= 3:
        raise ValueError("This looks like more than one person's file.")


def parse_resume(text: str, *, as_of: Optional[date] = None) -> Dict[str, Any]:
    """Split a pasted resume into jobs. Dates the splitter cannot read stay unreadable."""
    screen_paste(text)
    as_of = as_of or date.today()
    lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    education = _find_education(lines)
    spans = [i for i, line in enumerate(lines) if _SPAN_RE.search(line)]
    jobs: List[Dict[str, Any]] = []
    for nth, index in enumerate(spans):
        match = _SPAN_RE.search(lines[index])
        if match is None:
            continue
        start = parse_month(f"{match.group('sm')} {match.group('sy')}", as_of=as_of)
        if match.group("pres"):
            end = parse_month("present", as_of=as_of)
        else:
            end = parse_month(f"{match.group('em')} {match.group('ey')}", as_of=as_of)
        title, employer = _title_and_employer(lines, index)
        next_index = spans[nth + 1] if nth + 1 < len(spans) else len(lines)
        bullets = _bullets(lines, index + 1, next_index)
        jobs.append(
            {
                "title": title,
                "employer": employer,
                "start": start.isoformat() if start else None,
                "end": end.isoformat() if end else None,
                "bullets": bullets,
            }
        )
    return {"education": education, "jobs": jobs, "as_of": as_of.isoformat()}


def _find_education(lines: List[str]) -> Optional[str]:
    for line in lines:
        if not line or _SPAN_RE.search(line):
            continue
        if re.search(r"education|degree|bachelor|master|doctor|associate|phd|mba", line, re.I):
            label, _level = normalize_education(line)
            if label:
                return label
    return None


def _title_and_employer(lines: List[str], date_index: int) -> Tuple[str, str]:
    above: List[str] = []
    cursor = date_index - 1
    while cursor >= 0 and len(above) < 2:
        line = lines[cursor]
        cursor -= 1
        if not line or line.startswith(("-", "•", "*")) or _SPAN_RE.search(line):
            if above:
                break
            continue
        if re.search(r"education|degree", line, re.I):
            break
        above.append(line)
    if len(above) >= 2:
        return above[1], above[0]
    if above:
        return above[0], ""
    return "", ""


def _bullets(lines: List[str], start: int, stop: int) -> List[str]:
    # The next job's title and employer sit just above its date line.
    cut = stop
    if stop < len(lines):
        cut = max(start, stop - 2)
    out: List[str] = []
    for line in lines[start:cut]:
        if not line:
            if out:
                break
            continue
        if _SPAN_RE.search(line):
            break
        cleaned = line.lstrip("-•* ").strip()
        if cleaned:
            out.append(cleaned)
    return out


def tally_text(
    text: str,
    *,
    as_of: Optional[date] = None,
    target_title: Optional[str] = None,
    target_family: Optional[str] = None,
    target_level: Optional[int] = None,
) -> Dict[str, Any]:
    parsed = parse_resume(text, as_of=as_of)
    family = target_family or infer_family(target_title or "")
    level = target_level if target_level is not None else infer_level(target_title or "")
    ledger = tally_jobs(
        parsed["jobs"],
        as_of=as_of,
        target_family=family,
        target_level=level,
    )
    ledger["education"] = parsed["education"]
    ledger["target"] = {"title": target_title, "family": family, "level": level}
    return ledger


def extract_text(filename: str, content: bytes) -> str:
    """PDF and DOCX to text. Paste remains the path that does not need either library."""
    name = (filename or "").lower()
    if name.endswith(".docx"):
        try:
            import io

            import docx
        except ImportError as exc:
            raise ValueError("DOCX support is not installed.") from exc
        document = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in document.paragraphs if p.text)
    if name.endswith(".pdf"):
        try:
            import io

            from pypdf import PdfReader
        except ImportError as exc:
            raise ValueError("PDF support is not installed.") from exc
        reader = PdfReader(io.BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="replace")
