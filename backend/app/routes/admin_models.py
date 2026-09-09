"""Model admin routes — MASTER_BUILD_PLAN_v3.md §5 PHASE E, E6-E8, E11.

    POST /admin/models/upload   -- manual trigger, runs the E3 gate (via
                                    validate_model_package.import_package),
                                    returns the E4 report either way (200,
                                    never a 500 for a malformed package).
    GET  /admin/models/status   -- what's loaded, per configured exercise.

`build_model_registry()` is also called from app.main's lifespan (E8) so a
missing model degrades that exercise to `analysis_unavailable` instead of
crashing startup -- see main.py.

TODO (I10, report_builder.py owner): `known_wording` is passed as None below
because report_builder.py's patient-wording dictionary (E-DEC.4) does not
exist yet. E3 check 13 is therefore SKIPPED at import time -- see
validate_model_package.py's docstring on `known_wording=None`. Wire the real
dictionary in here once I10 exists, or unworded labels can reach a report.
"""
from __future__ import annotations

import json
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Request, UploadFile

from ml import validate_model_package as vmp

router = APIRouter()

TRAINED_MODELS_ROOT = Path(
    os.environ.get(
        "TRAINED_MODELS_ROOT",
        Path(__file__).resolve().parents[2] / "ml" / "trained_models",
    )
)

# Bookkeeping file this module writes after a successful import, alongside
# the four E1 files -- NOT part of the E1 contract itself (validate_package
# ignores it), just how this route remembers is_tree_based/data_sources/
# imported_at across process restarts without re-parsing the original zip.
_META_FILENAME = "_import_meta.json"


def _empty_entry(reason: str) -> dict:
    return {
        "loaded": False,
        "analysis_unavailable": True,
        "reason": reason,
        "is_tree_based": None,
        "imported_at": None,
        "data_sources": None,
    }


def _loaded_entry(meta: dict) -> dict:
    return {
        "loaded": True,
        "analysis_unavailable": False,
        "reason": None,
        "is_tree_based": meta.get("is_tree_based"),
        "imported_at": meta.get("imported_at"),
        "data_sources": meta.get("data_sources"),
    }


def build_model_registry(exercise_names, root: Path = TRAINED_MODELS_ROOT) -> dict:
    """E8: scans `root` for each configured exercise. An exercise with no
    imported model (or an incomplete one) is marked `analysis_unavailable`
    with a reason -- never a crash. Read at startup and refreshed in memory
    by the upload route on every successful import."""
    registry = {}
    for name in exercise_names:
        ex_dir = root / name
        missing = [f for f in vmp.REQUIRED_FILES if not (ex_dir / f).exists()]
        if missing:
            registry[name] = _empty_entry(
                f"no trained model imported for exercise {name!r} "
                f"(missing {missing if ex_dir.is_dir() else vmp.REQUIRED_FILES}) "
                f"-- live rule-based feedback is unaffected, only post-session "
                f"prediction is disabled"
            )
            continue
        meta_path = ex_dir / _META_FILENAME
        meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
        registry[name] = _loaded_entry(meta)
    return registry


@router.post("/admin/models/upload")
async def upload_model_package(request: Request, file: UploadFile):
    """Manual trigger only -- nothing watches the filesystem (E6). Always
    200: a rejected package is an expected outcome the uploader can act on,
    not a server fault."""
    tmp_dir = TRAINED_MODELS_ROOT / "_uploads"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"upload_{datetime.now(timezone.utc).timestamp()}.zip"
    tmp_path.write_bytes(await file.read())

    known_exercises = list(request.app.state.exercise_registry.keys())
    # known_wording=None: see module docstring TODO -- report_builder.py
    # (I10) doesn't exist yet, so E3 check 13 is skipped for now.
    report = vmp.import_package(
        tmp_path, TRAINED_MODELS_ROOT,
        known_exercises=known_exercises, known_wording=None,
    )

    if report.ok:
        # Pull is_tree_based/data_sources back out of the uploaded zip to
        # persist as this route's own bookkeeping (see _META_FILENAME) --
        # import_package's ValidationReport intentionally carries no card
        # fields, only per-exercise pass/fail (that contract is pinned by
        # ml/test_validate_model_package.py).
        with zipfile.ZipFile(tmp_path) as z:
            card = json.loads(z.read("model_card.json"))
        imported_at = datetime.now(timezone.utc).isoformat()
        for name, result in report.exercises.items():
            if not result.get("ok"):
                continue
            meta = {
                "is_tree_based": card["is_tree_based"],
                "data_sources": card["data_sources"],
                "sklearn_version": card["sklearn_version"],
                "imported_at": imported_at,
            }
            (TRAINED_MODELS_ROOT / name / _META_FILENAME).write_text(json.dumps(meta))
            request.app.state.model_registry[name] = _loaded_entry(meta)
        request.app.state.last_model_import = imported_at

    tmp_path.unlink(missing_ok=True)

    return {
        "ok": report.ok,
        "errors": report.errors,
        "warnings": report.warnings,
        "exercises": report.exercises,
    }


@router.get("/admin/models/status")
async def model_status(request: Request):
    """E7: which exercises have a loaded model, is_tree_based per exercise,
    and the timestamp of the last successful import."""
    return {
        "exercises": request.app.state.model_registry,
        "last_import": getattr(request.app.state, "last_model_import", None),
    }
