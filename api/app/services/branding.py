"""Org branding: one optional image path per organization.

The column comes from migration 008_org_branding.sql. It is read and written with
plain SQL, not the ORM model, so every Organization query keeps working on a
database where 008 has not been applied yet.
"""

from __future__ import annotations

import re
import uuid
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

BRANDING_BUCKET = "org-branding"
BRANDING_EXTENSIONS = ("png", "jpg", "jpeg", "svg", "webp")

_column_ready = False


def branding_available(session: Session) -> bool:
    """True once organizations.brand_image_path exists. Caches only the yes."""
    global _column_ready
    if _column_ready:
        return True
    exists = session.execute(
        text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = 'organizations' "
            "AND column_name = 'brand_image_path')"
        )
    ).scalar()
    if exists:
        _column_ready = True
    return bool(exists)


def get_brand_image_path(session: Session, org_id: uuid.UUID) -> Optional[str]:
    if not branding_available(session):
        return None
    return session.execute(
        text("SELECT brand_image_path FROM organizations WHERE id = :id"),
        {"id": org_id},
    ).scalar()


def set_brand_image_path(session: Session, org_id: uuid.UUID, path: Optional[str]) -> None:
    session.execute(
        text("UPDATE organizations SET brand_image_path = :path WHERE id = :id"),
        {"path": path, "id": org_id},
    )


def valid_brand_path(org_id: uuid.UUID, path: str) -> bool:
    """Object keys live under the org's own folder: <org_id>/<name>.<ext>, no nesting."""
    pattern = (
        rf"^{re.escape(str(org_id))}/[A-Za-z0-9._-]{{1,120}}\."
        rf"({'|'.join(BRANDING_EXTENSIONS)})$"
    )
    return bool(re.match(pattern, path, flags=re.IGNORECASE)) and ".." not in path
