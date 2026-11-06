"""A seat needs a license, and the license has a clock."""

import unittest
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.routers.saas.team import InviteBody, create_invite
from app.services.seat_license import (
    CUSTOMER_SEAT_CLOSED,
    TRIAL_DAYS,
    license_is_open,
    new_trial_until,
    seat_window_open,
    trial_passage_open,
)


class SeatLicenseTests(unittest.TestCase):
    def test_window_is_half_open(self) -> None:
        start = datetime(2026, 11, 1, tzinfo=timezone.utc)
        end = datetime(2026, 12, 1, tzinfo=timezone.utc)
        self.assertTrue(seat_window_open(start, end, start))
        self.assertTrue(seat_window_open(start, end, end - timedelta(seconds=1)))
        self.assertFalse(seat_window_open(start, end, end))
        self.assertFalse(seat_window_open(start, end, start - timedelta(seconds=1)))

    def test_a_used_license_is_not_open(self) -> None:
        start = datetime(2026, 11, 1, tzinfo=timezone.utc)
        end = datetime(2026, 12, 1, tzinfo=timezone.utc)
        now = datetime(2026, 11, 5, tzinfo=timezone.utc)
        self.assertTrue(license_is_open(start, end, None, now))
        self.assertFalse(license_is_open(start, end, "already-seated", now))

    def test_trial_clock_closes_and_a_paid_plan_does_not_use_it(self) -> None:
        now = datetime(2026, 11, 5, tzinfo=timezone.utc)
        until = now + timedelta(days=1)
        self.assertTrue(trial_passage_open("trial", until, now))
        self.assertFalse(trial_passage_open("trial", now, now))
        self.assertTrue(trial_passage_open("trial", None, now))
        self.assertTrue(trial_passage_open("suite", now, now))
        self.assertEqual(TRIAL_DAYS, 30)
        self.assertEqual(new_trial_until(now), now + timedelta(days=30))

    def test_customer_invite_is_refused(self) -> None:
        with self.assertRaises(HTTPException) as caught:
            create_invite(InviteBody(email="a@example.com", role="member"), user=None)
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.detail, CUSTOMER_SEAT_CLOSED)


if __name__ == "__main__":
    unittest.main()
