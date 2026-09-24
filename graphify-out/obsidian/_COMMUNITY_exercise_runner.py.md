---
type: community
members: 29
---

# exercise_runner.py

**Members:** 29 nodes

## Members
- [[Build a pixel-coordinate dict for all landmarks that pass VISIBILITY_THRESH.…]] - rationale - backend/_old_physio_reference/math_utils.py
- [[Builds a Gemini coaching prompt from any ExerciseDefinition + session log.]] - rationale - backend/_old_physio_reference/gemini.py
- [[Clear all smoothed state. Call on session reset.]] - rationale - backend/_old_physio_reference/smoother.py
- [[Draw the semi-transparent left HUD panel onto frame in-place.]] - rationale - backend/_old_physio_reference/exercise_runner.py
- [[Draw the skeleton overlay on frame. Two-pass render (shadow + colour) for…]] - rationale - backend/_old_physio_reference/drawing.py
- [[EMA-smooth a single MediaPipe landmark. Returns (x, y, z) smoothed normalised…]] - rationale - backend/_old_physio_reference/smoother.py
- [[Entry point called by every exercise file. Handles both dynamic (rep-based) and…]] - rationale - backend/_old_physio_reference/exercise_runner.py
- [[ExerciseDefinition_4]] - code
- [[Run all JointChecks for current view. Returns (alerts, joint_angles,…]] - rationale - backend/_old_physio_reference/exercise_runner.py
- [[Scan exercises and return (display_name, filepath) for every .py file that…]] - rationale - backend/_old_physio_reference/main.py
- [[_compute_joint_angle()]] - code - backend/_old_physio_reference/exercise_runner.py
- [[_draw_hud()]] - code - backend/_old_physio_reference/exercise_runner.py
- [[_find_player()]] - code - backend/_old_physio_reference/voice.py
- [[_old_physio_referencemain.py]] - code - backend/_old_physio_reference/main.py
- [[_run_joint_checks()]] - code - backend/_old_physio_reference/exercise_runner.py
- [[build_gemini_prompt_generic()]] - code - backend/_old_physio_reference/gemini.py
- [[build_pts()]] - code - backend/_old_physio_reference/math_utils.py
- [[discover_exercises()]] - code - backend/_old_physio_reference/main.py
- [[draw_skeleton()]] - code - backend/_old_physio_reference/drawing.py
- [[exercise_runner.py]] - code - backend/_old_physio_reference/exercise_runner.py
- [[init_tts()]] - code - backend/_old_physio_reference/voice.py
- [[main()_4]] - code - backend/_old_physio_reference/main.py
- [[reset_smoother()]] - code - backend/_old_physio_reference/smoother.py
- [[run_exercise()]] - code - backend/_old_physio_reference/exercise_runner.py
- [[smooth_landmark()]] - code - backend/_old_physio_reference/smoother.py
- [[smoother.py]] - code - backend/_old_physio_reference/smoother.py
- [[speak()]] - code - backend/_old_physio_reference/voice.py
- [[voice.py]] - code - backend/_old_physio_reference/voice.py
- [[╔══════════════════════════════════════════════════════════════_ebeca4b6]] - rationale - backend/_old_physio_reference/main.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/exercise_runnerpy
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_detect_view]]
- 6 edges to [[_COMMUNITY_ExerciseDefinition_1]]
- 4 edges to [[_COMMUNITY_gemini.py]]
- 2 edges to [[_COMMUNITY_posture_checks.py]]
- 2 edges to [[_COMMUNITY_drawing.py]]
- 2 edges to [[_COMMUNITY_ExerciseDefinition]]

## Top bridge nodes
- [[exercise_runner.py]] - degree 24, connects to 6 communities
- [[run_exercise()]] - degree 21, connects to 4 communities
- [[_compute_joint_angle()]] - degree 4, connects to 2 communities
- [[build_pts()]] - degree 5, connects to 1 community
- [[draw_skeleton()]] - degree 4, connects to 1 community