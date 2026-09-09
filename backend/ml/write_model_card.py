#!/usr/bin/env python3
"""
write_model_card.py — E14

New file. Reads the joblib bundles produced by export_model.py and the
per-label CV table produced by train_model.py (passed in as a CSV this
script does not generate itself — train_model.py prints to stdout; this
script's caller is expected to have captured that into a CSV, or this
script can be pointed at the manifest_data/ directory to recompute the
same GroupKFold numbers via train_model.evaluate for the exercises that
got exported).

Writes trained_models/model_card.json: training date, CV scores per label,
and an explicit, plainly-stated caveats list. Ships alongside the model.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

from train_model import MIN_GROUPS, choose_grouping, evaluate, split_frame

GLOBAL_CAVEATS = [
    "Model v1 is pose-only. No paired pose+EMG training data exists yet "
    "(see MASTER_BUILD_PLAN_v3.md §9 'Known gaps'). EMG stays a live "
    "display and a rep-validity pre-filter joined on timestamp_ms -- never "
    "a fused model feature -- until paired data lands.",
    "Every recording in this dataset shares a single subject_id (one actor). "
    "GroupKFold below is therefore recording-level, not subject-level. "
    "Nothing here estimates cross-patient generalization.",
    "Dataset is small (11-64 clips per exercise). RandomForest is "
    "deliberately shallow (max_depth=4) and XGBoost deliberately "
    "regularized for this reason; both still risk coincidental splits.",
    "Rep segmentation for live sessions is unbuilt (I3). This model was "
    "trained on hand-cut clips; production gets continuous video.",
    "Isometric exercises (seated_knee_extension) have no trained error "
    "model that clears the CV gate -- all positives concentrate in one "
    "recording group. Rule-based only until more recordings exist.",
    "See docs/06_ml_pipeline.md for the full E8 label-circularity audit. "
    "Two labels (mini_squat's derivative of path_deviation, and "
    "straight_leg_raise's knee_flexion_high) were found to be thresholded "
    "directly from a feature-derived signal; treat any near-1.000 score "
    "on those labels as evidence of leakage, not of quality.",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("modeldir", type=Path, help="directory of *_<kind>.pkl bundles from export_model.py")
    ap.add_argument("--datadir", type=Path, required=True, help="manifest_data/ for recomputing CV numbers")
    ap.add_argument("-o", "--out", type=Path, default=None)
    args = ap.parse_args()

    bundles = sorted(args.modeldir.glob("*.pkl"))
    if not bundles:
        raise SystemExit(f"no .pkl bundles in {args.modeldir}")

    card = {
        "training_date": datetime.now(timezone.utc).isoformat(),
        "exercises": {},
        "caveats": list(GLOBAL_CAVEATS),
    }

    for b in bundles:
        bundle = joblib.load(b)
        ex = bundle["exercise"]
        kind = bundle["model_kind"]

        data_path = args.datadir / f"train_{ex}.parquet"
        cv_table = None
        if data_path.exists():
            df = pd.read_parquet(data_path)
            X, y = split_frame(df)
            X = X.fillna(X.median(numeric_only=True)).fillna(0)
            groups, group_source = choose_grouping(df)
            if groups.nunique() >= MIN_GROUPS and y.shape[1] > 0:
                res, k = evaluate(X, y, groups, kind)
                cv_table = res.to_dict(orient="records")

        card["exercises"][f"{ex}_{kind}"] = {
            "model_kind": kind,
            "labels": bundle["labels"],
            "n_clips_final_fit": bundle["n_clips_final_fit"],
            "n_groups": bundle["n_groups"],
            "group_source": bundle["group_source"],
            "sklearn_version": bundle["sklearn_version"],
            "trained_at": bundle["trained_at"],
            "cv_scores_per_label": cv_table,
            "model_path": str(b),
        }

    out = args.out or (args.modeldir / "model_card.json")
    out.write_text(json.dumps(card, indent=2))
    print(f"[OK] wrote {out}")


if __name__ == "__main__":
    main()
