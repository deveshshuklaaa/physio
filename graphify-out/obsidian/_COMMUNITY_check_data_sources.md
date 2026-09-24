---
type: community
members: 6
---

# check_data_sources

**Members:** 6 nodes

## Members
- [[E-DEC.2, and the reason it matters the IMU's whole value is being an…]] - rationale - backend/app/routes/test_admin_models.py
- [[E11  E-DEC.2. A model declares the sensors it REQUIRES at scoring time; a…]] - rationale - backend/ml/validate_model_package.py
- [[check_data_sources()]] - code - backend/ml/validate_model_package.py
- [[test_e11_absent_sensor_is_never_imputed()]] - code - backend/app/routes/test_admin_models.py
- [[test_e11_missing_declared_source_blocks_scoring()]] - code - backend/app/routes/test_admin_models.py
- [[test_e11_present_sources_allow_scoring()]] - code - backend/app/routes/test_admin_models.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/check_data_sources
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_test_validate_model_package.py]]
- 3 edges to [[_COMMUNITY_test_admin_models.py]]
- 1 edge to [[_COMMUNITY_validate_model_package.py]]

## Top bridge nodes
- [[test_e11_absent_sensor_is_never_imputed()]] - degree 4, connects to 2 communities
- [[test_e11_missing_declared_source_blocks_scoring()]] - degree 3, connects to 2 communities
- [[test_e11_present_sources_allow_scoring()]] - degree 3, connects to 2 communities
- [[check_data_sources()]] - degree 5, connects to 1 community