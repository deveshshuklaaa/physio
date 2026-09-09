"""PHASE E GATE — MASTER_BUILD_PLAN_v3.md §7.

    | E | A deliberately malformed zip is rejected with a specific, correct
    |   | reason; a valid zip imports and appears in GET /admin/models/status |

Run from backend/:  ../venv/bin/python tools/test_e_gate.py

Separate from the E1-E11 task tests on purpose: those check that each piece was
built, this checks the gate's two clauses end to end against a real uvicorn
process over real HTTP.

The load-bearing word in clause 1 is **specific**. A gate that rejects
everything -- including valid packages -- would pass a naive reading of
"malformed zip is rejected". So this asserts the reason NAMES the actual
defect, and that a valid package still gets through. PROJECT-STATUS §3 records
this repo being bitten twice by checks that existed but never really ran.
"""
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(BACKEND))

from test_h7_fake_client import serve          # reuse H7's real-server harness
from ml.test_validate_model_package import _build_zip, _card, _tmp, LABELS


def _upload(base, zip_path):
    import uuid
    boundary = uuid.uuid4().hex
    body = b"".join([
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="file"; filename="models.zip"\r\n',
        b"Content-Type: application/zip\r\n\r\n",
        Path(zip_path).read_bytes(),
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    req = urllib.request.Request(
        f"{base}/admin/models/upload", data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _status(base):
    with urllib.request.urlopen(f"{base}/admin/models/status", timeout=30) as r:
        return json.loads(r.read())


# The malformed cases, each with the word its rejection MUST contain.
MALFORMED = [
    ("missing model.joblib",  dict(omit=("mini_squat/model.joblib",)),      "model.joblib"),
    ("missing labels.json",   dict(omit=("mini_squat/labels.json",)),       "labels.json"),
    ("missing model_card",    dict(omit=("model_card.json",)),              "model_card"),
    ("wrong feature_hash",    dict(card=_card(["mini_squat"], feature_hash="0"*64)), "feature_hash"),
    ("bad data_sources",      dict(card=_card(["mini_squat"], data_sources=["telepathy"])), "data_sources"),
    ("non-canonical name",    dict(exercises=("seated_knee_extensions",)),  "seated_knee_extensions"),
]


def gate_phase_e():
    with serve() as (base, _tmpdir):

        # --- clause 1: malformed rejected, with a SPECIFIC reason -----------
        for name, kwargs, must_mention in MALFORMED:
            report = _upload(base, _build_zip(_tmp(), **kwargs))
            assert report.get("ok") is False, (
                f"malformed package '{name}' was ACCEPTED: {report}"
            )
            blob = json.dumps(report).lower()
            assert must_mention.lower() in blob, (
                f"'{name}' rejected, but the reason never mentions "
                f"{must_mention!r} -- an operator cannot act on this.\n{report}"
            )
            print(f"  rejected '{name}' -- names {must_mention!r}: OK")

        card = _card(["mini_squat"])
        del card["is_tree_based"]
        report = _upload(base, _build_zip(_tmp(), card=card))
        assert report.get("ok") is False and "is_tree_based" in json.dumps(report), (
            "a card missing is_tree_based was accepted -- I8's SHAP gate would "
            f"then silently have nothing to read: {report}"
        )
        print("  rejected 'missing is_tree_based' -- names the field: OK")
        print("clause 1 OK -- 7 malformed packages, each rejected by name")

        # --- clause 2: a valid zip imports AND shows up in status -----------
        before = _status(base)
        assert before["exercises"].get("mini_squat", {}).get("loaded") is not True, (
            "mini_squat already loaded before the gate imported it; "
            "this test cannot prove the import did anything"
        )

        report = _upload(base, _build_zip(_tmp(), exercises=("mini_squat",)))
        assert report.get("ok") is True, (
            f"a well-formed package was rejected -- the gate rejects everything, "
            f"which passes clause 1 for the wrong reason: {report}"
        )

        after = _status(base)
        entry = after["exercises"].get("mini_squat")
        assert entry, f"mini_squat absent from status after a successful import: {after}"
        assert entry.get("loaded") is True, f"import reported ok but status says not loaded: {entry}"
        assert entry.get("is_tree_based") is True, f"is_tree_based not surfaced: {entry}"
        assert entry.get("imported_at"), f"no import timestamp: {entry}"
        assert entry.get("analysis_unavailable") is not True, (
            f"freshly imported exercise still marked analysis_unavailable: {entry}"
        )
        print(f"  imported mini_squat -> loaded, tree-based, at {entry['imported_at']}")
        print("clause 2 OK -- valid package imports and appears in /admin/models/status")

    print("PHASE E GATE PASSED (specific rejection; valid import visible in status)")


def gate_e8_degrades_instead_of_crashing():
    """Supporting check. Not a §7 clause, but the difference between a usable
    app and an outage: three of six exercises have no model, and squat -- the
    only one with real thresholds -- is one of them."""
    with serve() as (base, _):
        status = _status(base)
        for name in ("squat", "heel_slide", "terminal_knee_extension"):
            entry = status["exercises"].get(name)
            assert entry, f"{name} missing from status"
            assert entry.get("analysis_unavailable") is True, (
                f"{name} has no model but is not marked analysis_unavailable: {entry}"
            )
            assert entry.get("reason"), f"{name} unavailable with no reason given"
        with urllib.request.urlopen(f"{base}/health", timeout=10) as r:
            assert json.loads(r.read())["status"] == "ok"
        print("  3 exercises without models -> analysis_unavailable, app healthy: OK")


if __name__ == "__main__":
    gate_e8_degrades_instead_of_crashing()
    gate_phase_e()
