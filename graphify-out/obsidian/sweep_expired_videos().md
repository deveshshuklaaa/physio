---
source_file: "backend/app/services/video_retention.py"
type: "code"
community: "db.py"
location: "L31"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/dbpy
---

# sweep_expired_videos()

## Connections
- [[One pass delete every video file whose expiresAt has passed and that hasn't…]] - `rationale_for` [EXTRACTED]
- [[_run()_3]] - `calls` [EXTRACTED]
- [[datetime_1]] - `references` [EXTRACTED]
- [[retention_loop()]] - `calls` [EXTRACTED]
- [[video_retention.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/dbpy