"""The signed-in resume tally serves Tracker and Closer seats alike.

The tally widget is embedded on the Candidate Tracker screen, so a
tracker-only org must pass the gate. A closer-only org keeps working, an
org with neither module is refused, and the public tally stays ungated.
"""

import unittest

from fastapi import HTTPException

from app.db.models import Organization
from app.routers.resume_credit import (
    TallyIn,
    public_router,
    resume_credit_sample,
    resume_credit_tally,
    saas_router,
)
from app.services.access import require_any_module

GATE = ["closer", "tracker"]


def make_org(plan: str, *, suspended: bool = False, override=None) -> Organization:
    return Organization(
        name="Test org",
        slug=f"test-{plan}",
        plan=plan,
        suspended=suspended,
        entitlements_json=override,
    )


class ResumeCreditAccessTests(unittest.TestCase):
    def test_tracker_only_is_allowed(self) -> None:
        require_any_module(make_org("tracker"), "owner", GATE)
        require_any_module(make_org("tracker"), "member", GATE)

    def test_closer_only_is_allowed(self) -> None:
        require_any_module(make_org("closer"), "owner", GATE)
        require_any_module(make_org("closer"), "member", GATE)

    def test_ta_pack_seat_still_allowed(self) -> None:
        require_any_module(make_org("ta_pack"), "ta", GATE)

    def test_neither_module_is_refused_as_upgrade(self) -> None:
        for plan in ("cleaner", "equity", "none"):
            with self.assertRaises(HTTPException) as caught:
                require_any_module(make_org(plan), "owner", GATE)
            self.assertEqual(caught.exception.status_code, 402)
            self.assertEqual(caught.exception.detail["code"], "upgrade_required")
            # The denial names the first gate module, as the old closer-only
            # gate did, so the error a neither-module user sees is unchanged.
            self.assertEqual(caught.exception.detail["module"], "closer")

    def test_suspended_org_is_refused_even_with_both_modules(self) -> None:
        with self.assertRaises(HTTPException) as caught:
            require_any_module(make_org("suite", suspended=True), "owner", GATE)
        self.assertEqual(caught.exception.status_code, 403)

    def test_entitlement_override_is_respected(self) -> None:
        require_any_module(make_org("suite", override=["tracker"]), "owner", GATE)
        with self.assertRaises(HTTPException) as caught:
            require_any_module(make_org("suite", override=["cleaner"]), "owner", GATE)
        self.assertEqual(caught.exception.status_code, 402)


class PublicResumeCreditTests(unittest.TestCase):
    def test_public_tally_runs_without_any_gate(self) -> None:
        result = resume_credit_tally(
            TallyIn(
                jobs=[
                    {
                        "title": "Partner",
                        "start": "2018-01",
                        "end": "2022-12",
                        "credit": "full",
                    }
                ]
            )
        )
        self.assertEqual(result["credited_years"], 5.0)

    def test_public_sample_runs_without_any_gate(self) -> None:
        result = resume_credit_sample()
        self.assertEqual(result["source"], "sample")
        self.assertTrue(result["can_confirm"])

    def test_routes_are_where_the_clients_expect(self) -> None:
        public_paths = {route.path for route in public_router.routes}
        self.assertIn("/api/resume-credit/sample", public_paths)
        self.assertIn("/api/resume-credit/tally", public_paths)
        self.assertIn("/api/resume-credit/upload", public_paths)
        saas_paths = {route.path for route in saas_router.routes}
        self.assertIn("/api/v1/resume-credit/sample", saas_paths)
        self.assertIn("/api/v1/resume-credit/tally", saas_paths)


if __name__ == "__main__":
    unittest.main()
