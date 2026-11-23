"""Expanded Muse /v1 endpoint tests.

Covers place, audit, fund, closer, brief, PHI rejection, blocked /act,
and basic auth failures. Uses in-memory job store; no network.
"""

import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.routers.muse import _JOBS, CleanRequest, dataframe_for_clean


class MuseEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer tra_test_review"}
        _JOBS.clear()

    def test_missing_key_is_401(self) -> None:
        r = self.client.get("/v1/me")
        self.assertEqual(r.status_code, 401)

    def test_invalid_key_is_401(self) -> None:
        r = self.client.get("/v1/me", headers={"Authorization": "Bearer wrong"})
        self.assertEqual(r.status_code, 401)

    def test_me_ok(self) -> None:
        r = self.client.get("/v1/me", headers=self.headers)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertFalse(body["writeback_enabled"])
        self.assertFalse(body["email_enabled"])
        self.assertIn("clean", body["capabilities"])

    def test_phi_header_rejected(self) -> None:
        text = "EE#,SSN,Annual Salary\n1,123-45-6789,120000\n"
        r = self.client.post("/v1/clean", json={"csv_text": text}, headers=self.headers)
        self.assertEqual(r.status_code, 422)
        self.assertIn("sensitive", r.json()["detail"].lower())

    def test_clean_then_place_audit_fund_brief(self) -> None:
        text = "EE#,Employee Name,Annual Salary,Years Experience,Education\n1,Alex Rivera,120000,6,Masters\n"
        r = self.client.post("/v1/clean", json={"csv_text": text}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        job_id = r.json()["job_id"]

        r = self.client.post("/v1/place", json={"job_id": job_id}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertIn("rows", r.json())

        r = self.client.post("/v1/audit", json={"job_id": job_id}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["requires_human_review"])

        r = self.client.post("/v1/fund", json={"job_id": job_id, "pool_dollars": 10000}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertIn("allocated", r.json())

        r = self.client.post("/v1/brief", json={"job_id": job_id, "audience": "CHRO"}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertIn("body", r.json())

    def test_closer_ok_and_send_blocked(self) -> None:
        r = self.client.post(
            "/v1/closer",
            json={"base": 120000, "bonus_pct": 15, "lti": 20000, "want_pdf": False},
            headers=self.headers,
        )
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()["sent"])

        r = self.client.post(
            "/v1/closer",
            json={"base": 120000, "send_to_candidate": True},
            headers=self.headers,
        )
        self.assertEqual(r.status_code, 403)

    def test_act_blocked(self) -> None:
        r = self.client.post("/v1/act", headers=self.headers)
        self.assertEqual(r.status_code, 403)

    def test_unknown_job_404(self) -> None:
        r = self.client.post("/v1/place", json={"job_id": "job_missing"}, headers=self.headers)
        self.assertEqual(r.status_code, 404)


if __name__ == "__main__":
    unittest.main()
