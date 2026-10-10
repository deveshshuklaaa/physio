---
type: community
members: 14
---

# admin_models.py

**Members:** 14 nodes

## Members
- [[E7 which exercises have a loaded model, is_tree_based per exercise, and the…]] - rationale - backend/app/routes/admin_models.py
- [[E8 scans `root` for each configured exercise. An exercise with no imported…]] - rationale - backend/app/routes/admin_models.py
- [[Manual trigger only -- nothing watches the filesystem (E6). Always 200 a…]] - rationale - backend/app/routes/admin_models.py
- [[Model admin routes — MASTER_BUILD_PLAN_v3.md §5 PHASE E, E6-E8, E11. POST…]] - rationale - backend/app/routes/admin_models.py
- [[Path_2]] - code
- [[Request]] - code
- [[UploadFile]] - code
- [[_empty_entry()]] - code - backend/app/routes/admin_models.py
- [[_loaded_entry()]] - code - backend/app/routes/admin_models.py
- [[admin_models.py]] - code - backend/app/routes/admin_models.py
- [[build_model_registry()]] - code - backend/app/routes/admin_models.py
- [[lifespan()]] - code - backend/app/main.py
- [[model_status()]] - code - backend/app/routes/admin_models.py
- [[upload_model_package()]] - code - backend/app/routes/admin_models.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/admin_modelspy
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_appmain.py]]
- 2 edges to [[_COMMUNITY_session_ws.py]]
- 2 edges to [[_COMMUNITY_validate_model_package.py]]
- 1 edge to [[_COMMUNITY_exercise_config.py]]
- 1 edge to [[_COMMUNITY__get]]
- 1 edge to [[_COMMUNITY_session.py]]
- 1 edge to [[_COMMUNITY_test_admin_models.py]]

## Top bridge nodes
- [[admin_models.py]] - degree 10, connects to 4 communities
- [[lifespan()]] - degree 4, connects to 3 communities
- [[upload_model_package()]] - degree 7, connects to 2 communities
- [[build_model_registry()]] - degree 7, connects to 1 community
- [[model_status()]] - degree 4, connects to 1 community