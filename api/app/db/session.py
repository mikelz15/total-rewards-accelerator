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


def saas_enabled() -> bool:
    """True when DB + (JWT secret or Supabase URL for Auth API) are configured."""
    has_db = bool(os.environ.get("DATABASE_URL", "").strip())
    secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
    # eyJ… keys are anon/service_role JWTs, not the signing secret
    has_real_secret = bool(secret) and not secret.startswith("eyJ")
    has_auth_api = bool(os.environ.get("SUPABASE_URL", "").strip()) and bool(
        os.environ.get("SUPABASE_ANON_KEY", "").strip()
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    )
    return has_db and (has_real_secret or has_auth_api)


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
