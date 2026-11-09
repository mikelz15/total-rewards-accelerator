"""An unhandled 500 must still carry CORS headers, and a failed run save must not fail the run."""

from __future__ import annotations

import uuid
from contextlib import contextmanager

from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.routers.saas import analysis


@app.get("/__test_boom")
def _boom():  # pragma: no cover - exercised through the client
    raise RuntimeError("boom")


def test_unhandled_500_has_cors_header():
    client = TestClient(app, raise_server_exceptions=False)
    res = client.get("/__test_boom", headers={"Origin": "https://totalrewardsaccelerator.com"})
    assert res.status_code == 500
    assert res.json() == {"detail": "Internal server error"}
    assert res.headers.get("access-control-allow-origin") in (
        "*",
        "https://totalrewardsaccelerator.com",
    )


class _RefusingSession:
    """Session stub whose flush fails the way the kind CHECK does."""

    def __init__(self):
        self.added = []
        self.rolled_back = False

    @contextmanager
    def begin_nested(self):
        try:
            yield
        except Exception:
            self.rolled_back = True
            raise

    def add(self, obj):
        self.added.append(obj)

    def flush(self):
        raise IntegrityError("INSERT", {}, Exception("violates check constraint analysis_runs_kind_check"))


class _OkSession(_RefusingSession):
    def flush(self):
        for obj in self.added:
            obj.id = uuid.uuid4()


def _save(session):
    return analysis._save_run(
        session,
        org_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        kind="philosophy",
        dataset_id=None,
        params={},
        result={},
    )


def test_save_run_refused_returns_none():
    s = _RefusingSession()
    assert _save(s) is None
    assert s.rolled_back


def test_save_run_ok_returns_id():
    rid = _save(_OkSession())
    assert rid and uuid.UUID(rid)
