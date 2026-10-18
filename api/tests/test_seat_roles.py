"""HRBP and executive are seats, not new engines."""

import unittest

from app.services.entitlements import (
    can_manage_billing,
    can_manage_team,
    can_write,
    effective_modules,
    normalize_role,
    permission_payload,
)


class SeatRoleTests(unittest.TestCase):
    def test_hrbp_places_one_person_and_can_read_the_group(self) -> None:
        modules = effective_modules("trial", "hrbp")
        self.assertEqual(modules, {"closer", "equity"})
        self.assertTrue(can_write("hrbp"))
        self.assertFalse(can_manage_team("hrbp"))
        self.assertFalse(can_manage_billing("hrbp"))

    def test_executive_is_a_read(self) -> None:
        modules = effective_modules("trial", "executive")
        self.assertEqual(modules, {"cleaner", "equity", "tracker", "closer"})
        self.assertFalse(can_write("executive"))
        self.assertFalse(can_manage_team("executive"))
        self.assertFalse(can_manage_billing("executive"))
        payload = permission_payload("suite", "executive")
        self.assertEqual(payload["role"], "executive")
        self.assertFalse(payload["can_write"])

    def test_unknown_role_does_not_become_hrbp(self) -> None:
        self.assertEqual(normalize_role("wizard"), "member")
        self.assertEqual(normalize_role("HRBP"), "hrbp")
        self.assertEqual(normalize_role("Executive"), "executive")

    def test_recruiter_seat_is_unchanged(self) -> None:
        self.assertEqual(effective_modules("trial", "ta"), {"tracker", "closer"})
        self.assertTrue(can_write("ta"))


if __name__ == "__main__":
    unittest.main()
