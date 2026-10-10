"""Philosophy Check on the sample file and a file that matches the claims."""

import math
import unittest

from app.services.philosophy_check import check_philosophy


class PhilosophyCheckTests(unittest.TestCase):
    def test_sample_market_claim_fails(self) -> None:
        result = check_philosophy()
        self.assertTrue(result["demo"])
        self.assertEqual(result["usable"], 20)
        self.assertAlmostEqual(result["scores"]["median_ratio"], 0.8858, places=3)
        self.assertEqual(result["scores"]["outside_band"], 11)
        market = next(c for c in result["claims"] if c["id"] == "market")
        self.assertEqual(market["status"], "not_aligned")
        performance = next(c for c in result["claims"] if c["id"] == "performance")
        self.assertIn(performance["status"], {"aligned", "not_aligned"})
        self.assertIsNotNone(result["scores"]["rating_coef"])
        self.assertIsNotNone(result["scores"]["residual_variance"])

    def test_constructed_file_aligns_market_and_rating(self) -> None:
        ratings = [3.0, 3.5, 4.0, 4.5]
        mids = [80000, 100000, 120000, 140000]
        records = []
        for i in range(16):
            rating = ratings[i % 4]
            mid = mids[(i // 4) % 4]
            pay = mid * math.exp(0.06 * (rating - 3.75))
            records.append(
                {
                    "name": f"P{i}",
                    "department": "Engineering" if i % 2 == 0 else "Nursing",
                    "base": pay,
                    "range_mid": mid,
                    "rating": rating,
                    "hire_date": "01/15/2020",
                }
            )
        result = check_philosophy(records, demo=False)
        self.assertFalse(result["demo"])
        market = next(c for c in result["claims"] if c["id"] == "market")
        performance = next(c for c in result["claims"] if c["id"] == "performance")
        department = next(c for c in result["claims"] if c["id"] == "department")
        self.assertEqual(market["status"], "aligned")
        self.assertEqual(performance["status"], "aligned")
        self.assertGreater(result["scores"]["rating_coef"], 0.04)
        self.assertLess(result["scores"]["rating_coef"], 0.08)
        self.assertEqual(department["status"], "aligned")

    def test_company_can_move_the_bands(self) -> None:
        wide = check_philosophy(market_low=0.80, market_high=1.10, dept_log_cap=0.05)
        market = next(c for c in wide["claims"] if c["id"] == "market")
        department = next(c for c in wide["claims"] if c["id"] == "department")
        self.assertEqual(market["status"], "aligned")
        self.assertEqual(department["status"], "not_aligned")
        self.assertAlmostEqual(wide["scores"]["target_low"], 0.80)
        self.assertAlmostEqual(wide["scores"]["department_cap"], 0.05)

    def test_cleaned_dataset_columns(self) -> None:
        records = []
        for i in range(8):
            records.append(
                {
                    "employee_id": str(100 + i),
                    "name": f"N{i}",
                    "job_title": "Analyst",
                    "department": "Engineering" if i < 4 else "Nursing",
                    "base_salary": 100000 + i * 1000,
                    "range_mid": 100000,
                    "performance": 3.0 + (i % 4) * 0.4,
                    "hire_date": "2019-01-15",
                }
            )
        result = check_philosophy(records, demo=False)
        self.assertFalse(result["demo"])
        self.assertEqual(result["usable"], 8)
        self.assertEqual(result["people"][0]["id"], "100")


if __name__ == "__main__":
    unittest.main()
