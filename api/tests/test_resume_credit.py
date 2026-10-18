"""Resume credit ledger. Dates are fixed. No survey file is read."""

import unittest
from datetime import date
from pathlib import Path

from app.services.placement import place_person
from app.services.resume_credit import parse_resume, tally_jobs, tally_text

SAMPLE = Path(__file__).resolve().parents[1] / "app" / "data" / "sample_resume.txt"
AS_OF = date(2026, 10, 18)


class ResumeCreditTests(unittest.TestCase):
    def test_full_five_years(self) -> None:
        result = tally_jobs(
            [{"title": "Partner", "start": "2018-01", "end": "2022-12", "credit": "full"}]
        )
        self.assertEqual(result["jobs"][0]["calendar_months"], 60)
        self.assertEqual(result["credited_years"], 5.0)
        self.assertTrue(result["can_confirm"])

    def test_half_is_half_the_span(self) -> None:
        result = tally_jobs(
            [{"title": "Analyst", "start": "2018-01", "end": "2022-12", "credit": "half"}]
        )
        self.assertEqual(result["credited_years"], 2.5)

    def test_none_adds_calendar_and_no_credit(self) -> None:
        result = tally_jobs(
            [
                {"title": "Partner", "start": "2018-01", "end": "2018-12", "credit": "full"},
                {"title": "Recruiter", "start": "2016-01", "end": "2016-12", "credit": "none"},
            ]
        )
        self.assertEqual(result["calendar_years"], 2.0)
        self.assertEqual(result["credited_years"], 1.0)
        self.assertEqual(result["jobs"][1]["credited_years"], 0.0)

    def test_overlap_keeps_the_higher_credit(self) -> None:
        result = tally_jobs(
            [
                {"title": "Partner", "start": "2018-01", "end": "2018-12", "credit": "full"},
                {"title": "Analyst", "start": "2018-01", "end": "2018-12", "credit": "half"},
            ]
        )
        self.assertEqual(result["credited_years"], 1.0)
        self.assertEqual(result["jobs"][1]["dropped_months"], 12)
        self.assertEqual(result["jobs"][0]["dropped_months"], 0)

    def test_present_uses_the_as_of_month(self) -> None:
        result = tally_jobs(
            [{"title": "Partner", "start": "2026-01", "end": "present", "credit": "full"}],
            as_of=AS_OF,
        )
        self.assertEqual(result["jobs"][0]["calendar_months"], 10)
        self.assertEqual(result["credited_years"], round(10 / 12, 2))

    def test_unreadable_date_does_not_invent_years(self) -> None:
        result = tally_jobs(
            [{"title": "Partner", "start": "sometime", "end": "2018-12", "credit": "full"}]
        )
        self.assertFalse(result["jobs"][0]["readable"])
        self.assertEqual(result["credited_years"], 0.0)
        self.assertFalse(result["can_confirm"])

    def test_credited_years_are_not_halved_again(self) -> None:
        result = tally_jobs(
            [{"title": "Analyst", "start": "2010-01", "end": "2022-12", "credit": "half"}]
        )
        self.assertEqual(result["calendar_years"], 13.0)
        self.assertEqual(result["credited_years"], 6.5)
        kwargs = dict(
            base_salary=140000,
            range_min=100000,
            range_mid=150000,
            range_max=200000,
            education="Bachelors",
            required_education="Bachelors",
        )
        confirmed = place_person(years_experience=result["credited_years"], related_fraction=1.0, **kwargs)
        typed = place_person(years_experience=6.5, **kwargs)
        halved_again = place_person(
            years_experience=result["credited_years"], related_fraction=0.5, **kwargs
        )
        self.assertEqual(confirmed["experience_credit_years"], typed["experience_credit_years"])
        self.assertEqual(confirmed["experience_credit_years"], 6.5)
        self.assertEqual(halved_again["experience_credit_years"], 3.25)

    def test_sample_resume_fixture(self) -> None:
        text = SAMPLE.read_text(encoding="utf-8")
        parsed = parse_resume(text, as_of=AS_OF)
        self.assertEqual(len(parsed["jobs"]), 4)
        self.assertEqual(parsed["education"], "Masters")
        result = tally_text(
            text,
            as_of=AS_OF,
            target_title="Compensation Partner",
        )
        credits = [job["credit"] for job in result["jobs"]]
        self.assertEqual(credits, ["full", "half", "none", "full"])
        self.assertEqual(result["jobs"][3]["dropped_months"], 6)
        self.assertEqual(result["credited_years"], 6.0)
        self.assertEqual(result["calendar_years"], 9.0)
        self.assertTrue(result["can_confirm"])
        self.assertEqual(result["education"], "Masters")


if __name__ == "__main__":
    unittest.main()
