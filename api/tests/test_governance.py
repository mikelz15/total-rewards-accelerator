"""Governance library: Connecticut is in force, and a file only sees its places."""

import unittest
from datetime import date

from app.services.governance import _bucket, library, load_pack, places_in_text


class GovernanceTests(unittest.TestCase):
    def test_connecticut_card_is_in_force(self) -> None:
        pack = load_pack()
        ct = next(rule for rule in pack["rules"] if rule["id"] == "us-ct-hb5003-posting")
        self.assertEqual(pack["version"], "0.1.1")
        self.assertEqual(ct["status"], "in_force")
        self.assertEqual(ct["severity"], "material")
        self.assertEqual(ct["effective_on"], "2026-10-01")
        de = next(rule for rule in pack["rules"] if rule["id"] == "us-de-hb105-2027")
        self.assertEqual(de["severity"], "watch")

    def test_connecticut_file_on_the_effective_date(self) -> None:
        result = library([{"location": "Hartford, CT"}], date(2026, 10, 17))
        current = {card["id"] for card in result["current"]}
        future = {card["id"] for card in result["future"]}
        self.assertIn("us-ct-hb5003-posting", current)
        self.assertIn("us-federal-flsa-wage", current)
        self.assertNotIn("us-de-hb105-2027", future)
        self.assertNotIn("us-de-hb105-2027", current)
        ct = next(card for card in result["current"] if card["id"] == "us-ct-hb5003-posting")
        self.assertTrue(ct["chip"])
        flsa = next(card for card in result["current"] if card["id"] == "us-federal-flsa-wage")
        self.assertFalse(flsa["chip"])
        self.assertNotIn("us-co-epewa-posting", current)

    def test_delaware_stays_future_and_does_not_chip(self) -> None:
        result = library([{"location": "Delaware"}], date(2026, 10, 17))
        de = next(card for card in result["future"] if card["id"] == "us-de-hb105-2027")
        self.assertFalse(de["chip"])
        self.assertNotIn(
            "us-ct-hb5003-posting",
            {card["id"] for card in result["current"]},
        )

    def test_connecticut_was_still_ahead_in_september(self) -> None:
        result = library([{"state": "CT"}], date(2026, 9, 1))
        future = {card["id"] for card in result["future"]}
        current = {card["id"] for card in result["current"]}
        self.assertIn("us-ct-hb5003-posting", future)
        self.assertNotIn("us-ct-hb5003-posting", current)

    def test_no_place_hides_the_national_pack(self) -> None:
        result = library(
            [{"Employee Name": "Jane Doe", "Annual Salary": "92000"}],
            date(2026, 10, 17),
        )
        self.assertEqual(result["empty_reason"], "no_places")
        self.assertEqual(result["current"], [])
        self.assertEqual(result["future"], [])
        self.assertEqual(result["past"], [])
        self.assertFalse(result["includes_federal"])

    def test_lowercase_in_is_not_indiana(self) -> None:
        self.assertEqual(places_in_text("in the office"), set())
        self.assertEqual(places_in_text("Denver, CO"), {"us-co"})
        self.assertEqual(places_in_text("California"), {"us-ca"})
        self.assertEqual(places_in_text("West Virginia"), {"us-wv"})
        self.assertEqual(places_in_text("Washington, DC"), {"us-dc"})

    def test_ended_rule_is_past(self) -> None:
        self.assertEqual(
            _bucket(
                {"effective_on": "2020-01-01", "sunset_on": "2024-01-01"},
                date(2026, 10, 17),
            ),
            "past",
        )
        result = library([{"location": "CO"}], date(2026, 10, 17))
        self.assertEqual(result["past"], [])
