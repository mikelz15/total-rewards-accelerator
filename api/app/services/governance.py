"""Governance library. Not a module.

The seed is the national pack. A tenant sees only the places on their file.
Federal cards ride along once any place is present. A file with no place
sees nothing.
"""

from __future__ import annotations

import json
import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set

_PACK_PATH = Path(__file__).resolve().parents[1] / "data" / "governance_rules.json"
_CHIP_WINDOW = timedelta(days=90)
_PLACE_KEYS = {
    "location",
    "state",
    "work_location",
    "worksite",
    "jurisdiction",
    "work_state",
}

# Longer names first so "West Virginia" wins over "Virginia".
_STATE_NAMES = (
    ("district of columbia", "us-dc"),
    ("west virginia", "us-wv"),
    ("north carolina", "us-nc"),
    ("north dakota", "us-nd"),
    ("south carolina", "us-sc"),
    ("south dakota", "us-sd"),
    ("new hampshire", "us-nh"),
    ("new jersey", "us-nj"),
    ("new mexico", "us-nm"),
    ("new york", "us-ny"),
    ("rhode island", "us-ri"),
    ("alabama", "us-al"),
    ("alaska", "us-ak"),
    ("arizona", "us-az"),
    ("arkansas", "us-ar"),
    ("california", "us-ca"),
    ("colorado", "us-co"),
    ("connecticut", "us-ct"),
    ("delaware", "us-de"),
    ("florida", "us-fl"),
    ("georgia", "us-ga"),
    ("hawaii", "us-hi"),
    ("idaho", "us-id"),
    ("illinois", "us-il"),
    ("indiana", "us-in"),
    ("iowa", "us-ia"),
    ("kansas", "us-ks"),
    ("kentucky", "us-ky"),
    ("louisiana", "us-la"),
    ("maine", "us-me"),
    ("maryland", "us-md"),
    ("massachusetts", "us-ma"),
    ("michigan", "us-mi"),
    ("minnesota", "us-mn"),
    ("mississippi", "us-ms"),
    ("missouri", "us-mo"),
    ("montana", "us-mt"),
    ("nebraska", "us-ne"),
    ("nevada", "us-nv"),
    ("ohio", "us-oh"),
    ("oklahoma", "us-ok"),
    ("oregon", "us-or"),
    ("pennsylvania", "us-pa"),
    ("tennessee", "us-tn"),
    ("texas", "us-tx"),
    ("utah", "us-ut"),
    ("vermont", "us-vt"),
    ("virginia", "us-va"),
    ("washington", "us-wa"),
    ("wisconsin", "us-wi"),
    ("wyoming", "us-wy"),
)
_STATE_CODES = {code.split("-", 1)[1] for _, code in _STATE_NAMES}
_CODE_TO_ID = {code.split("-", 1)[1]: code for _, code in _STATE_NAMES}
_ID_TO_NAME = {code: name.title() for name, code in _STATE_NAMES}
_ID_TO_NAME["us-dc"] = "District of Columbia"


def load_pack() -> Dict[str, Any]:
    return json.loads(_PACK_PATH.read_text(encoding="utf-8"))


def places_in_text(text: str) -> Set[str]:
    """Pull state ids out of one cell. Two-letter codes count only in uppercase."""
    found: Set[str] = set()
    lowered = text.lower()
    if re.search(r"washington,?\s+d\.?c\.?", lowered):
        found.add("us-dc")
        lowered = re.sub(r"washington,?\s+d\.?c\.?", " ", lowered)
    for name, code in _STATE_NAMES:
        pattern = rf"\b{re.escape(name)}\b"
        if re.search(pattern, lowered):
            found.add(code)
            lowered = re.sub(pattern, " ", lowered)
    for match in re.findall(r"\bus-([a-z]{2})\b", lowered):
        code = _CODE_TO_ID.get(match)
        if code:
            found.add(code)
    for token in re.findall(r"[A-Za-z]{2}", text):
        if token.isupper() and token.lower() in _STATE_CODES:
            found.add(_CODE_TO_ID[token.lower()])
    stripped = text.strip()
    if len(stripped) == 2 and stripped.lower() in _STATE_CODES:
        found.add(_CODE_TO_ID[stripped.lower()])
    return found


def places_from_records(records: Optional[Iterable[Any]]) -> List[str]:
    found: Set[str] = set()
    for row in records or []:
        if not isinstance(row, dict):
            continue
        for key, value in row.items():
            if str(key).strip().lower() not in _PLACE_KEYS or value in (None, ""):
                continue
            found |= places_in_text(str(value))
    return sorted(found)


def _parse_day(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return date.fromisoformat(value[:10])


def _bucket(rule: Dict[str, Any], as_of: date) -> str:
    effective = _parse_day(rule.get("effective_on")) or date.min
    sunset = _parse_day(rule.get("sunset_on"))
    if sunset and sunset < as_of:
        return "past"
    if effective > as_of:
        return "future"
    return "current"


def _chip(rule: Dict[str, Any], as_of: date, bucket: str) -> bool:
    if bucket != "current" or rule.get("severity") in {"watch", "context"}:
        return False
    status = rule.get("status")
    if status == "in_force":
        return True
    if status != "passed":
        return False
    effective = _parse_day(rule.get("effective_on"))
    if not effective:
        return False
    return timedelta(0) <= (effective - as_of) <= _CHIP_WINDOW


def _card(rule: Dict[str, Any], chip: bool) -> Dict[str, Any]:
    threshold = rule.get("threshold") if isinstance(rule.get("threshold"), dict) else {}
    return {
        "id": rule.get("id"),
        "jurisdiction_id": rule.get("jurisdiction_id"),
        "place": _ID_TO_NAME.get(rule.get("jurisdiction_id") or "", "Federal"),
        "citation": rule.get("citation"),
        "summary": rule.get("summary"),
        "status": rule.get("status"),
        "effective_on": rule.get("effective_on"),
        "sunset_on": rule.get("sunset_on"),
        "instrument": rule.get("instrument"),
        "employees": threshold.get("employees"),
        "source_url": rule.get("source_url"),
        "severity": rule.get("severity"),
        "chip": chip,
    }


def _matches(rule: Dict[str, Any], places: Set[str]) -> bool:
    jurisdiction = rule.get("jurisdiction_id")
    if jurisdiction == "us-federal":
        return bool(places)
    return jurisdiction in places


def library(records: Optional[Iterable[Any]], as_of: Optional[date] = None) -> Dict[str, Any]:
    """Split the seed into past, current, and future for one file."""
    day = as_of or date.today()
    pack = load_pack()
    place_ids = places_from_records(records)
    place_set = set(place_ids)
    grouped: Dict[str, List[Dict[str, Any]]] = {"past": [], "current": [], "future": []}
    if place_set:
        for rule in pack.get("rules") or []:
            if not isinstance(rule, dict) or not _matches(rule, place_set):
                continue
            bucket = _bucket(rule, day)
            grouped[bucket].append(_card(rule, _chip(rule, day, bucket)))
    return {
        "as_of": day.isoformat(),
        "version": pack.get("version"),
        "disclaimer": pack.get("disclaimer"),
        "places": [
            {"id": place_id, "name": _ID_TO_NAME.get(place_id, place_id)}
            for place_id in place_ids
        ],
        "includes_federal": bool(place_set),
        "empty_reason": None if place_set else "no_places",
        "past": grouped["past"],
        "current": grouped["current"],
        "future": grouped["future"],
    }
