---
source_file: "backend/app/services/video_retention.py"
type: "rationale"
community: "db.py"
location: "L32"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/dbpy
---

# One pass: delete every video file whose expiresAt has passed and that hasn't…

## Connections
- [[sweep_expired_videos()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/dbpy