---
type: community
members: 34
---

# TestClient

**Members:** 34 nodes

## Members
- [[Called twice, one job. Not two jobs, not an error on the second call -- the…]] - rationale - backend/app/routes/test_session.py
- [[Context-manager-free installuninstall of the B6 seam…]] - rationale - backend/app/routes/test_session.py
- [[D12 a client-supplied patient_id must never override the token.]] - rationale - backend/app/routes/test_session.py
- [[D6 is a trust boundary the browser supplies these numbers and they land in a…]] - rationale - backend/app/routes/test_session.py
- [[H4, H5 — session lifecycle endpoints. G2-B3B6 — auth and authorization. No…]] - rationale - backend/app/routes/test_session.py
- [[H5 returns immediately. The job is recorded as pending work; the report…]] - rationale - backend/app/routes/test_session.py
- [[Mint a token shaped exactly like theirs (userIdrole claims, HS256) -- see…]] - rationale - backend/app/routes/test_session.py
- [[TestClient]] - code
- [[The exercise name is a trust boundary it selects the thresholds and, later,…]] - rationale - backend/app/routes/test_session.py
- [[The load-bearing B6 test. docA is p1's doctor; docB is nobody's. p2 has no…]] - rationale - backend/app/routes/test_session.py
- [[The §7 G2-D gate. A session written by one app process must be readable by the…]] - rationale - backend/app/routes/test_session.py
- [[_auth()_1]] - code - backend/app/routes/test_session.py
- [[_token()_3]] - code - backend/app/routes/test_session.py
- [[_with_doctor_lookup()]] - code - backend/app/routes/test_session.py
- [[physiosessions is HISTORY. Their patientexerciserecommendations has a unique…]] - rationale - backend/app/routes/test_session.py
- [[test_g2b_admin_reads_anyone()]] - code - backend/app/routes/test_session.py
- [[test_g2b_doctor_authorization_matrix()]] - code - backend/app/routes/test_session.py
- [[test_g2b_expired_and_malformed_tokens_are_both_401_but_logged_distinctly()]] - code - backend/app/routes/test_session.py
- [[test_g2b_no_token_is_401()]] - code - backend/app/routes/test_session.py
- [[test_g2b_patient_cannot_read_another_patients_session()]] - code - backend/app/routes/test_session.py
- [[test_g2b_patient_id_is_ignored_from_the_body()]] - code - backend/app/routes/test_session.py
- [[test_g2d6_summary_is_patient_scoped()]] - code - backend/app/routes/test_session.py
- [[test_g2d6_summary_is_written_and_validated()]] - code - backend/app/routes/test_session.py
- [[test_g2d_session_survives_a_restart()]] - code - backend/app/routes/test_session.py
- [[test_g2d_two_sessions_one_exercise_are_two_rows()]] - code - backend/app/routes/test_session.py
- [[test_h4_session_start_returns_session_id()]] - code - backend/app/routes/test_session.py
- [[test_h4_session_status_is_readable()]] - code - backend/app/routes/test_session.py
- [[test_h4_start_rejects_unknown_exercise()]] - code - backend/app/routes/test_session.py
- [[test_h5_end_of_unknown_session_is_rejected()]] - code - backend/app/routes/test_session.py
- [[test_h5_job_is_enqueued_not_executed()]] - code - backend/app/routes/test_session.py
- [[test_h5_session_end_is_idempotent()]] - code - backend/app/routes/test_session.py
- [[test_h5_session_end_returns_job_id()]] - code - backend/app/routes/test_session.py
- [[test_session.py]] - code - backend/app/routes/test_session.py
- [[§4 lists routessession.py as start  end  status. The status read is what…]] - rationale - backend/app/routes/test_session.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/TestClient
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_test_session_ws.py]]
- 7 edges to [[_COMMUNITY_test_report.py]]
- 7 edges to [[_COMMUNITY_test_history.py]]
- 6 edges to [[_COMMUNITY_test_admin_models.py]]
- 3 edges to [[_COMMUNITY_test_cors.py]]
- 1 edge to [[_COMMUNITY_exercise_config.py]]
- 1 edge to [[_COMMUNITY_test_calibration_gate.py]]
- 1 edge to [[_COMMUNITY_test_e7_status_lists_every_configured_exercise]]
- 1 edge to [[_COMMUNITY_test_e8_missing_model_does_not_crash_startup]]
- 1 edge to [[_COMMUNITY_test_e8_live_feedback_survives_a_missing_model]]
- 1 edge to [[_COMMUNITY__lookup_docA_only_for_p1]]
- 1 edge to [[_COMMUNITY_test_h5_does_not_cross_the_job_queue_ownership_line]]
- 1 edge to [[_COMMUNITY_session_ws.py]]
- 1 edge to [[_COMMUNITY_appmain.py]]

## Top bridge nodes
- [[TestClient]] - degree 56, connects to 10 communities
- [[test_session.py]] - degree 25, connects to 4 communities