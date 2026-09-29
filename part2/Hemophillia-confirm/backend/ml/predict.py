
import sys
import json
import os
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

# NEW: Calibrated model
MODEL_PATH = os.path.join(
    BASE_DIR,
    "hemophilia_chatbot_calibrated_model.pkl"
)

FEATURE_INFO_PATH = os.path.join(
    BASE_DIR,
    "chatbot_model_features.pkl"
)


# ============================================================
# TARGET LABELS
# ============================================================

CLASS_LABELS = {
    0: "Healthy",
    1: "Mild",
    2: "Moderate",
    3: "Severe"
}


# ============================================================
# LOAD CALIBRATED MODEL
# ============================================================

try:

    model = joblib.load(
        MODEL_PATH
    )

except Exception as error:

    print(
        json.dumps({
            "success": False,
            "error":
                f"Unable to load calibrated ML model: {str(error)}"
        })
    )

    sys.exit(1)


# ============================================================
# LOAD FEATURE INFORMATION
# ============================================================

try:

    feature_information = joblib.load(
        FEATURE_INFO_PATH
    )

    FEATURES = feature_information["features"]

except Exception as error:

    print(
        json.dumps({
            "success": False,
            "error":
                f"Unable to load feature information: {str(error)}"
        })
    )

    sys.exit(1)


# ============================================================
# EXPECTED FEATURES
# ============================================================

EXPECTED_FEATURES = [
    "age",
    "sex",
    "prolonged_bleeding_minor_cut",
    "excessive_post_surgery_bleeding",
    "excessive_dental_bleeding",
    "easy_bruising",
    "muscle_hematoma",
    "recurrent_joint_bleeding",
    "joint_warmth",
    "joint_tightness",
    "reduced_joint_mobility",
    "hematuria",
    "hematochezia",
    "family_history_bleeding_disorder",
    "male_relative_with_hemophilia",
    "previous_factor_test"
]


# ============================================================
# VERIFY FEATURE ORDER
# ============================================================

if FEATURES != EXPECTED_FEATURES:

    print(
        json.dumps({
            "success": False,
            "error":
                "ML model feature order does not match the expected chatbot feature order.",
            "modelFeatures":
                FEATURES,
            "expectedFeatures":
                EXPECTED_FEATURES
        })
    )

    sys.exit(1)


# ============================================================
# READ INPUT FROM NODE
# ============================================================

try:

    raw_input = sys.stdin.read()

    if not raw_input.strip():

        raise ValueError(
            "No prediction data received."
        )

    data = json.loads(
        raw_input
    )

except Exception as error:

    print(
        json.dumps({
            "success": False,
            "error":
                f"Invalid prediction input: {str(error)}"
        })
    )

    sys.exit(1)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def normalize_text(value):

    if value is None:
        return ""

    return str(value).strip().lower()


# ============================================================
# ENCODE SEX
# ============================================================

def encode_sex(value):

    value = normalize_text(value)

    if value in [
        "male",
        "m"
    ]:
        return 0

    if value in [
        "female",
        "f"
    ]:
        return 1

    # Already numeric

    try:

        numeric_value = float(value)

        if numeric_value in [0, 1]:

            return int(numeric_value)

    except Exception:
        pass

    return 0


# ============================================================
# ENCODE BINARY
# ============================================================

def encode_binary(value):

    value = normalize_text(value)

    if value in [
        "yes",
        "y",
        "true",
        "1",
        "positive"
    ]:
        return 1

    if value in [
        "no",
        "n",
        "false",
        "0",
        "negative"
    ]:
        return 0

    return 0


# ============================================================
# ENCODE ORDINAL
# ============================================================

def encode_ordinal(value):

    value = normalize_text(value)

    if value in [
        "never",
        "0"
    ]:
        return 0

    if value in [
        "sometimes",
        "1"
    ]:
        return 1

    if value in [
        "often",
        "2"
    ]:
        return 2

    try:

        numeric_value = float(value)

        if numeric_value in [0, 1, 2]:

            return int(numeric_value)

    except Exception:
        pass

    return 0


# ============================================================
# CREATE FEATURE DATA
# ============================================================

features = {}


# ============================================================
# AGE
# ============================================================

try:

    age = float(
        data.get("age", 0)
    )

except Exception:

    age = 0


# Keep age within a reasonable range

if age < 0:
    age = 0

if age > 120:
    age = 120


features["age"] = age


# ============================================================
# SEX
# ============================================================

features["sex"] = encode_sex(
    data.get("sex")
)


# ============================================================
# ORDINAL FEATURES
# ============================================================

ordinal_features = [

    "prolonged_bleeding_minor_cut",

    "easy_bruising"
]


for feature in ordinal_features:

    features[feature] = encode_ordinal(
        data.get(feature)
    )


# ============================================================
# BINARY FEATURES
# ============================================================

binary_features = [

    "excessive_post_surgery_bleeding",

    "excessive_dental_bleeding",

    "muscle_hematoma",

    "recurrent_joint_bleeding",

    "joint_warmth",

    "joint_tightness",

    "reduced_joint_mobility",

    "hematuria",

    "hematochezia",

    "family_history_bleeding_disorder",

    "male_relative_with_hemophilia",

    "previous_factor_test"
]


for feature in binary_features:

    features[feature] = encode_binary(
        data.get(feature)
    )


# ============================================================
# CREATE DATAFRAME
# ============================================================

input_dataframe = pd.DataFrame(
    [[
        features[feature]
        for feature in FEATURES
    ]],
    columns=FEATURES
)


# ============================================================
# CALIBRATED PREDICTION
# ============================================================

try:

    prediction = model.predict(
        input_dataframe
    )[0]

    probabilities = model.predict_proba(
        input_dataframe
    )[0]

except Exception as error:

    print(
        json.dumps({
            "success": False,
            "error":
                f"ML prediction failed: {str(error)}"
        })
    )

    sys.exit(1)


# ============================================================
# CONVERT PREDICTION
# ============================================================

prediction = int(
    prediction
)


prediction_label = CLASS_LABELS.get(
    prediction,
    "Unknown"
)


# ============================================================
# PROBABILITIES
# ============================================================

probability_result = {}


for class_value, probability in zip(
    model.classes_,
    probabilities
):

    class_value = int(
        class_value
    )

    probability_result[
        str(class_value)
    ] = round(
        float(probability),
        6
    )


# ============================================================
# PREDICTION CONFIDENCE
#
# Confidence = calibrated probability of the
# predicted class.
# ============================================================

prediction_confidence = (
    probability_result
    .get(
        str(prediction),
        0
    )
)


# ============================================================
# FINAL RESPONSE
# ============================================================

result = {

    "success": True,

    "prediction":
        prediction,

    "predictionLabel":
        prediction_label,

    "predictionConfidence":
        prediction_confidence,

    "probabilities":
        probability_result,

    "features":
        features
}


# ============================================================
# RETURN JSON TO NODE
# ============================================================

print(
    json.dumps(
        result
    )
)
