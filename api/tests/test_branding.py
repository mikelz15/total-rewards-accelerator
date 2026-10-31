"""Org branding paths stay inside the org's own Storage folder."""

import unittest
import uuid
from contextlib import contextmanager
from types import SimpleNamespace
from unittest import mock

from app.services.branding import set_brand_image_path, valid_brand_path


class BrandPathTests(unittest.TestCase):
    def setUp(self) -> None:
        self.org = uuid.UUID("11111111-2222-3333-4444-555555555555")

    def test_own_folder_image_is_valid(self) -> None:
        for ext in ("png", "jpg", "jpeg", "svg", "webp", "PNG"):
            self.assertTrue(valid_brand_path(self.org, f"{self.org}/logo-1730000000.{ext}"))

    def test_other_org_folder_is_rejected(self) -> None:
        other = uuid.uuid4()
        self.assertFalse(valid_brand_path(self.org, f"{other}/logo.png"))

    def test_nesting_traversal_and_types_are_rejected(self) -> None:
        self.assertFalse(valid_brand_path(self.org, f"{self.org}/a/logo.png"))
        self.assertFalse(valid_brand_path(self.org, f"{self.org}/../x/logo.png"))
        self.assertFalse(valid_brand_path(self.org, f"{self.org}/logo.gif"))
        self.assertFalse(valid_brand_path(self.org, f"{self.org}/logo.png.html"))
        self.assertFalse(valid_brand_path(self.org, "logo.png"))


class _StubResult:
    def scalar(self):
        return None


class _StubSession:
    """Records execute() calls instead of touching a database."""

    def __init__(self) -> None:
        self.calls = []

    def execute(self, clause, params=None):
        self.calls.append((str(clause), params or {}))
        return _StubResult()

    def flush(self) -> None:
        pass

    def updates(self):
        return [(c, p) for c, p in self.calls if "UPDATE organizations" in c]


class BrandImageWriteTests(unittest.TestCase):
    """set_brand_image_path is the stored half of Save and Remove."""

    def setUp(self) -> None:
        self.org = uuid.UUID("11111111-2222-3333-4444-555555555555")

    def test_set_stores_the_path(self) -> None:
        session = _StubSession()
        path = f"{self.org}/logo-1730000000.png"
        set_brand_image_path(session, self.org, path)
        updates = session.updates()
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0][1].get("path"), path)
        self.assertEqual(updates[0][1].get("id"), self.org)

    def test_none_clears_the_stored_path(self) -> None:
        session = _StubSession()
        set_brand_image_path(session, self.org, None)
        updates = session.updates()
        self.assertEqual(len(updates), 1)
        self.assertIsNone(updates[0][1].get("path"))


class BrandingRouterWriteTests(unittest.TestCase):
    """PUT /branding end to end at the router seam: null clears, a path sets.

    Regression cover for the Remove image no-op: the API half must store the
    cleared value so the header stays on the TRA mark after a reload.
    """

    ORG = uuid.UUID("59792955-0ad7-4a76-99cc-5116e9c0c24c")
    OLD_PATH = f"{ORG}/logo-1793405281680.png"

    def _run(self, body_path):
        from app.routers.saas import branding as router

        session = _StubSession()

        @contextmanager
        def fake_get_session():
            yield session

        ctx = SimpleNamespace(
            org=SimpleNamespace(id=self.ORG, suspended=False),
            membership=SimpleNamespace(role="owner"),
        )
        with (
            mock.patch.object(router, "get_session", fake_get_session),
            mock.patch.object(router, "ensure_user_org", lambda s, u: ctx),
            mock.patch.object(router, "branding_available", lambda s: True),
            mock.patch.object(router, "get_brand_image_path", lambda s, oid: self.OLD_PATH),
        ):
            result = router.update_branding(
                router.BrandingBody(path=body_path), user=SimpleNamespace()
            )
        return result, session.updates()

    def test_remove_clears_and_reports_previous(self) -> None:
        result, updates = self._run(None)
        self.assertEqual(len(updates), 1)
        self.assertIsNone(updates[0][1].get("path"))
        self.assertIsNone(result["brand_image_path"])
        self.assertEqual(result["previous_path"], self.OLD_PATH)

    def test_set_stores_valid_path(self) -> None:
        new_path = f"{self.ORG}/logo-1793500000000.png"
        result, updates = self._run(new_path)
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0][1].get("path"), new_path)
        self.assertEqual(result["brand_image_path"], new_path)


if __name__ == "__main__":
    unittest.main()
