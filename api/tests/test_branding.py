"""Org branding paths stay inside the org's own Storage folder."""

import unittest
import uuid

from app.services.branding import valid_brand_path


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


if __name__ == "__main__":
    unittest.main()
