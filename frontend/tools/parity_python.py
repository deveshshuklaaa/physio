#!/usr/bin/env python3
"""
parity_python.py — runs the REAL legacy math_utils.py functions over
frontend/tools/parity_cases.json and dumps outputs to parity_python_out.json.

Read-only against backend/_old_physio_reference/ (imports only, no edits).
Part of the G1/G2 6-decimal parity gate proof.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LEGACY_DIR = os.path.join(HERE, "..", "..", "backend", "_old_physio_reference")
sys.path.insert(0, LEGACY_DIR)

from math_utils import angle_2d, angle_3d, torso_lean, detect_view  # noqa: E402


class Lm:
    """Stand-in for a mediapipe landmark: has .x .y .z attributes."""
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z


def run_case(c):
    kind = c["kind"]
    if kind == "angle2d":
        return angle_2d(tuple(c["a"]), tuple(c["b"]), tuple(c["c"]))
    if kind == "angle3d":
        a = Lm(**c["a"]); b = Lm(**c["b"]); cc = Lm(**c["c"])
        return angle_3d(a, b, cc)
    if kind == "torso_lean":
        return torso_lean(tuple(c["sh"]), tuple(c["hip"]))
    if kind == "detect_view":
        # detect_view only reads lms[LM["left_shoulder"]].z / right_shoulder.z
        # build a 33-slot list, only indices 11/12 need to be real.
        lms = [Lm(0, 0, 0) for _ in range(33)]
        lms[11] = Lm(0, 0, c["left_shoulder_z"])
        lms[12] = Lm(0, 0, c["right_shoulder_z"])
        return detect_view(lms)
    raise ValueError(f"unknown kind {kind}")


def main():
    with open(os.path.join(HERE, "parity_cases.json")) as f:
        cases = json.load(f)
    out = {}
    for c in cases:
        try:
            out[c["id"]] = run_case(c)
        except Exception as e:
            out[c["id"]] = {"error": str(e)}
    with open(os.path.join(HERE, "parity_python_out.json"), "w") as f:
        json.dump(out, f, indent=2)
    print(f"wrote {len(out)} cases to parity_python_out.json")


if __name__ == "__main__":
    main()
