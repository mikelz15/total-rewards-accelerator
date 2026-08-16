"""SaaS analysis: equity audit, remediation, closer — org-scoped, no demo sample lock."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import AnalysisRun, Dataset
from app.db.session import get_session
from app.services.auditor import audit_equity
from app.services.closer import build_wealth_pdf, project_total_wealth
from app.services.flight_risk import assess_flight_risk
from app.services.remediation import remediate

router = APIRouter(prefix="/api/v1", tags=["saas-analysis"])


class AuditBody(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    dataset_id: Optional[UUID] = None
    underpaid_threshold: float = 0.90
    overpaid_threshold: float = 1.10
    top_n: int = 5
    lens: str = "both"
    save: bool = True


class RemediationBody(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    dataset_id: Optional[UUID] = None
    merit_pool: float = Field(..., ge=0)
    target_compa: float = Field(1.0, gt=0, le=1.5)
    underpaid_only: bool = True
    max_increase_pct: Optional[float] = Field(None, ge=0, le=50)
    target_mode: str = "mid"
    save: bool = True


class CloserBody(BaseModel):
    base_salary: float = Field(..., gt=0)
    target_bonus_pct: float = Field(0, ge=0)
    lti_target_value: float = Field(0, ge=0)
    years: int = Field(4, ge=1, le=10)
    salary_growth_rate: float = Field(0.03, ge=0, le=0.2)
    lti_vest_years: int = Field(4, ge=1, le=10)
    company_name: str = "Company"
    candidate_name: str = "Candidate"
    job_title: str = "Role"
    years_experience: Optional[float] = None
    education: Optional[str] = None
    required_education: Optional[str] = None
    range_min: Optional[float] = None
    range_mid: Optional[float] = None
    range_max: Optional[float] = None
    use_recommended_base: bool = False
    save: bool = True


def _load_records(
    session,
    org_id: UUID,
    records: Optional[List[Dict[str, Any]]],
    dataset_id: Optional[UUID],
) -> tuple[List[Dict[str, Any]], Optional[UUID]]:
    if dataset_id:
        ds = session.get(Dataset, dataset_id)
        if not ds or ds.org_id != org_id:
            raise HTTPException(status_code=404, detail="Dataset not found")
        rows = list(ds.records_json or [])
        if not rows:
            raise HTTPException(status_code=400, detail="Dataset has no records")
        return rows, ds.id
    if records:
        return records, None
    raise HTTPException(status_code=400, detail="Provide records or dataset_id")


def _save_run(
    session,
    *,
    org_id: UUID,
    user_id: UUID,
    kind: str,
    dataset_id: Optional[UUID],
    params: dict,
    result: dict,
) -> Optional[str]:
    run = AnalysisRun(
        org_id=org_id,
        dataset_id=dataset_id,
        kind=kind,
        params_json=params,
        result_json=result,
        created_by=user_id,
    )
    session.add(run)
    session.flush()
    return str(run.id)


@router.post("/auditor/run")
def saas_auditor_run(
    payload: AuditBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        records, dataset_id = _load_records(
            session, ctx.org.id, payload.records, payload.dataset_id
        )
        audit = audit_equity(
            records,
            underpaid_threshold=payload.underpaid_threshold,
            overpaid_threshold=payload.overpaid_threshold,
            top_n=payload.top_n,
            lens=payload.lens,
        )
        risk = assess_flight_risk(records)
        risk_by_id = {str(e.get("employee_id")): e for e in risk["employees"]}
        for emp in audit["employees"]:
            r = risk_by_id.get(str(emp.get("employee_id")), {})
            emp["flight_risk"] = r.get("flight_risk")
            emp["flight_risk_band"] = r.get("flight_risk_band")
            emp["flight_risk_drivers"] = r.get("flight_risk_drivers")
        for t in audit["top_raise_targets"]:
            r = risk_by_id.get(str(t.get("employee_id")), {})
            t["flight_risk"] = r.get("flight_risk")
            t["flight_risk_band"] = r.get("flight_risk_band")
        for s in audit["scatter"]:
            r = risk_by_id.get(str(s.get("employee_id")), {})
            s["flight_risk"] = r.get("flight_risk")
            s["flight_risk_band"] = r.get("flight_risk_band")
        audit["flight_risk_summary"] = risk["summary"]
        audit["top_flight_risks"] = risk["top_risks"][:5]
        audit["saas"] = {"org_id": str(ctx.org.id)}
        run_id = None
        if payload.save:
            # Persist summary-sized result (full employees can be large)
            slim = {
                "summary": audit.get("summary"),
                "flight_risk_summary": audit.get("flight_risk_summary"),
                "top_raise_targets": audit.get("top_raise_targets"),
                "top_flight_risks": audit.get("top_flight_risks"),
                "placement_summary": audit.get("placement_summary"),
                "lens": audit.get("lens"),
            }
            run_id = _save_run(
                session,
                org_id=ctx.org.id,
                user_id=user.user_id,
                kind="audit",
                dataset_id=dataset_id,
                params={
                    "underpaid_threshold": payload.underpaid_threshold,
                    "overpaid_threshold": payload.overpaid_threshold,
                    "top_n": payload.top_n,
                    "lens": payload.lens,
                },
                result=slim,
            )
        audit["run_id"] = run_id
        return audit


@router.post("/remediation/run")
def saas_remediation_run(
    payload: RemediationBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        records, dataset_id = _load_records(
            session, ctx.org.id, payload.records, payload.dataset_id
        )
        result = remediate(
            records,
            merit_pool=payload.merit_pool,
            target_compa=payload.target_compa,
            underpaid_only=payload.underpaid_only,
            max_increase_pct=payload.max_increase_pct,
            target_mode=payload.target_mode,
        )
        result["saas"] = {"org_id": str(ctx.org.id)}
        run_id = None
        if payload.save:
            run_id = _save_run(
                session,
                org_id=ctx.org.id,
                user_id=user.user_id,
                kind="remediation",
                dataset_id=dataset_id,
                params={
                    "merit_pool": payload.merit_pool,
                    "target_compa": payload.target_compa,
                    "underpaid_only": payload.underpaid_only,
                    "max_increase_pct": payload.max_increase_pct,
                    "target_mode": payload.target_mode,
                },
                result={
                    "summary": result.get("summary"),
                    "allocations": result.get("allocations"),
                    "unfunded": result.get("unfunded"),
                },
            )
        result["run_id"] = run_id
        return result


@router.post("/closer/project")
def saas_closer_project(
    payload: CloserBody,
    user: CurrentUser = Depends(get_current_user),
) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        projection = project_total_wealth(**payload.model_dump(exclude={"save"}))
        projection["saas"] = {"org_id": str(ctx.org.id), "sample_only": False}
        if payload.save:
            run_id = _save_run(
                session,
                org_id=ctx.org.id,
                user_id=user.user_id,
                kind="placement",
                dataset_id=None,
                params=payload.model_dump(exclude={"save"}),
                result={
                    "candidate_name": projection.get("candidate_name"),
                    "job_title": projection.get("job_title"),
                    "totals": projection.get("totals"),
                    "schedule": projection.get("schedule"),
                },
            )
            projection["run_id"] = run_id
        return projection


@router.post("/closer/pdf")
def saas_closer_pdf(
    payload: CloserBody,
    user: CurrentUser = Depends(get_current_user),
) -> Response:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        _ = ctx  # auth + org bootstrap
        projection = project_total_wealth(**payload.model_dump(exclude={"save"}))
        pdf_bytes = build_wealth_pdf(projection)
        filename = f"total_wealth_{payload.candidate_name.replace(' ', '_').lower()}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
