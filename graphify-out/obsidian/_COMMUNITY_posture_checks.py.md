---
type: community
members: 13
---

# posture_checks.py

**Members:** 13 nodes

## Members
- [[Angle at point B using 2D pixel coordinates (x, y). Best used for front-view…]] - rationale - backend/_old_physio_reference/math_utils.py
- [[Checks valid in front-facing view. Uses 2D pixel angles (Z is unreliable front-…]] - rationale - backend/_old_physio_reference/posture_checks.py
- [[Checks valid in side-facing view. Uses 3D angles for knee (depth is reliable…]] - rationale - backend/_old_physio_reference/posture_checks.py
- [[Detects heels rising off the ground. Compares current heel Y against a baseline…]] - rationale - backend/_old_physio_reference/posture_checks.py
- [[Detects neck out of neutral (looking up or down excessively). Measures the…]] - rationale - backend/_old_physio_reference/posture_checks.py
- [[Detects posterior pelvic tilt (butt wink) at the bottom of the squat. Only…]] - rationale - backend/_old_physio_reference/posture_checks.py
- [[angle_2d()]] - code - backend/_old_physio_reference/math_utils.py
- [[check_butt_wink()]] - code - backend/_old_physio_reference/posture_checks.py
- [[check_heel_lift()]] - code - backend/_old_physio_reference/posture_checks.py
- [[check_neck()]] - code - backend/_old_physio_reference/posture_checks.py
- [[check_posture_front()]] - code - backend/_old_physio_reference/posture_checks.py
- [[check_posture_side()]] - code - backend/_old_physio_reference/posture_checks.py
- [[posture_checks.py]] - code - backend/_old_physio_reference/posture_checks.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/posture_checkspy
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_detect_view]]
- 2 edges to [[_COMMUNITY_exercise_runner.py]]
- 1 edge to [[_COMMUNITY_run_case]]

## Top bridge nodes
- [[angle_2d()]] - degree 7, connects to 3 communities
- [[posture_checks.py]] - degree 9, connects to 1 community
- [[check_posture_front()]] - degree 4, connects to 1 community
- [[check_posture_side()]] - degree 4, connects to 1 community
- [[check_butt_wink()]] - degree 3, connects to 1 community