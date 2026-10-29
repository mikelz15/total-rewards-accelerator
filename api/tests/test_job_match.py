"""Job Match stays on the Rewards seat and reuses the survey-match distance."""

import unittest

from app.services.entitlements import effective_modules
from app.services.job_match import match_to_external, sample_catalog, sample_internal, slim_match


class JobMatchTests(unittest.TestCase):
    def test_same_level_ranks_above_a_grade_off_and_a_different_family_drops(self) -> None:
        result = match_to_external(sample_internal(), sample_catalog())
        titled = [row for row in result["matches"] if row["title"]]
        self.assertEqual(len(titled), 3)
        self.assertEqual(titled[0]["credit"], "full")
        self.assertEqual(titled[0]["code"], "TRA-Comp-Partner")
        self.assertTrue(all(row["credit"] in {"full", "half"} for row in titled))
        self.assertNotIn("TRA-Nurse-Mgr", [row["code"] for row in titled])
        self.assertGreater(result["overall_match"], 0)
        self.assertTrue(result["can_confirm"])

    def test_a_different_family_is_not_a_match(self) -> None:
        result = match_to_external(
            {"title": "Compensation Partner", "family": "compensation", "level": 4, "duties": ["ranges"]},
            [{"title": "Nurse Manager", "family": "nursing", "level": 4, "duties": ["unit"]}],
        )
        self.assertFalse(any(row.get("title") for row in result["matches"]))
        self.assertFalse(result["can_confirm"])
        self.assertEqual(result["overall_match"], 0)

    def test_ledger_row_drops_the_description(self) -> None:
        result = match_to_external(sample_internal(), sample_catalog())
        stored = slim_match(result["matches"][0])
        self.assertNotIn("description", stored)
        self.assertNotIn("duties", stored)
        self.assertEqual(stored["credit"], "full")

    def test_rewards_seat_on_cleaner_includes_it_and_talent_does_not(self) -> None:
        self.assertIn("job_match", effective_modules("suite", "member"))
        self.assertIn(
            "job_match",
            effective_modules("cleaner", "owner", entitlement_override=["cleaner"]),
        )
        self.assertNotIn("job_match", effective_modules("trial", "ta"))
        self.assertNotIn("job_match", effective_modules("trial", "hrbp"))
        self.assertNotIn("job_match", effective_modules("trial", "executive"))
        self.assertNotIn(
            "job_match",
            effective_modules("tracker", "member", entitlement_override=["tracker"]),
        )
        self.assertIn(
            "job_match",
            effective_modules("suite", "member", entitlement_override=["tracker", "closer"]),
        )


if __name__ == "__main__":
    unittest.main()
