#!/usr/bin/env python3
"""
export_model.py — E13 (Phase E, offline ML pipeline)

New file — no equivalent existed in test/code. Final-fit-on-all-data export,
one joblib bundle per exercise, for exercises that clear E11's MIN_GROUPS
gate and have at least one usable label.

Bundle contents (per exercise), exactly as required by the plan:
    feature_names   - ordered list; inference must build the row in this
                       exact order, never rely on dict/column ordering.
    impute_median   - TRAINING medians (this file's `X.median()`), computed
                       ONCE here on the full training table. NEVER recompute
                       from an inference clip's own data — that would leak
                       the inference clip's own statistics into its own
                       imputation and silently change behavior clip to clip.
    labels          - ordered list of label column names, one classifier
                       per label (multi-label, not multi-class).
    models          - dict[label] -> fitted classifier.
    model_kind      - "rf" or "xgb" (whichever the caller selected).
    sklearn_version - `sklearn.__version__` at export time, for compat checks
                       when loading later.
    trained_at      - ISO timestamp.

This is a POOL-SAFE final fit: unlike train_model.py's GroupKFold loop
(cross-validation, many partial fits, used only for the metrics report),
this file fits each label's classifier exactly once, on every available
row, because a final shipped model should use all the data it has. The CV
numbers from train_model.py are the estimate of how that final model will
generalize; this script does not re-estimate anything.
"""

from __future__ import annotations

import argparse
import sklearn
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

from train_model import META, MIN_GROUPS, choose_grouping, make_model, split_frame


def export_exercise(path: Path, outdir: Path, model_kind: str) -> dict | None:
    ex = path.stem.replace("train_", "")
    df = pd.read_parquet(path)
    X, y = split_frame(df)
    groups, group_source = choose_grouping(df)
    n_groups = groups.nunique()

    if n_groups < MIN_GROUPS:
        print(f"[SKIP] {ex}: {n_groups} groups (grouped by {group_source}) < MIN_GROUPS={MIN_GROUPS}. "
              f"Not exporting — see E11.")
        return None

    if y.shape[1] == 0:
        print(f"[SKIP] {ex}: no usable label columns.")
        return None

    median = X.median(numeric_only=True)
    Xf = X.fillna(median).fillna(0)

    models = {}
    for lab in y.columns:
        yl = y[lab]
        if yl.nunique() < 2:
            print(f"  [SKIP LABEL] {ex}/{lab}: only one class present in the full dataset, "
                  f"cannot fit a classifier.")
            continue
        m = make_model(model_kind)
        m.fit(Xf, yl)
        models[lab] = m

    if not models:
        print(f"[SKIP] {ex}: no label had both classes present.")
        return None

    bundle = {
        "exercise": ex,
        "feature_names": list(Xf.columns),
        "impute_median": median.to_dict(),
        "labels": list(models.keys()),
        "models": models,
        "model_kind": model_kind,
        "sklearn_version": sklearn.__version__,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_clips_final_fit": int(len(Xf)),
        "n_groups": int(n_groups),
        "group_source": group_source,
    }

    outdir.mkdir(parents=True, exist_ok=True)
    dest = outdir / f"{ex}_{model_kind}.pkl"
    joblib.dump(bundle, dest)
    print(f"[OK] {ex}: exported {len(models)} label model(s) -> {dest}")
    return bundle


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("datadir", type=Path)
    ap.add_argument("-o", "--outdir", type=Path, default=Path(__file__).with_name("trained_models"))
    ap.add_argument("--model", choices=["rf", "xgb"], default="rf")
    args = ap.parse_args()

    files = sorted(args.datadir.glob("train_*.parquet"))
    if not files:
        raise SystemExit(f"no train_*.parquet in {args.datadir}")

    for f in files:
        export_exercise(f, args.outdir, args.model)


if __name__ == "__main__":
    main()
