---
type: community
members: 16
---

# video_retention.py

**Members:** 16 nodes

## Members
- [[dot-__aiter__()]] - code - backend/app/services/video_retention.py
- [[dot-__anext__()]] - code - backend/app/services/video_retention.py
- [[dot-__init__()_5]] - code - backend/app/services/video_retention.py
- [[dot-__init__()_6]] - code - backend/app/services/video_retention.py
- [[dot-__init__()_7]] - code - backend/app/services/video_retention.py
- [[dot-find()]] - code - backend/app/services/video_retention.py
- [[dot-update_one()]] - code - backend/app/services/video_retention.py
- [[G2-F8 -- video retention sweep. Deletes files past `clinical.video.expiresAt`,…]] - rationale - backend/app/services/video_retention.py
- [[One pass delete every video file whose expiresAt has passed and that hasn't…]] - rationale - backend/app/services/video_retention.py
- [[_FakeCollection_2]] - code - backend/app/services/video_retention.py
- [[_FakeCursor]] - code - backend/app/services/video_retention.py
- [[_FakeDb_2]] - code - backend/app/services/video_retention.py
- [[_run()_2]] - code - backend/app/services/video_retention.py
- [[datetime]] - code
- [[sweep_expired_videos()]] - code - backend/app/services/video_retention.py
- [[video_retention.py]] - code - backend/app/services/video_retention.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/video_retentionpy
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_db.py]]
- 1 edge to [[_COMMUNITY_exercise_config.py]]
- 1 edge to [[_COMMUNITY_logging_setup.py]]
- 1 edge to [[_COMMUNITY_test_report.py]]

## Top bridge nodes
- [[video_retention.py]] - degree 11, connects to 4 communities
- [[sweep_expired_videos()]] - degree 5, connects to 1 community