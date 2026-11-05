from fastapi import APIRouter, File, Form, UploadFile
from typing import Any

import pandas as pd

from app.services.formula_evaluator import run_checks

router = APIRouter(prefix="/formula-evaluator", tags=["formula-evaluator"])


@router.post("/run")
async def run_evaluator(
    file: UploadFile = File(...),
    mapping: str | None = Form(None),
) -> dict[str, Any]:
    """Run Formula Evaluator on an uploaded CSV/XLSX.

    First-pass only. File is not retained.
    """
    contents = await file.read()
    if file.filename and file.filename.lower().endswith(".xlsx"):
        df = pd.read_excel(pd.io.common.BytesIO(contents))
    else:
        df = pd.read_csv(pd.io.common.BytesIO(contents))

    # Basic sensitive header refusal (align with existing demo guard)
    sensitive = {"ssn", "social", "email", "phone", "dob", "birth"}
    if any(any(s in str(c).lower() for s in sensitive) for c in df.columns):
        return {
            "error": "Sensitive headers detected. Remove SSN, email, phone, or date-of-birth columns and retry.",
            "disclaimer": "These are flags for review, not legal conclusions.",
        }

    map_dict = None
    if mapping:
        import json

        try:
            map_dict = json.loads(mapping)
        except Exception:
            map_dict = None

    result = run_checks(df, map_dict)
    return result
