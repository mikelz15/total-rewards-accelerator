"""Signed-in routes use `with get_session()`. That requires a context manager."""

import unittest

from app.db.session import get_session


class SessionContextTests(unittest.TestCase):
    def test_get_session_is_a_context_manager(self) -> None:
        session = get_session()
        self.assertTrue(hasattr(session, "__enter__"))
        self.assertTrue(hasattr(session, "__exit__"))
        # Do not enter. Entering opens the database.
        close = getattr(session, "close", None)
        if close is not None:
            close()
