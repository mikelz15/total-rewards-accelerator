"""An owner does not add a second license once a plan is set."""

import unittest

from app.services.entitlements import owner_may_add_license


class LicenseGateTests(unittest.TestCase):
    def test_first_license_stays_open(self) -> None:
        self.assertTrue(owner_may_add_license(None))
        self.assertTrue(owner_may_add_license("trial"))
        self.assertTrue(owner_may_add_license("Trial"))
        self.assertTrue(owner_may_add_license("demo"))
        self.assertTrue(owner_may_add_license("none"))

    def test_a_set_plan_does_not_take_another(self) -> None:
        for plan in (
            "suite",
            "cleaner",
            "equity",
            "tracker",
            "closer",
            "starter",
            "pilot",
            "ta_pack",
            "cleaner_equity",
            "custom",
        ):
            self.assertFalse(owner_may_add_license(plan), plan)


if __name__ == "__main__":
    unittest.main()
