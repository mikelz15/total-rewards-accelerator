"""Candidate Closer — multi-year total wealth projection + PDF statement."""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.services.placement import place_person


def project_total_wealth(
    *,
    base_salary: float,
    target_bonus_pct: float = 0.0,
    lti_target_value: float = 0.0,
    years: int = 4,
    salary_growth_rate: float = 0.03,
    lti_vest_years: int = 4,
    company_name: str = "Company",
    candidate_name: str = "Candidate",
    job_title: str = "Role",
    years_experience: Optional[float] = None,
    education: Optional[str] = None,
    required_education: Optional[str] = None,
    range_min: Optional[float] = None,
    range_mid: Optional[float] = None,
    range_max: Optional[float] = None,
    use_recommended_base: bool = False,
) -> Dict[str, Any]:
    """
    Build a year-by-year total wealth projection.

    When range + YOE/education provided, attaches placement recommendation
    (wage-calc mindset). If use_recommended_base=True and expected_rate exists,
    projects wealth off the recommended base instead of stated offer base.
    """
    placement = None
    if any(v is not None for v in (range_min, range_mid, range_max, years_experience, education)):
        placement = place_person(
            base_salary=base_salary,
            range_min=range_min,
            range_mid=range_mid,
            range_max=range_max,
            years_experience=years_experience,
            education=education,
            required_education=required_education,
        )

    project_base = float(base_salary)
    if use_recommended_base and placement and placement.get("expected_rate"):
        project_base = float(placement["expected_rate"])

    bonus_rate = target_bonus_pct / 100.0 if target_bonus_pct > 1 else target_bonus_pct
    annual_lti = lti_target_value / max(lti_vest_years, 1)

    timeline: List[Dict[str, Any]] = []
    cumulative = 0.0
    salary = float(project_base)

    for year in range(1, years + 1):
        base = round(salary, 2)
        bonus = round(base * bonus_rate, 2)
        vesting = round(annual_lti if year <= lti_vest_years else 0.0, 2)
        total_year = round(base + bonus + vesting, 2)
        cumulative = round(cumulative + total_year, 2)

        timeline.append(
            {
                "year": year,
                "base": base,
                "bonus": bonus,
                "vesting": vesting,
                "growth": round(max(total_year - base, 0), 2),
                "year_total": total_year,
                "cumulative": cumulative,
            }
        )
        salary *= 1 + salary_growth_rate

    grand_total = timeline[-1]["cumulative"] if timeline else 0.0

    result: Dict[str, Any] = {
        "meta": {
            "company_name": company_name,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "years": years,
            "salary_growth_rate": salary_growth_rate,
            "lti_vest_years": lti_vest_years,
            "use_recommended_base": use_recommended_base,
        },
        "inputs": {
            "base_salary": base_salary,
            "project_base_salary": project_base,
            "target_bonus_pct": target_bonus_pct if target_bonus_pct > 1 else target_bonus_pct * 100,
            "lti_target_value": lti_target_value,
            "years_experience": years_experience,
            "education": education,
            "required_education": required_education,
            "range_min": range_min,
            "range_mid": range_mid,
            "range_max": range_max,
        },
        "timeline": timeline,
        "grand_total": grand_total,
        "summary": {
            "year_1_cash": timeline[0]["base"] + timeline[0]["bonus"] if timeline else 0,
            "year_1_total": timeline[0]["year_total"] if timeline else 0,
            "four_year_total": grand_total,
        },
        "placement": placement,
    }
    return result


def build_wealth_pdf(projection: Dict[str, Any]) -> bytes:
    """Render a one-page total wealth projection PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#475569"),
        spaceAfter=16,
    )
    body = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#1e293b"),
        leading=14,
    )

    meta = projection["meta"]
    inputs = projection["inputs"]
    timeline = projection["timeline"]

    story: List[Any] = []
    story.append(Paragraph("4-Year Total Wealth Projection", title_style))
    story.append(
        Paragraph(
            f"{meta['company_name']}  ·  {meta['candidate_name']}  ·  {meta['job_title']}",
            subtitle,
        )
    )
    story.append(
        Paragraph(
            "This statement translates base, bonus, and long-term incentive assumptions "
            "into a multi-year total rewards trajectory. Figures are illustrative projections, "
            "not guarantees of future pay.",
            body,
        )
    )
    story.append(Spacer(1, 0.25 * inch))

    input_data = [
        ["Compensation Inputs", "Value"],
        ["Base Salary", f"${inputs['base_salary']:,.0f}"],
        ["Target Bonus %", f"{inputs['target_bonus_pct']:.1f}%"],
        ["LTI Target Value (RSUs)", f"${inputs['lti_target_value']:,.0f}"],
        ["Salary Growth Assumption", f"{meta['salary_growth_rate'] * 100:.1f}% / yr"],
        ["LTI Vest Schedule", f"{meta['lti_vest_years']} years equal"],
    ]
    input_table = Table(input_data, colWidths=[3.2 * inch, 2.5 * inch])
    input_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(input_table)
    story.append(Spacer(1, 0.3 * inch))

    rows = [["Year", "Base", "Bonus", "Vesting (LTI)", "Year Total", "Cumulative"]]
    for t in timeline:
        rows.append(
            [
                f"Year {t['year']}",
                f"${t['base']:,.0f}",
                f"${t['bonus']:,.0f}",
                f"${t['vesting']:,.0f}",
                f"${t['year_total']:,.0f}",
                f"${t['cumulative']:,.0f}",
            ]
        )
    rows.append(["", "", "", "Grand Total", "", f"${projection['grand_total']:,.0f}"])

    wealth_table = Table(rows, colWidths=[0.9 * inch, 1.0 * inch, 1.0 * inch, 1.2 * inch, 1.1 * inch, 1.1 * inch])
    wealth_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ecfdf5")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#99f6e4")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(wealth_table)
    story.append(Spacer(1, 0.35 * inch))

    story.append(
        Paragraph(
            f"<b>Year-1 total rewards:</b> ${projection['summary']['year_1_total']:,.0f}"
            f" &nbsp;&nbsp;|&nbsp;&nbsp; <b>{meta['years']}-year cumulative:</b> "
            f"${projection['grand_total']:,.0f}",
            body,
        )
    )
    story.append(Spacer(1, 0.25 * inch))
    story.append(
        Paragraph(
            "Generated by <b>Total Rewards Accelerator</b> — Mikéz Comp Engineering Toolkit. "
            "Three-Click Philosophy: design strategy, don't crunch rows.",
            ParagraphStyle("Footer", parent=body, fontSize=8, textColor=colors.HexColor("#64748b")),
        )
    )

    doc.build(story)
    return buffer.getvalue()
