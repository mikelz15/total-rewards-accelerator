"""Boot the API from the last known-good entrypoint and mount Muse."""

from __future__ import annotations

import urllib.request

_GOOD = (
    "https://raw.githubusercontent.com/mikelz15/total-rewards-accelerator/"
    "23a5a81684f0d6cfd15f503e7e1d8a58d1ffb5c9/api/app/main.py"
)


def _load() -> str:
    req = urllib.request.Request(_GOOD, headers={"User-Agent": "tra-boot"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        code = resp.read().decode("utf-8")
    needle = "from app.routers.saas import team as saas_team\n"
    insert = needle + "from app.routers import muse as muse_router\n"
    if needle not in code:
        raise RuntimeError("could not patch muse import")
    code = code.replace(needle, insert, 1)
    needle = "app.include_router(saas_admin.router)\n"
    insert = needle + "app.include_router(muse_router.router)\n"
    code = code.replace(needle, insert, 1)
    needle = '    if path.startswith("/api/v1"):\n'
    insert = '    if path.startswith("/api/v1") or path.startswith("/v1"):\n'
    code = code.replace(needle, insert, 1)
    return code


exec(compile(_load(), __file__, "exec"), globals())
