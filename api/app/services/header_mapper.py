"""Header-only LLM mapper for leftover Cleaner columns.

Rules first (COLUMN_ALIASES). This module only sees unmapped header names
and the canonical schema. No cell values, no employee PII.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

CANONICAL_FIELDS = [
    "employee_id",
    "name",
    "first_name",
    "last_name",
    "job_title",
    "job_code",
    "department",
    "location",
    "manager",
    "base_salary",
    "hourly_rate",
    "pay_frequency",
    "range_min",
    "range_mid",
    "range_max",
    "performance",
    "hire_date",
    "fte",
    "grade",
    "flsa",
    "employment_status",
    "employee_type",
    "gender",
    "ethnicity",
    "years_experience",
    "education",
    "required_education",
]


def mapper_enabled() -> bool:
    return bool(_api_key())


def mapper_status() -> Dict[str, Any]:
    provider, model = _provider_model()
    return {
        "enabled": mapper_enabled(),
        "provider": provider if mapper_enabled() else None,
        "model": model if mapper_enabled() else None,
        "scope": "unmapped_headers_only",
        "sends_cell_values": False,
    }


def _api_key() -> str:
    return (
        os.environ.get("XAI_API_KEY", "").strip()
        or os.environ.get("OPENAI_API_KEY", "").strip()
        or os.environ.get("HEADER_MAPPER_API_KEY", "").strip()
    )


def _provider_model() -> Tuple[str, str]:
    explicit = os.environ.get("HEADER_MAPPER_MODEL", "").strip()
    if os.environ.get("XAI_API_KEY", "").strip():
        return "xai", explicit or "grok-4-fast-non-reasoning"
    if os.environ.get("OPENAI_API_KEY", "").strip():
        return "openai", explicit or "gpt-4.1-mini"
    return "none", explicit or ""


def _endpoint() -> str:
    override = os.environ.get("HEADER_MAPPER_BASE_URL", "").strip().rstrip("/")
    if override:
        return override + "/chat/completions"
    if os.environ.get("XAI_API_KEY", "").strip():
        return "https://api.x.ai/v1/chat/completions"
    return "https://api.openai.com/v1/chat/completions"


def suggest_header_map(
    unmapped_headers: List[str],
    already_mapped_canonical: List[str],
    timeout_seconds: float = 12.0,
) -> Dict[str, Any]:
    """Map leftover headers onto unused canonical fields.

    Returns {
      enabled, applied: {raw: canonical}, skipped: [...],
      rejected: [...], error: str|None, provider, model
    }
    """
    unused = [c for c in CANONICAL_FIELDS if c not in set(already_mapped_canonical)]
    headers = [str(h) for h in unmapped_headers if str(h).strip()]
    empty = {
        "enabled": mapper_enabled(),
        "applied": {},
        "skipped": headers,
        "rejected": [],
        "error": None,
        "provider": None,
        "model": None,
    }
    if not headers:
        return empty
    if not mapper_enabled():
        empty["error"] = "no_api_key"
        return empty
    if not unused:
        empty["error"] = "no_unused_canonical_fields"
        return empty

    provider, model = _provider_model()
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 600,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You map messy HRIS/CSV column headers onto a closed compensation schema. "
                    "Return JSON only. Never invent fields. Never map two headers to the same canonical. "
                    "If unsure, use null. Headers only — you will not receive cell values."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "canonical_unused": unused,
                        "already_mapped": already_mapped_canonical,
                        "unmapped_headers": headers,
                        "output_schema": {
                            "mappings": {"<raw_header>": "<canonical_or_null>"},
                            "confidence_notes": ["short reason when mapped"],
                        },
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }

    try:
        body = _post_json(_endpoint(), payload, timeout_seconds)
    except Exception as exc:  # noqa: BLE001
        empty["error"] = f"llm_request_failed: {exc}"
        empty["provider"] = provider
        empty["model"] = model
        return empty

    parsed = _extract_json(body)
    raw_map = parsed.get("mappings") if isinstance(parsed, dict) else {}
    if not isinstance(raw_map, dict):
        raw_map = {}

    applied: Dict[str, str] = {}
    rejected: List[Dict[str, str]] = []
    used = set()
    header_set = set(headers)
    unused_set = set(unused)

    for raw, canon in raw_map.items():
        raw_s = str(raw)
        if raw_s not in header_set:
            rejected.append({"header": raw_s, "reason": "not_in_unmapped_list"})
            continue
        if canon is None or str(canon).strip().lower() in {"", "null", "none", "skip"}:
            continue
        canon_s = str(canon).strip()
        if canon_s not in unused_set:
            rejected.append({"header": raw_s, "target": canon_s, "reason": "not_unused_canonical"})
            continue
        if canon_s in used:
            rejected.append({"header": raw_s, "target": canon_s, "reason": "duplicate_canonical"})
            continue
        applied[raw_s] = canon_s
        used.add(canon_s)

    skipped = [h for h in headers if h not in applied]
    return {
        "enabled": True,
        "applied": applied,
        "skipped": skipped,
        "rejected": rejected,
        "error": None,
        "provider": provider,
        "model": model,
        "notes": parsed.get("confidence_notes") if isinstance(parsed, dict) else [],
    }


def apply_llm_header_map(
    df,
    column_mapping: Dict[str, str],
    unmapped: List[str],
) -> Tuple[Any, Dict[str, str], List[str], Dict[str, Any]]:
    """Rename leftover columns in-place copy. Never overwrites rule-based maps."""
    meta = suggest_header_map(unmapped, list(column_mapping.values()))
    applied = meta.get("applied") or {}
    if not applied:
        return df, column_mapping, unmapped, meta

    work = df.rename(columns=applied)
    new_mapping = dict(column_mapping)
    new_mapping.update(applied)
    still = [c for c in unmapped if c not in applied]
    return work, new_mapping, still, meta


def _post_json(url: str, payload: Dict[str, Any], timeout_seconds: float) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc


def _extract_json(body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return {}
    if isinstance(content, list):
        content = "".join(
            part.get("text", "") if isinstance(part, dict) else str(part) for part in content
        )
    if not isinstance(content, str):
        return {}
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[-1]
        if content.endswith("```"):
            content = content[: content.rfind("```")]
    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(content[start : end + 1])
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                return {}
        return {}
