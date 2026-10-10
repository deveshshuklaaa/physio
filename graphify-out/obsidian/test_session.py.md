---
source_file: "backend/app/routes/test_session.py"
type: "code"
community: "TestClient"
location: "L1"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/TestClient
---

# test_session.py

## Connections
- [[H4, H5 — session lifecycle endpoints. G2-B3B6 — auth and authorization. No…]] - `rationale_for` [EXTRACTED]
- [[_auth()_1]] - `contains` [EXTRACTED]
- [[_lookup_docA_only_for_p1()]] - `contains` [EXTRACTED]
- [[_token()_3]] - `contains` [EXTRACTED]
- [[_with_doctor_lookup()]] - `contains` [EXTRACTED]
- [[appmain.py]] - `imports_from` [EXTRACTED]
- [[auth.py]] - `imports_from` [EXTRACTED]
- [[test_g2b_admin_reads_anyone()]] - `contains` [EXTRACTED]
- [[test_g2b_doctor_authorization_matrix()]] - `contains` [EXTRACTED]
- [[test_g2b_expired_and_malformed_tokens_are_both_401_but_logged_distinctly()]] - `contains` [EXTRACTED]
- [[test_g2b_no_token_is_401()]] - `contains` [EXTRACTED]
- [[test_g2b_patient_cannot_read_another_patients_session()]] - `contains` [EXTRACTED]
- [[test_g2b_patient_id_is_ignored_from_the_body()]] - `contains` [EXTRACTED]
- [[test_g2d6_summary_is_patient_scoped()]] - `contains` [EXTRACTED]
- [[test_g2d6_summary_is_written_and_validated()]] - `contains` [EXTRACTED]
- [[test_g2d_session_survives_a_restart()]] - `contains` [EXTRACTED]
- [[test_g2d_two_sessions_one_exercise_are_two_rows()]] - `contains` [EXTRACTED]
- [[test_h4_session_start_returns_session_id()]] - `contains` [EXTRACTED]
- [[test_h4_session_status_is_readable()]] - `contains` [EXTRACTED]
- [[test_h4_start_rejects_unknown_exercise()]] - `contains` [EXTRACTED]
- [[test_h5_does_not_cross_the_job_queue_ownership_line()]] - `contains` [EXTRACTED]
- [[test_h5_end_of_unknown_session_is_rejected()]] - `contains` [EXTRACTED]
- [[test_h5_job_is_enqueued_not_executed()]] - `contains` [EXTRACTED]
- [[test_h5_session_end_is_idempotent()]] - `contains` [EXTRACTED]
- [[test_h5_session_end_returns_job_id()]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/TestClient