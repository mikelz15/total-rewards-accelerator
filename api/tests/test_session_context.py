"""Signed-in routes use `with get_session()`. That requires a context manager."""

import inspect
import unittest

from app.db.session import bind_rls, connect_args_for, get_session, use_ipv4_pooler


class SessionContextTests(unittest.TestCase):
    def test_get_session_is_a_context_manager(self) -> None:
        session = get_session()
        self.assertTrue(hasattr(session, "__enter__"))
        self.assertTrue(hasattr(session, "__exit__"))
        # Do not enter. Entering opens the database.
        close = getattr(session, "close", None)
        if close is not None:
            close()

    def test_pooler_disables_prepared_statements(self) -> None:
        pooler = "postgresql+psycopg://u@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        direct = "postgresql+psycopg://u@db.example.supabase.co:5432/postgres"
        self.assertEqual(connect_args_for(pooler), {"prepare_threshold": None})
        self.assertEqual(connect_args_for(direct), {})

    def test_direct_supabase_host_moves_to_the_ipv4_pooler(self) -> None:
        direct = "postgresql://postgres:secret@db.abc123.supabase.co:5432/postgres"
        pooled = use_ipv4_pooler(direct)
        self.assertIn("postgres.abc123:secret@", pooled)
        self.assertIn("aws-0-us-east-2.pooler.supabase.com:5432", pooled)
        self.assertNotIn("db.abc123.supabase.co", pooled)
        already = "postgresql://postgres.abc123:secret@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
        self.assertEqual(use_ipv4_pooler(already), already)

    def test_bind_rls_runs_when_called(self) -> None:
        # A contextmanager wrapper would not run until entered. Callers do not enter it.
        source = inspect.getsource(bind_rls)
        self.assertFalse(source.lstrip().startswith("@contextmanager"))
        self.assertIn("SET LOCAL ROLE tra_app", source)
