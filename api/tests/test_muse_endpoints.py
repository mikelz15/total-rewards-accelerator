"""Expanded Muse /v1 endpoint tests.

Covers place, audit, fund, closer, brief, PHI rejection, blocked /act,
and basic auth failures. Uses in-memory job store; no network.
"""

import base64
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

    def test_clean_records_body(self) -> None:
        payload = {
            "records": [
                {
                    "EE#": "1",
                    "Employee Name": "Alex Rivera",
                    "Annual Salary": 120000,
                    "Years Experience": 6,
                    "Education": "Masters",
                }
            ]
        }
        r = self.client.post("/v1/clean", json=payload, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["job_id"].startswith("job_"))
        self.assertEqual(body["rows_kept"], 1)
        self.assertFalse(body["truncated"])

    def test_clean_truncates_over_500_rows(self) -> None:
        records = [
            {"EE#": str(i), "Employee Name": f"Person {i}", "Annual Salary": 80000 + i}
            for i in range(501)
        ]
        r = self.client.post("/v1/clean", json={"records": records}, headers=self.headers)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["truncated"])
        self.assertLessEqual(body["rows_kept"], 500)
        self.assertIsNotNone(body["rows_kept"])

    def test_closer_pdf_is_base64_pdf(self) -> None:
        r = self.client.post(
            "/v1/closer",
            json={"base": 120000, "bonus_pct": 15, "lti": 20000, "want_pdf": True},
            headers=self.headers,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertFalse(body["sent"])
        self.assertIn("pdf_base64", body)
        raw = base64.b64decode(body["pdf_base64"], validate=True)
        self.assertTrue(raw.startswith(b"%PDF"))

    def test_verbs_beyond_me_require_key(self) -> None:
        verbs = [
            ("/v1/clean", {"csv_text": "EE#,Annual Salary\n1,120000\n"}),
            ("/v1/place", {"job_id": "job_x"}),
            ("/v1/audit", {"job_id": "job_x"}),
            ("/v1/fund", {"job_id": "job_x", "pool_dollars": 1}),
            ("/v1/closer", {"base": 120000, "want_pdf": False}),
            ("/v1/brief", {"job_id": "job_x"}),
        ]
        for path, payload in verbs:
            missing = self.client.post(path, json=payload)
            self.assertEqual(missing.status_code, 401, msg=f"{path} missing key")
            invalid = self.client.post(path, json=payload, headers={"Authorization": "Bearer wrong"})
            self.assertEqual(invalid.status_code, 401, msg=f"{path} invalid key")

    def test_act_does_not_call_require_key(self) -> None:
        """Document actual behavior: /act never calls require_key.

        Missing or invalid Authorization still returns 403 (not 401).
        The route is hard-blocked and has no side effects either way.
        """
        missing = self.client.post("/v1/act")
        self.assertEqual(missing.status_code, 403)
        invalid = self.client.post("/v1/act", headers={"Authorization": "Bearer wrong"})
        self.assertEqual(invalid.status_code, 403)
        valid = self.client.post("/v1/act", headers=self.headers)
        self.assertEqual(valid.status_code, 403)
        self.assertIn("propose", valid.json()["detail"].lower())

    def test_phi_on_records_does_not_echo_values(self) -> None:
        r = self.client.post(
            "/v1/clean",
            json={"records": [{"EE#": "1", "SSN": "123-45-6789", "Annual Salary": 120000}]},
            headers=self.headers,
        )
        self.assertEqual(r.status_code, 422)
        detail = r.json()["detail"]
        self.assertIn("sensitive", detail.lower())
        self.assertNotIn("123-45-6789", detail)

    def test_openapi_muse_routes_have_bearer_and_descriptions(self) -> None:
        spec = self.client.get("/openapi.json").json()
        paths = (
            "/v1/me",
            "/v1/clean",
            "/v1/place",
            "/v1/audit",
            "/v1/fund",
            "/v1/closer",
            "/v1/brief",
            "/v1/act",
        )
        for path in paths:
            self.assertIn(path, spec["paths"], msg=path)
            methods = spec["paths"][path]
            op = methods.get("get") or methods.get("post")
            self.assertEqual(op.get("tags"), ["muse"], msg=path)
            self.assertTrue(op.get("description") or op.get("summary"), msg=path)
        authenticated = [p for p in paths if p != "/v1/act"]
        for path in authenticated:
            op = spec["paths"][path].get("get") or spec["paths"][path].get("post")
            self.assertIn("401", op.get("responses", {}), msg=path)
        self.assertIn("403", spec["paths"]["/v1/act"]["post"].get("responses", {}))
        self.assertNotIn("401", spec["paths"]["/v1/act"]["post"].get("responses", {}))
        schemes = (spec.get("components") or {}).get("securitySchemes") or {}
        self.assertIn("MuseAPIKey", schemes)
        self.assertEqual(schemes["MuseAPIKey"].get("type"), "http")
        self.assertEqual(schemes["MuseAPIKey"].get("scheme"), "bearer")
        clean_desc = spec["paths"]["/v1/clean"]["post"].get("description") or ""
        self.assertIn("PHI", clean_desc)


if __name__ == "__main__":
    unittest.main()
