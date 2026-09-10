"""app package.

Loads the shared environment BEFORE any submodule imports, because
app/auth.py (JWT_SECRET) and app/db.py (MONGO_URI) both fail loudly at
import time when those are missing -- by design, so a deployment can never
silently run with no database or a public fallback secret.

Under docker compose the values arrive via `env_file:` and nothing here
does anything. Running uvicorn straight from the host has no such
injection, so this reads the same file compose does:

    part2/Hemophillia-confirm/backend/.env

That file is the single source of truth for MONGO_URI, JWT_SECRET and
GEMINI_API_KEY. JWT_SECRET in particular MUST match theirs -- we verify
tokens they issue and never mint our own (D2) -- so copying it into a
second .env of our own would be a value to keep in sync forever, and a
second place to leak it from. We read theirs instead.

Real environment variables always win: this never overwrites a value that
is already set, so `MONGO_DB=hemophilia_g2test ... python app/routes/test_x.py`
still points the tests at a scratch database.

Override the file with BACKEND_ENV_FILE=/path/to/.env.
"""
import os
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_ENV = _REPO_ROOT / "part2" / "Hemophillia-confirm" / "backend" / ".env"


def _load_env(path: Path) -> None:
    """Minimal KEY=VALUE reader. Deliberately not python-dotenv: this runs at
    package import, before anything else, and a hard dependency there turns a
    missing package into an import-time crash in every entrypoint including
    the tests."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        # An already-set variable wins -- compose, CI and per-command
        # overrides must not be clobbered by a file on disk.
        if not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        os.environ[key] = value


_load_env(Path(os.environ.get("BACKEND_ENV_FILE", _DEFAULT_ENV)))
