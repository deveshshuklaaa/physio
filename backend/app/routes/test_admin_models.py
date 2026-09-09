"""E6, E7, E8, E11 — model admin routes and the startup registry. No framework.

Run from backend/:  ../venv/bin/python app/routes/test_admin_models.py

Contract:

    POST /admin/models/upload   multipart file=<models.zip>
        -> 200 with the E4 validation report (even on rejection -- a rejected
           package is a valid HTTP response carrying WHY, not a 500)
        Manual trigger only. Nothing watches the filesystem.

    GET  /admin/models/status
        -> {"exercises": {<name>: {"loaded": bool, "is_tree_based": bool|None,
                                   "analysis_unavailable": bool,
                                   "reason": str|None, "imported_at": str|None,
                                   "data_sources": [...]|None}},
            "last_import": str|None}

    app.state.model_registry     built at startup (E8)
    check_data_sources(card, available) -> (ok: bool, reason: str|None)   (E11)

E8 is the one that keeps the app alive: a missing model must degrade that
exercise to analysis_unavailable, never crash startup. Live rule feedback for
that exercise still works -- only post-session prediction is off.
"""
import io
import json
import sys
import tempfile
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient

from app.main import app
from ml import validate_model_package as vmp

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ml"))
from ml.test_validate_model_package import _build_zip, _card, _tmp, WORDING, LABELS


def _upload(client, zip_path):
    with open(zip_path, "rb") as fh:
        return client.post(
            "/admin/models/upload",
            files={"file": ("models.zip", fh, "application/zip")},
        )


# --- E6 ----------------------------------------------------------------------

def test_e6_upload_accepts_a_valid_package():
    with TestClient(app) as client:
        r = _upload(client, _build_zip(_tmp(), exercises=("mini_squat",)))
        assert r.status_code == 200, f"upload -> {r.status_code}: {r.text}"
        body = r.json()
        assert body.get("ok") is True, f"valid package reported not ok: {body}"
        assert "mini_squat" in body.get("exercises", {}), body
    print("E6 upload accepts a valid package: OK")


def test_e6_rejection_is_a_report_not_a_crash():
    """A malformed package is an expected input, not a server fault. It must
    come back as a readable report the uploader can act on."""
    with TestClient(app) as client:
        z = _build_zip(_tmp(), omit=("mini_squat/labels.json",))
        r = _upload(client, z)
        assert r.status_code == 200, (
            f"a malformed package produced {r.status_code}, expected a 200 "
            f"carrying the rejection report: {r.text}"
        )
        body = r.json()
        assert body.get("ok") is False, "malformed package reported ok"
        blob = json.dumps(body).lower()
        assert "labels.json" in blob, f"report does not name the missing file: {body}"
    print("E6 rejection returns a specific report: OK")


def test_e6_corrupt_upload_is_handled():
    with TestClient(app) as client:
        p = _tmp("bad.zip")
        p.write_bytes(b"definitely not a zip")
        r = _upload(client, p)
        assert r.status_code == 200, f"corrupt upload -> {r.status_code}: {r.text}"
        assert r.json().get("ok") is False
    print("E6 corrupt upload handled: OK")


# --- E7 ----------------------------------------------------------------------

def test_e7_status_lists_every_configured_exercise():
    """Count-agnostic, like F7. The status route must report on whatever the
    registry holds -- never a hardcoded list of three."""
    with TestClient(app) as client:
        r = client.get("/admin/models/status")
        assert r.status_code == 200, f"status -> {r.status_code}: {r.text}"
        body = r.json()
        assert "exercises" in body, body

        configured = set(app.state.exercise_registry.keys())
        reported = set(body["exercises"].keys())
        assert configured <= reported, (
            f"status omits configured exercises: {configured - reported}"
        )
    print("E7 status covers every configured exercise: OK")


def test_e7_status_reports_is_tree_based_after_import():
    """I8 gates SHAP on this flag, so it must be visible without opening the
    package by hand."""
    with TestClient(app) as client:
        _upload(client, _build_zip(_tmp(), exercises=("mini_squat",)))
        entry = client.get("/admin/models/status").json()["exercises"]["mini_squat"]
        assert entry.get("loaded") is True, entry
        assert entry.get("is_tree_based") is True, (
            f"is_tree_based not surfaced after import: {entry}"
        )
        assert entry.get("imported_at"), f"no import timestamp: {entry}"
    print("E7 status reports is_tree_based and import time: OK")


def test_e7_status_reports_data_sources():
    """E11 needs it, and an operator needs to know a model wants an IMU
    BEFORE a session is recorded without one."""
    with TestClient(app) as client:
        card = _card(["mini_squat"], data_sources=["pose", "imu"])
        _upload(client, _build_zip(_tmp(), card=card))
        entry = client.get("/admin/models/status").json()["exercises"]["mini_squat"]
        assert entry.get("data_sources") == ["pose", "imu"], entry
    print("E7 status reports data_sources: OK")


# --- E8 ----------------------------------------------------------------------

def test_e8_missing_model_does_not_crash_startup():
    """Three of six exercises have no model at all -- including squat, the
    only one with real thresholds. Startup must survive that."""
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        assert client.get("/exercises").status_code == 200
    print("E8 app starts with models missing: OK")


def test_e8_exercise_without_a_model_is_analysis_unavailable():
    with TestClient(app) as client:
        body = client.get("/admin/models/status").json()["exercises"]
        squat = body.get("squat")
        assert squat is not None, "squat missing from status entirely"
        assert squat.get("analysis_unavailable") is True, (
            f"an exercise with no model is not marked analysis_unavailable: {squat}"
        )
        assert squat.get("reason"), (
            "analysis_unavailable with no reason -- the operator cannot act on it"
        )
    print("E8 missing model -> analysis_unavailable with a reason: OK")


def test_e8_live_feedback_survives_a_missing_model():
    """The plan is explicit: only post-session prediction is disabled. Live
    rule-based feedback for that exercise still works, so GET /exercises must
    keep serving its thresholds."""
    with TestClient(app) as client:
        exercises = client.get("/exercises").json()["exercises"]
        squat = next((e for e in exercises if e["name"] == "squat"), None)
        assert squat is not None, "squat vanished from /exercises"
        assert squat.get("thresholds"), (
            "squat lost its thresholds -- live feedback would silently stop"
        )
    print("E8 live feedback unaffected by a missing model: OK")


# --- E11 ---------------------------------------------------------------------

def test_e11_missing_declared_source_blocks_scoring():
    card = _card(["mini_squat"], data_sources=["pose", "imu"])
    ok, reason = vmp.check_data_sources(card, available=["pose"])
    assert ok is False, "a session without a declared source was allowed to score"
    assert reason and "imu" in reason.lower(), (
        f"reason does not name the missing source: {reason!r}"
    )
    print("E11 missing source blocks scoring, names it: OK")


def test_e11_present_sources_allow_scoring():
    card = _card(["mini_squat"], data_sources=["pose"])
    ok, reason = vmp.check_data_sources(card, available=["pose", "emg"])
    assert ok is True, f"scoring blocked despite sources present: {reason}"
    print("E11 satisfied sources allow scoring: OK")


def test_e11_absent_sensor_is_never_imputed():
    """E-DEC.2, and the reason it matters: the IMU's whole value is being an
    INDEPENDENT check on the camera. A value imputed from training medians
    agrees with the camera by construction, manufacturing exactly the false
    confidence M8 exists to detect. Declining to score is the honest answer.
    """
    card = _card(["mini_squat"], data_sources=["pose", "imu"])
    ok, reason = vmp.check_data_sources(card, available=["pose"])
    assert ok is False
    blob = (reason or "").lower()
    for forbidden in ("impute", "median", "default"):
        assert forbidden not in blob, (
            f"the missing-source path mentions {forbidden!r} -- an absent "
            f"sensor must be declined, never filled in: {reason!r}"
        )
    print("E11 absent sensor declined, not imputed: OK")


if __name__ == "__main__":
    test_e6_upload_accepts_a_valid_package()
    test_e6_rejection_is_a_report_not_a_crash()
    test_e6_corrupt_upload_is_handled()
    test_e7_status_lists_every_configured_exercise()
    test_e7_status_reports_is_tree_based_after_import()
    test_e7_status_reports_data_sources()
    test_e8_missing_model_does_not_crash_startup()
    test_e8_exercise_without_a_model_is_analysis_unavailable()
    test_e8_live_feedback_survives_a_missing_model()
    test_e11_missing_declared_source_blocks_scoring()
    test_e11_present_sources_allow_scoring()
    test_e11_absent_sensor_is_never_imputed()
    print("ALL E6/E7/E8/E11 ADMIN ROUTE CHECKS PASSED")
