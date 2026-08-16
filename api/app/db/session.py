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


def apply_composite_saas_env() -> None:
    """
    Optional single-var bootstrap for hosts that only apply some dashboard secrets.

    Set TRA_SAAS_JSON to a JSON object, e.g.:
      {"DATABASE_URL":"...","SUPABASE_URL":"...","SUPABASE_ANON_KEY":"..."}

    Existing process env wins (setdefault).
    """
    global _composite_applied
    if _composite_applied:
        return
    _composite_applied = True
    raw = os.environ.get("TRA_SAAS_JSON", "").strip()
    if not raw:
        return
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return
    if not isinstance(data, dict):
        return
    for key, value in data.items():
        if not key or value is None:
            continue
        k = str(key).strip()
        v = str(value).strip()
        if k and v:
            os.environ.setdefault(k, v)


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
            ("DATABASE", "SUPABASE", "CORS", "DEMO", "TRA_SAAS", "RENDER_", "PYTHON")
        )
    )
    return {
        "has_database_url": has_db,
        "has_supabase_url": has_url,
        "has_supabase_anon_key": has_anon,
        "has_jwt_secret": has_real_secret,
        "has_tra_saas_json": bool(os.environ.get("TRA_SAAS_JSON", "").strip()),
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
