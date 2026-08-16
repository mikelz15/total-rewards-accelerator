"""SQLAlchemy engine / sessions. SaaS is optional until DATABASE_URL is set."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

_engine: Optional[Engine] = None
_SessionLocal: Optional[sessionmaker] = None


def saas_config_status() -> dict:
    """Booleans only — never expose secret values (for /health diagnostics)."""
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
            ("DATABASE", "SUPABASE", "CORS", "DEMO", "RENDER_", "PYTHON")
        )
    )
    return {
        "has_database_url": has_db,
        "has_supabase_url": has_url,
        "has_supabase_anon_key": has_anon,
        "has_jwt_secret": has_real_secret,
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
