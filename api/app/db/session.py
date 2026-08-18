"""SQLAlchemy engine / sessions. SaaS is optional until DATABASE_URL is set."""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

_engine: Optional[Engine] = None
_SessionLocal: Optional[sessionmaker] = None
_composite_applied = False
_composite_meta: dict = {
    "tra_saas_json_present": False,
    "tra_saas_json_parse_ok": False,
    "tra_saas_json_keys": [],
    "tra_stripe_json_present": False,
    "tra_stripe_json_parse_ok": False,
    "tra_stripe_json_keys": [],
}


def _merge_json_env(var_name: str, *, override: bool = False) -> tuple[bool, bool, list]:
    """Load JSON object from env var into os.environ. Returns (present, parse_ok, keys)."""
    raw = os.environ.get(var_name, "").strip()
    if not raw:
        return False, False, []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return True, False, []
    if not isinstance(data, dict):
        return True, False, []
    keys: list = []
    for key, value in data.items():
        if not key or value is None:
            continue
        k = str(key).strip()
        v = str(value).strip()
        if not k or not v:
            continue
        keys.append(k)
        if override or k not in os.environ or not str(os.environ.get(k, "")).strip():
            os.environ[k] = v
    return True, True, sorted(keys)


def apply_composite_saas_env() -> None:
    """
    Optional JSON bootstrap for hosts that drop individual dashboard secrets.

    TRA_SAAS_JSON — DB + Supabase (+ optional Stripe)
    TRA_STRIPE_JSON — Stripe-only (recommended if TRA_SAAS_JSON is already large)
    """
    global _composite_applied, _composite_meta
    if _composite_applied:
        return
    _composite_applied = True
    p1, ok1, k1 = _merge_json_env("TRA_SAAS_JSON", override=False)
    p2, ok2, k2 = _merge_json_env("TRA_STRIPE_JSON", override=True)
    _composite_meta = {
        "tra_saas_json_present": p1,
        "tra_saas_json_parse_ok": ok1,
        "tra_saas_json_keys": k1,
        "tra_stripe_json_present": p2,
        "tra_stripe_json_parse_ok": ok2,
        "tra_stripe_json_keys": k2,
    }


def saas_config_status() -> dict:
    """Booleans only — never expose secret values (for /health diagnostics)."""
    apply_composite_saas_env()
    secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
    anon = (
        os.environ.get("SUPABASE_ANON_KEY", "").strip()
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    )
    has_real_secret = bool(secret) and not secret.startswith("eyJ")
    has_db = bool(os.environ.get("DATABASE_URL", "").strip())
    has_url = bool(os.environ.get("SUPABASE_URL", "").strip())
    has_anon = bool(anon)
    # Key names only (helps catch typos / wrong service) — never values
    related_keys = sorted(
        k
        for k in os.environ
        if k.upper().startswith(
            ("DATABASE", "SUPABASE", "CORS", "DEMO", "TRA_SAAS", "STRIPE", "PUBLIC_WEB", "SYSTEM_ADMIN", "RENDER_", "PYTHON")
        )
    )
    return {
        "has_database_url": has_db,
        "has_supabase_url": has_url,
        "has_supabase_anon_key": has_anon,
        "has_jwt_secret": has_real_secret,
        "has_tra_saas_json": bool(os.environ.get("TRA_SAAS_JSON", "").strip()),
        "has_tra_stripe_json": bool(os.environ.get("TRA_STRIPE_JSON", "").strip()),
        "composite": dict(_composite_meta),
        "ready": has_db and (has_real_secret or (has_url and has_anon)),
        "related_env_keys": related_keys,
    }


def saas_enabled() -> bool:
    """True when DB + (JWT secret or Supabase URL for Auth API) are configured."""
    return bool(saas_config_status()["ready"])


def get_engine() -> Engine:
    global _engine, _SessionLocal
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    # Supabase pooler sometimes needs this; sync driver for simplicity in Phase 1
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if _engine is None:
        _engine = create_engine(url, pool_pre_ping=True, pool_size=3, max_overflow=5)
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
    return _engine


@contextmanager
def get_session() -> Generator[Session, None, None]:
    get_engine()
    assert _SessionLocal is not None
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
