"""PHASE K — K1/K2 static checks. No Docker daemon required.

    ../venv/bin/python tools/test_k_compose.py

K1 and K2 are contract checks on files, so they run in the normal suite:
docker-compose.yml declares the three services, and the backend reaches the
EMG service by its compose hostname rather than by localhost.

The §7 K gate (Docker end to end, 3 concurrent sessions) needs a running
daemon and lives in tools/test_k_gate.py, run explicitly.

WHY K2 IS TESTED THIS WAY. `emg_client.EMG_SERVICE_URL` is a module-level
constant bound as the default argument of three functions. A default argument
is evaluated once at import, so setting the environment after import changes
nothing -- the exact defect PROJECT-STATUS records for FLUSH_INTERVAL_S. And
inside Docker the failure is silent in the worst way: the circuit breaker
catches ConnectError, `/api/emg/status` answers 200 with
{"capture_running": false, "error": "Service unavailable"}, and a healthy
looking backend simply never sees EMG. So this file checks the value is read
from the environment IN A FRESH INTERPRETER, and that compose actually sets it
to the service hostname.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import yaml

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
PY = REPO / "venv" / "bin" / "python"
COMPOSE = REPO / "docker-compose.yml"

# The three services K1 requires, by the names K2's hostname check depends on.
BACKEND_SVC = "backend"
EMG_SVC = "emg-service"
FRONTEND_SVC = "frontend"


def _load_compose() -> dict:
    assert COMPOSE.exists(), (
        f"{COMPOSE} does not exist -- K1 has not been built"
    )
    doc = yaml.safe_load(COMPOSE.read_text())
    assert isinstance(doc, dict), f"{COMPOSE} did not parse to a mapping"
    return doc


def _services(doc: dict) -> dict:
    svcs = doc.get("services")
    assert isinstance(svcs, dict) and svcs, "docker-compose.yml declares no services"
    return svcs


def _published_ports(svc: dict) -> set:
    """Host-side ports published by a service, as ints.

    Handles both the short string form ("8000:8000", "127.0.0.1:8000:8000")
    and the long mapping form ({published: 8000, target: 8000}).
    """
    out = set()
    for p in svc.get("ports", []) or []:
        if isinstance(p, dict):
            if p.get("published") is not None:
                out.add(int(p["published"]))
            continue
        parts = str(p).split(":")
        if len(parts) == 1:
            continue  # container-only port, not published to the host
        out.add(int(parts[-2]))
    return out


def test_k1_compose_declares_backend_emg_and_frontend():
    """K1 -- docker-compose.yml: backend, emg-service, frontend."""
    doc = _load_compose()
    svcs = _services(doc)

    for name in (BACKEND_SVC, EMG_SVC, FRONTEND_SVC):
        assert name in svcs, (
            f"docker-compose.yml has no {name!r} service. Found: {sorted(svcs)}. "
            "K1 names all three; the frontend is not optional -- a compose file "
            "that only runs the two backends still needs a human to serve the "
            "pages, which is not 'full flow through Docker' (K3)."
        )
        svc = svcs[name] or {}
        assert svc.get("build") or svc.get("image"), (
            f"service {name!r} has neither build nor image -- it cannot start"
        )

    # K3 and K4 drive the stack over the host network, and the browser talks to
    # the backend from the host too. Ports have to be published, not merely
    # exposed.
    assert 8000 in _published_ports(svcs[BACKEND_SVC]), (
        "backend does not publish port 8000 to the host; "
        f"published: {sorted(_published_ports(svcs[BACKEND_SVC]))}"
    )
    assert _published_ports(svcs[FRONTEND_SVC]), (
        "frontend publishes no host port, so the pages are unreachable"
    )

    # network_mode: host would make the compose hostnames in K2 resolve by
    # accident of the dev machine rather than by compose DNS, and it does not
    # work on macOS at all. Rule it out here rather than discovering it when
    # someone else runs K3.
    for name in (BACKEND_SVC, EMG_SVC, FRONTEND_SVC):
        assert (svcs[name] or {}).get("network_mode") != "host", (
            f"service {name!r} uses network_mode: host -- K2's compose hostname "
            "resolution would be bypassed"
        )
    print(f"  K1 OK -- services {sorted(svcs)}")


def test_k2_emg_url_is_read_from_the_environment():
    """K2 -- emg_client resolves its base URL from the environment.

    Fresh interpreter on purpose: a value bound at import time is exactly what
    this must prove works, and re-importing inside this process would not.
    """
    probe = (
        "import json;"
        "from app.services.emg_client import EMG_SERVICE_URL as u,"
        " get_live_emg_reading as f;"
        "import inspect;"
        "print(json.dumps({'url': u,"
        " 'default': inspect.signature(f).parameters['base_url'].default}))"
    )

    env = dict(os.environ, EMG_SERVICE_URL="http://emg-service:5000")
    r = subprocess.run([str(PY), "-c", probe], cwd=str(BACKEND),
                       capture_output=True, text=True, env=env)
    assert r.returncode == 0, f"importing emg_client failed:\n{r.stdout}\n{r.stderr}"
    got = json.loads(r.stdout.strip().splitlines()[-1])
    assert got["url"] == "http://emg-service:5000", (
        f"EMG_SERVICE_URL is {got['url']!r} with EMG_SERVICE_URL set in the "
        "environment -- the constant is hardcoded, so the compose hostname "
        "never reaches httpx and every EMG call fails into the circuit breaker"
    )
    assert got["default"] == "http://emg-service:5000", (
        f"get_live_emg_reading's base_url default is {got['default']!r}, not the "
        "environment value. The default argument is bound at import; if it does "
        "not track EMG_SERVICE_URL then main.py's callers -- which pass no "
        "base_url -- still hit the old address."
    )

    # Unset environment keeps the documented local default, so nothing outside
    # Docker changes behaviour.
    env2 = {k: v for k, v in os.environ.items() if k != "EMG_SERVICE_URL"}
    r2 = subprocess.run([str(PY), "-c", probe], cwd=str(BACKEND),
                        capture_output=True, text=True, env=env2)
    assert r2.returncode == 0, f"{r2.stdout}\n{r2.stderr}"
    got2 = json.loads(r2.stdout.strip().splitlines()[-1])
    assert "localhost" in got2["url"] or "127.0.0.1" in got2["url"], (
        f"with no EMG_SERVICE_URL set the default is {got2['url']!r} -- running "
        "the backend outside Docker must still reach the local Flask service"
    )
    print(f"  K2 OK -- env-driven ({got['url']}), local default {got2['url']}")


def test_k2_compose_points_the_backend_at_the_emg_hostname():
    """K2 -- compose sets that variable to the EMG service's compose hostname.

    localhost inside a container is the container itself, so a backend left on
    the local default reaches nothing and says so only through a breaker that
    is designed to stay quiet.
    """
    svcs = _services(_load_compose())
    env = (svcs[BACKEND_SVC] or {}).get("environment")

    if isinstance(env, list):
        env = dict(item.split("=", 1) for item in env if "=" in item)
    assert isinstance(env, dict) and "EMG_SERVICE_URL" in env, (
        "the backend service sets no EMG_SERVICE_URL, so it falls back to "
        "localhost:5000 inside its own container and can never reach Flask"
    )
    url = str(env["EMG_SERVICE_URL"])
    assert "localhost" not in url and "127.0.0.1" not in url, (
        f"backend EMG_SERVICE_URL is {url!r} -- inside a container that address "
        "is the backend itself, not the EMG service"
    )
    assert EMG_SVC in url, (
        f"backend EMG_SERVICE_URL is {url!r}, which does not name the {EMG_SVC!r} "
        "service, so compose DNS will not resolve it"
    )
    print(f"  K2 OK -- backend -> {url}")


if __name__ == "__main__":
    test_k1_compose_declares_backend_emg_and_frontend()
    test_k2_emg_url_is_read_from_the_environment()
    test_k2_compose_points_the_backend_at_the_emg_hostname()
    print("K1/K2 static checks passed")
