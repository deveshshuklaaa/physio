---
source_file: "backend/app/services/video_retention.py"
type: "rationale"
community: "db.py"
location: "L65"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/dbpy
---

# Runs sweep_expired_videos() forever. Start with…

## Connections
- [[retention_loop()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/dbpy