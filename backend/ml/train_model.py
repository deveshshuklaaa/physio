#!/usr/bin/env python3
"""
train_model.py — E10/E11 (Phase E, offline ML pipeline)

Reuse note: ported from /home/billa-dakait/Desktop/test/code/train_models.py,
which already implemented GroupKFold, multi-label (one binary head per
error), the MIN_GROUPS=4 skip, and precision/recall/F1/support (never
accuracy) almost exactly as the plan specifies. Changes made here, and why:

1. Group key: the source script grouped on `source_recording_id` only. The
   plan requires subject_id primary, source_recording_id fallback. This
   dataset has exactly one subject_id (1.0) for every exercise (verified:
   `manifest.csv["subject_id"].nunique()` == 1 everywhere) so subject-level
   CV is definitionally impossible here — grouping by subject_id would put
   every clip in one group and fail MIN_GROUPS for all five exercises. The
   code below still checks subject_id first and only falls back to
   source_recording_id when subject_id doesn't provide >=4 groups, so the
   preference order in the plan is honored and takes effect automatically
   once a multi-subject dataset lands.
2. Model comparison: the source script trained ONE of {rf, xgb} per run,
   selected by a CLI flag. E10 asks for "RF vs XGB on identical folds" as a
   single report. This version runs both against the same GroupKFold splits
   (same fold assignment, both models see identical train/test rows) and
   prints both tables side by side.
3. Everything else (RandomForest/XGBoost hyperparameters sized for ~40 rows,
   not 24k; `class_weight="balanced"`; per-label OOF prediction; never
   accuracy) is unchanged from the source.

Usage:
    python train_model.py manifest_data/
"""

import argparse
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupKFold
from sklearn.metrics import precision_recall_fscore_support

warnings.filterwarnings("ignore")

META = {"source_recording_id", "subject_id"}
SEED = 42

# below this many groups, cross-validation cannot produce a meaningful estimate (E11)
MIN_GROUPS = 4


def make_model(kind: str):
    if kind == "rf":
        return RandomForestClassifier(
            n_estimators=300,
            max_depth=4,          # sized for ~40 rows, not 24k
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=SEED,
            n_jobs=-1,
        )
    if kind == "xgb":
        from xgboost import XGBClassifier
        return XGBClassifier(
            n_estimators=200,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=SEED,
            eval_metric="logloss",
        )
    raise ValueError(kind)


def split_frame(df: pd.DataFrame):
    """
    Separate the frame into features, labels and grouping key.

    BUG FIXED vs the source script: the source picked labels by
    `df[c].dropna().isin([0, 1]).all()` — "binary-valued column == label".
    That heuristic also matches binary-valued ENGINEERED FEATURES that
    aggregate_features.py produced (e.g. `squat_too_shallow__max`,
    `path_deviation_error__range` — per-row 0/1 flags computed inside the
    exercise-specific label editors, then min/max/mean/etc aggregated like
    any other numeric column, see E8 audit in docs/06_ml_pipeline.md). Those
    columns are frequently all-0/1 but are FEATURES, not the label being
    predicted, and some clips have them as NaN (no frame flagged) which
    crashed sklearn's fit() with "Input y contains NaN". True labels, as
    written by aggregate_features.py, are the bare manifest column names
    (e.g. `heel_lifting`) with no aggregation suffix; every engineered
    feature column carries a `__min`/`__max`/`__mean`/`__std`/`__range`/
    `__first`/`__last` suffix. Selecting on "no double-underscore suffix"
    instead of "binary-valued" is the correct, unambiguous rule.
    """
    labels = [c for c in df.columns
              if "__" not in c and c not in META
              and df[c].dropna().isin([0, 1]).all()]
    feats = [c for c in df.columns if c not in labels and c not in META]
    return df[feats], df[labels]


def choose_grouping(df: pd.DataFrame):
    """
    Plan: subject_id primary, source_recording_id secondary. Use subject_id
    only if it actually yields >= MIN_GROUPS distinct groups; otherwise fall
    back to source_recording_id and say so.
    """
    if "subject_id" in df.columns and df["subject_id"].nunique() >= MIN_GROUPS:
        return df["subject_id"], "subject_id"
    return df["source_recording_id"], "source_recording_id (subject_id had "\
        f"{df['subject_id'].nunique() if 'subject_id' in df.columns else 'no'} group(s), below MIN_GROUPS={MIN_GROUPS})"


def evaluate(X, y, groups, kind):
    """Out-of-fold predictions for every label, via GroupKFold."""
    n_groups = groups.nunique()
    k = min(5, n_groups)
    gkf = GroupKFold(n_splits=k)

    oof = pd.DataFrame(0, index=y.index, columns=y.columns)

    for tr, te in gkf.split(X, groups=groups):
        for lab in y.columns:
            ytr = y[lab].iloc[tr]
            if ytr.nunique() < 2:
                continue  # this fold saw only one class; leave prediction at 0
            m = make_model(kind)
            m.fit(X.iloc[tr], ytr)
            oof.loc[y.index[te], lab] = m.predict(X.iloc[te])

    rows = []
    for lab in y.columns:
        p, r, f, _ = precision_recall_fscore_support(
            y[lab], oof[lab], average="binary", zero_division=0
        )
        rows.append({
            "label": lab,
            "support": int(y[lab].sum()),
            "precision": round(p, 3),
            "recall": round(r, 3),
            "f1": round(f, 3),
        })
    return pd.DataFrame(rows), k


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("datadir", type=Path)
    ap.add_argument("--models", nargs="+", choices=["rf", "xgb"], default=["rf", "xgb"])
    args = ap.parse_args()

    files = sorted(args.datadir.glob("train_*.parquet"))
    if not files:
        raise SystemExit(f"no train_*.parquet in {args.datadir}")

    macro = []
    all_results = {}
    for f in files:
        ex = f.stem.replace("train_", "")
        df = pd.read_parquet(f)
        X, y = split_frame(df)
        X = X.fillna(X.median(numeric_only=True)).fillna(0)
        groups, group_source = choose_grouping(df)

        n_groups = groups.nunique()
        header = f"=== {ex}: {len(df)} clips, {n_groups} groups (grouped by {group_source}), {X.shape[1]} features"

        if n_groups < MIN_GROUPS:
            print(header)
            print(f"  SKIPPED — only {n_groups} recording groups. Cross-validation "
                  f"here would report a number, not an estimate. Collect more "
                  f"recordings before training this exercise.\n")
            continue

        if y.shape[1] == 0:
            print(header)
            print("  SKIPPED — no usable label columns in this feature table.\n")
            continue

        print(header)
        for kind in args.models:
            res, k = evaluate(X, y, groups, kind)
            print(f"  --- model={kind}, GroupKFold k={k} ---")
            print(res.to_string(index=False))
            mf1 = res["f1"].mean() if len(res) else float("nan")
            print(f"  macro-F1 ({kind}): {mf1:.3f}")
            if len(res) and res["support"].min() < 8:
                print(f"  note: smallest label has {res['support'].min()} positives — "
                      f"its F1 swings on one or two clips")
            macro.append({"exercise": ex, "model": kind, "macro_f1": round(mf1, 3), "k": k, "groups": n_groups})
            all_results[(ex, kind)] = res
        print()

    if macro:
        print("== summary (RF vs XGB, identical folds per exercise) ==")
        print(pd.DataFrame(macro).to_string(index=False))

    return all_results, macro


if __name__ == "__main__":
    main()
