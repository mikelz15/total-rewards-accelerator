"""Authenticated Cleaner — same domain logic, org row limits (no public demo caps)."""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.session import get_session
from app.services.cleaner import clean_dataframe, parse_tabular_text

router = APIRouter(prefix="/api/v1/cleaner", tags=["saas-cleaner"])


class CleanJsonRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    csv_text: Optional[str] = None


def _read_text_bytes(content: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("latin-1", errors="replace")


def _parse_to_df(text: str) -> pd.DataFrame:
    try:
        df = parse_tabular_text(text)
    except Exception:
        try:
            df = pd.read_csv(io.StringIO(text))
        except Exception as exc2:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Could not parse tabular data: {exc2}") from exc2
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV is empty")
    return df


def _clean_for_org(df: pd.DataFrame, max_rows: int) -> Dict[str, Any]:
    issues_prefix: List[Dict[str, Any]] = []
    if len(df) > max_rows:
        issues_prefix.append(
            {
                "level": "warning",
                "message": f"Plan limit: only the first {max_rows} rows were processed ({len(df)} submitted).",
                "row": None,
            }
        )
        df = df.head(max_rows).copy()
    result = clean_dataframe(df)
    result["saas"] = {"max_rows": max_rows, "truncated": bool(issues_prefix)}
    result.setdefault("issues", [])
    result["issues"] = issues_prefix + list(result["issues"])
    return result


@router.post("/upload")
async def cleaner_upload(
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        max_rows = ctx.org.max_upload_rows or 5000
    content = await file.read()
    text = _read_text_bytes(content)
    df = _parse_to_df(text)
    result = _clean_for_org(df, max_rows)
    result["source"] = {"filename": file.filename, "type": "upload"}
    return result


@router.post("/paste")
def cleaner_paste(
    payload: CleanJsonRequest,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        max_rows = ctx.org.max_upload_rows or 5000
    if payload.csv_text:
        df = _parse_to_df(payload.csv_text)
    elif payload.records:
        df = pd.DataFrame(payload.records)
        if df.empty:
            raise HTTPException(status_code=400, detail="No data rows found")
    else:
        raise HTTPException(status_code=400, detail="Provide csv_text or records")
    result = _clean_for_org(df, max_rows)
    result["source"] = {"type": "paste"}
    return result
