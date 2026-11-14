"""Formula Evaluator must flag a messy file and refuse a file it cannot read."""

import pytest

from app.services.formula_evaluator import UnreadableMeritFile, load_merit_frame, run_checks

GOOD = (
    b"employee_id,base_salary,merit_increase_pct,performance_rating\n"
    b"E1,80000,0.03,3\n"
    b"E2,90000,0.04,4\n"
)
MESSY = (
    b"employee_id,base_salary,merit_increase_pct,performance_rating\n"
    b"E1,80000,,3\n"
    b"E2,90000,abc,4\n"
    b"E3,70000,0.03,3\n"
)


def _frame(name: str, data: bytes):
    return load_merit_frame(name, data)


def test_good_file_runs():
    body = run_checks(_frame("good.csv", GOOD))
    assert body["row_count"] == 2
    assert body["issue_count"] == 0
    assert "error" not in body


def test_blank_and_text_increases_are_flags_not_a_crash():
    body = run_checks(_frame("messy.csv", MESSY))
    codes = [issue["code"] for issue in body["issues"]]
    assert "increase_bounds" in codes
    flagged = next(issue for issue in body["issues"] if issue["code"] == "increase_bounds")
    assert flagged["affected_count"] == 2


def test_empty_file_is_a_clean_error():
    with pytest.raises(UnreadableMeritFile, match="could not be read"):
        _frame("empty.csv", b"")


def test_fake_spreadsheet_is_a_clean_error():
    with pytest.raises(UnreadableMeritFile, match="could not be read"):
        _frame("fake.xlsx", b"not really excel")


def test_zero_width_range_does_not_crash():
    raw = (
        b"employee_id,base_salary,merit_increase_pct,performance_rating,range_min,range_max\n"
        b"E1,80000,0.03,3,80000,80000\n"
        b"E2,120000,0.04,4,80000,100000\n"
    )
    result = run_checks(_frame("ranges.csv", raw))
    assert result["row_count"] == 2
    assert "range_penetration" in [issue["code"] for issue in result["issues"]]
