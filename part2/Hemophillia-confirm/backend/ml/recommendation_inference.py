#!/usr/bin/env python3

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import pandas as pd
from xgboost import XGBClassifier


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# NEW 5-EXERCISE KNEE ML MODEL
DEFAULT_MODEL_PATH = os.path.join(
    SCRIPT_DIR,
    "hemophilia_knee_exercise_model.json"
)

DEFAULT_PREPROCESSOR_PATH = os.path.join(
    SCRIPT_DIR,
    "hemophilia_knee_preprocessor.pkl"
)

DEFAULT_LABEL_ENCODER_PATH = os.path.join(
    SCRIPT_DIR,
    "hemophilia_knee_label_encoder.pkl"
)

DEFAULT_METADATA_PATH = os.path.join(
    SCRIPT_DIR,
    "hemophilia_knee_model_metadata.json"
)


MODEL_PATH = os.environ.get(
    "HEMOPHYSIO_MODEL_PATH",
    DEFAULT_MODEL_PATH
)

PREPROCESSOR_PATH = os.environ.get(
    "HEMOPHYSIO_PREPROCESSOR_PATH",
    DEFAULT_PREPROCESSOR_PATH
)

LABEL_ENCODER_PATH = os.environ.get(
    "HEMOPHYSIO_LABEL_ENCODER_PATH",
    DEFAULT_LABEL_ENCODER_PATH
)

META_PATH = os.environ.get(
    "HEMOPHYSIO_META_PATH",
    DEFAULT_METADATA_PATH
)


# ============================================================
# FEATURES USED BY THE NEW MODEL
# ============================================================

FEATURES = [
    "current_bleeding",
    "days_since_last_bleed_or_current_phase_day",
    "phase",
    "bleeding_pattern",
    "bleed_frequency",
    "affected_joint",
    "currently_undergoing_physiotherapy",
    "physiotherapy_location",
    "sessions_per_week",
    "session_duration",
    "current_treatment",
    "equipment_used",
    "physiotherapy_helping",
    "exercise_problem",
]


# ============================================================
# EXPECTED FIVE EXERCISES
# ============================================================

EXPECTED_EXERCISES = {
    "Heel slides",
    "Mini squats",
    "Seated knee extension",
    "Straight leg raise",
    "Terminal knee extension",
}


# ============================================================
# HELPERS
# ============================================================

def norm(value, default=""):
    if value is None:
        return default

    return str(value).strip()


def phase_from_days(days):
    """
    Map days to the phase labels used by the
    new knee exercise dataset.

    <= 20  -> REHAB_PHASE
    > 20   -> FUNCTIONAL_PHASE
    """

    try:
        d = int(float(days))
    except Exception:
        d = 30

    if d <= 20:
        return "REHAB_PHASE"

    return "FUNCTIONAL_PHASE"


# ============================================================
# DOSAGE
# ============================================================

def dosage():
    """
    Default dosage.

    Final dosage must be reviewed by the
    doctor/physiotherapist before activation.
    """

    return 2, "10-15"


def frequency(phase):

    return {
        "REHAB_PHASE": "5 times/week",
        "FUNCTIONAL_PHASE": "daily",
    }.get(
        phase,
        "as advised"
    )


# ============================================================
# SAFETY ENGINE
# ============================================================

def safety_engine(patient):

    current_bleeding = norm(
        patient.get("current_bleeding"),
        "no"
    ).lower()

    bleeding_type = norm(
        patient.get("bleeding_type"),
        ""
    ).lower()

    problem = norm(
        patient.get("exercise_problem"),
        "none"
    ).lower()

    swelling = norm(
        patient.get("swelling"),
        "no"
    ).lower()

    try:
        pain = float(
            patient.get("pain_level", 0) or 0
        )
    except Exception:
        pain = 0

    # --------------------------------------------------------
    # ACTIVE BLEEDING
    # --------------------------------------------------------

    if (
        current_bleeding in {
            "yes",
            "active",
            "joint_bleed",
            "muscle_bleed",
            "true",
            "1",
        }
        or bleeding_type in {
            "joint_bleed",
            "muscle_bleed",
        }
        or problem in {
            "new bleeding",
            "increased swelling",
        }
        or swelling == "increased"
    ):

        return {
            "status": "ACTIVE_BLEEDING",
            "allow_ml": False,
            "guidance": [
                "Stop exercise.",
                "Avoid unnecessary movement.",
                "Avoid weight-bearing on the affected area.",
                "Follow the patient's established clinical bleeding-management plan.",
                "Seek appropriate clinical guidance.",
            ],
        }

    # --------------------------------------------------------
    # CLINICAL REVIEW
    # --------------------------------------------------------

    if (
        bleeding_type in {
            "mucosal",
            "systemic",
        }
        or pain >= 7
    ):

        return {
            "status": "CLINICAL_REVIEW_REQUIRED",
            "allow_ml": False,
            "guidance": [
                "Exercise recommendation requires clinical review."
            ],
        }

    # --------------------------------------------------------
    # NON-KNEE JOINT
    # --------------------------------------------------------

    affected_joint = norm(
        patient.get("affected_joint"),
        "knee"
    ).lower()

    if affected_joint != "knee":

        return {
            "status": "NON_KNEE_JOINT",
            "allow_ml": False,
            "guidance": [
                "This ML model is trained only for knee exercises.",
                "A non-knee affected joint was provided.",
                "Use a clinically appropriate joint-specific pathway."
            ],
        }

    # --------------------------------------------------------
    # SAFE
    # --------------------------------------------------------

    return {
        "status": "SAFE_FOR_RECOMMENDATION",
        "allow_ml": True,
        "guidance": [],
    }


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    # --------------------------------------------------------
    # CHECK FILES
    # --------------------------------------------------------

    if not os.path.exists(MODEL_PATH):

        raise FileNotFoundError(
            "New knee exercise ML model not found:\n"
            f"{MODEL_PATH}\n\n"
            "Expected file:\n"
            "hemophilia_knee_exercise_model.json"
        )

    if not os.path.exists(PREPROCESSOR_PATH):

        raise FileNotFoundError(
            "Knee exercise preprocessor not found:\n"
            f"{PREPROCESSOR_PATH}\n\n"
            "Expected file:\n"
            "hemophilia_knee_preprocessor.pkl"
        )

    if not os.path.exists(LABEL_ENCODER_PATH):

        raise FileNotFoundError(
            "Label encoder not found:\n"
            f"{LABEL_ENCODER_PATH}\n\n"
            "Expected file:\n"
            "hemophilia_knee_label_encoder.pkl"
        )

    # --------------------------------------------------------
    # LOAD PREPROCESSOR
    # --------------------------------------------------------

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    # --------------------------------------------------------
    # LOAD LABEL ENCODER
    # --------------------------------------------------------

    label_encoder = joblib.load(
        LABEL_ENCODER_PATH
    )

    # --------------------------------------------------------
    # LOAD NATIVE XGBOOST JSON MODEL
    # --------------------------------------------------------

    model = XGBClassifier()

    model.load_model(
        MODEL_PATH
    )

    return model, preprocessor, label_encoder


# ============================================================
# LOAD METADATA
# ============================================================

def load_metadata():

    if not os.path.exists(META_PATH):
        return {}

    try:

        with open(
            META_PATH,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except Exception:

        return {}


# ============================================================
# RECOMMEND
# ============================================================

def recommend(
    patient,
    top_k=2
):

    # ========================================================
    # 1. SAFETY CHECK
    # ========================================================

    safety = safety_engine(
        patient
    )

    if not safety["allow_ml"]:

        return {
            "status": safety["status"],
            "source": "SAFETY_ENGINE",
            "recommendations": [],
            "guidance": safety["guidance"],
        }

    # ========================================================
    # 2. LOAD NEW MODEL
    # ========================================================

    model, preprocessor, label_encoder = load_model()

    metadata = load_metadata()

    # ========================================================
    # 3. DEFAULT INPUT VALUES
    # ========================================================

    defaults = {

        "current_bleeding": "no",

        "days_since_last_bleed_or_current_phase_day": 30,

        "phase": "FUNCTIONAL_PHASE",

        "bleeding_pattern": "none",

        "bleed_frequency": "none",

        "affected_joint": "knee",

        "currently_undergoing_physiotherapy": "no",

        "physiotherapy_location": "none",

        "sessions_per_week": 0,

        "session_duration": "15-20 min",

        "current_treatment": "factor therapy",

        "equipment_used": "none",

        "physiotherapy_helping": "not_applicable",

        "exercise_problem": "none",
    }

    # ========================================================
    # 4. BUILD MODEL INPUT
    # ========================================================

    row = {}

    for feature in FEATURES:

        value = patient.get(
            feature,
            defaults[feature]
        )

        if value is None or str(value).strip() == "":
            value = defaults[feature]

        row[feature] = value

    # ========================================================
    # 5. NORMALIZE VALUES
    # ========================================================

    row["current_bleeding"] = norm(
        row["current_bleeding"],
        "no"
    ).lower()

    row["bleeding_pattern"] = norm(
        row["bleeding_pattern"],
        "none"
    ).lower()

    row["bleed_frequency"] = norm(
        row["bleed_frequency"],
        "none"
    ).lower()

    row["affected_joint"] = norm(
        row["affected_joint"],
        "knee"
    ).lower()

    row["currently_undergoing_physiotherapy"] = norm(
        row["currently_undergoing_physiotherapy"],
        "no"
    ).lower()

    row["physiotherapy_location"] = norm(
        row["physiotherapy_location"],
        "none"
    ).lower()

    row["session_duration"] = norm(
        row["session_duration"],
        "15-20 min"
    )

    row["current_treatment"] = norm(
        row["current_treatment"],
        "factor therapy"
    ).lower()

    row["equipment_used"] = norm(
        row["equipment_used"],
        "none"
    ).lower()

    row["physiotherapy_helping"] = norm(
        row["physiotherapy_helping"],
        "not_applicable"
    ).lower()

    row["exercise_problem"] = norm(
        row["exercise_problem"],
        "none"
    ).lower()

    # ========================================================
    # 6. NUMERICAL VALUES
    # ========================================================

    try:

        row[
            "days_since_last_bleed_or_current_phase_day"
        ] = float(
            row[
                "days_since_last_bleed_or_current_phase_day"
            ]
        )

    except Exception:

        row[
            "days_since_last_bleed_or_current_phase_day"
        ] = 30.0

    try:

        row["sessions_per_week"] = float(
            row["sessions_per_week"]
        )

    except Exception:

        row["sessions_per_week"] = 0.0

    # ========================================================
    # 7. PHASE
    # ========================================================

    supplied_phase = norm(
        patient.get("phase"),
        ""
    ).upper()

    valid_phases = {
        "REHAB_PHASE",
        "FUNCTIONAL_PHASE",
    }

    if supplied_phase in valid_phases:

        row["phase"] = supplied_phase

    else:

        row["phase"] = phase_from_days(
            row[
                "days_since_last_bleed_or_current_phase_day"
            ]
        )

    # ========================================================
    # 8. CREATE DATAFRAME
    # ========================================================

    input_df = pd.DataFrame(
        [row],
        columns=FEATURES
    )

    # ========================================================
    # 9. APPLY THE SAVED PREPROCESSOR
    # ========================================================

    transformed_input = preprocessor.transform(
        input_df
    )

    # ========================================================
    # 10. PREDICT PROBABILITIES
    # ========================================================

    probabilities = model.predict_proba(
        transformed_input
    )[0]

    # ========================================================
    # 11. MAP MODEL CLASS IDS
    # ========================================================

    ranked = []

    # The training labels were encoded as:
    #
    # 0 -> Heel slides
    # 1 -> Mini squats
    # 2 -> Seated knee extensions
    # 3 -> Straight leg raises
    # 4 -> Terminal knee extensions
    #
    # Therefore the probability index corresponds to
    # the encoded class ID.

    for class_id, probability in enumerate(
        probabilities
    ):

        try:

            exercise_name = label_encoder.inverse_transform(
                [class_id]
            )[0]

        except Exception:

            exercise_name = str(
                class_id
            )

        ranked.append(
            (
                exercise_name,
                float(probability)
            )
        )

    # ========================================================
    # 12. SORT BY PROBABILITY
    # ========================================================

    ranked.sort(
        key=lambda x: x[1],
        reverse=True
    )

    # ========================================================
    # 13. ONLY ALLOW THE FIVE NEW EXERCISES
    # ========================================================

    ranked = [
        item
        for item in ranked
        if item[0] in EXPECTED_EXERCISES
    ]

    # ========================================================
    # 14. TOP K
    # ========================================================

    try:

        top_k = int(
            top_k
        )

    except Exception:

        top_k = 2

    top_k = max(
        1,
        min(
            top_k,
            5
        )
    )

    # ========================================================
    # 15. GENERATE RECOMMENDATIONS
    # ========================================================

    recommendations = []

    sets, reps = dosage()

    phase = row["phase"]

    for exercise_name, probability in ranked[:top_k]:

        exercise_id = (
            exercise_name
            .lower()
            .replace(" ", "_")
        )

        recommendations.append({

            "exerciseId": exercise_id,

            "exerciseName": exercise_name,

            "type": "JOINT",

            "joint": "knee",

            "category": "Knee",

            "source": "ML",

            "status": "PENDING_DOCTOR_REVIEW",

            "mlConfidence": round(
                float(probability),
                4
            ),

            "sets": sets,

            "repetitionsOrDuration": reps,

            "frequency": frequency(
                phase
            ),

            "purpose": (
                "ML-selected knee exercise based on "
                "the patient's provided clinical and "
                "physiotherapy features."
            ),

            "recommendedAt": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
        })

    # ========================================================
    # 16. RETURN RESULT
    # ========================================================

    return {

        "status": "RECOMMENDATIONS_GENERATED",

        "source": "ML",

        "model": metadata.get(
            "model_name",
            "XGBoost"
        ),

        "recommendations": recommendations,

        "guidance": [],

        "phase": phase,

        "joint": row["affected_joint"],
    }


# ============================================================
# MAIN
# ============================================================

def main():

    payload = json.load(
        sys.stdin
    )

    result = recommend(
        payload,
        int(
            payload.get(
                "top_k",
                2
            )
        )
    )

    print(
        json.dumps(
            result,
            ensure_ascii=False
        )
    )


# ============================================================
# EXECUTION
# ============================================================

if __name__ == "__main__":

    try:

        main()

    except Exception as exc:

        print(
            json.dumps(
                {
                    "error": str(exc)
                },
                ensure_ascii=False
            )
        )

        sys.exit(1)
