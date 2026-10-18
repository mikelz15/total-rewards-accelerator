"""Muse /v1/clean refuses a blank file with 400. It does not 500."""

import unittest

from fastapi import HTTPException

from app.routers.muse import CleanRequest, dataframe_for_clean


class MuseCleanTests(unittest.TestCase):
    def test_blank_paste_is_400(self) -> None:
        for text in ("", "   ", "\n\n"):
            with self.assertRaises(HTTPException) as caught:
                dataframe_for_clean(CleanRequest(csv_text=text))
            self.assertEqual(caught.exception.status_code, 400)

    def test_missing_body_is_400(self) -> None:
        with self.assertRaises(HTTPException) as caught:
            dataframe_for_clean(CleanRequest())
        self.assertEqual(caught.exception.status_code, 400)
        self.assertIn("csv_text", caught.exception.detail)

    def test_sample_shape_parses(self) -> None:
        text = "EE#,Employee Name,Annual Salary\n1,Alex Rivera,120000\n"
        frame = dataframe_for_clean(CleanRequest(csv_text=text))
        self.assertEqual(len(frame), 1)
        self.assertEqual(frame.iloc[0]["EE#"], "1")


if __name__ == "__main__":
    unittest.main()
