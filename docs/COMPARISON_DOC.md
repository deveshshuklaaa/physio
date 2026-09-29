# ROOT vs REWORKED — Full Comparison Report

**Generated:** 2026-09-26  
**ROOT:** `/home/billa-dakait/Desktop/final_project` (branch `avanish`)  
**REWORKED:** `/home/billa-dakait/Desktop/hello/Physio-Project-ayush-hemophysio/XAI-for-physiotherapy-integration` (branch `ayush-hemophysio`)

---

## Executive Summary

Reworked is a re-architecture of same codebase by collaborator. Same file structure, critical divergences:

1. **ROOT has active working code. REWORKED commented everything out** — many backend files have ROOT's code commented, then NEW version also commented. Result: **nothing active in key backend files** (auth.js, index.js, db.js).
2. **ROOT removed CORS (G2-A single-origin via nginx). REWORKED re-added CORS allowlist** — breaks single-origin architecture.
3. **ROOT has crucial EMG integration edits** (fire-and-forget task management, calibration endpoints, capture start/stop). REWORKED stripped all.
4. **ROOT has pose engine refinements** (One-Euro angle filter, rep guards, 3D visibility gating, evidence pts). REWORKED has older pre-refinement version.
5. **REWORKED adds Google OAuth, password reset flow, ML exercise recommendation** — new features ROOT doesn't have.
6. **REWORKED's vite.config.mjs proxies to localhost ports** instead of nginx gateway — breaks containerized deployment.

**Bottom line:** REWORKED cannot run as-is. Auth is fully commented out. DB config is commented out. Must use ROOT as base and cherry-pick new features from REWORKED.

---

## Critical Differences (Integration-Breaking)

### CRIT-1: auth.js — All code commented out in REWORKED

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Active code | Yes — register + login endpoints working | **None** — all commented |
| Lines | 231 (active) | 1120 (all comments) |
| What happened | Clean working auth | ROOT version commented out → new Google OAuth version appended, also commented |
| Google OAuth | Not present | Added (`POST /api/auth/google/patient`) but **inactive** |
| **Impact** | — | **Auth completely broken.** No login, no register. |

### CRIT-2: index.js — CORS re-added, code bloat

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Lines | 2437 | 2894 |
| CORS | Explicitly removed (G2-A6 comment) | Re-added: allowlist `localhost:5173`, `10.72.90.1:5173` |
| Active code | ~200 lines working | ROOT commented + new commented version appended |
| New features | — | Password reset routes added |
| **Impact** | — | **Breaks single-origin architecture.** CORS allowlist defeats nginx proxy purpose. |

### CRIT-3: db.js — Double-commented, Windows path

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Lines | 344 | 671 |
| CSFLE config | Active, works on Linux/Docker | Both versions commented out |
| crypt_shared path | Platform-agnostic | Hardcoded Windows DLL path |
| **Impact** | — | **DB connection broken.** All code commented. Windows path fails on Linux. |

### CRIT-4: vite.config.mjs — Proxies to localhost, not nginx

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Proxy target | `VITE_GATEWAY` env var → nginx on port 80 | Direct: `localhost:5000`, `localhost:8000`, `localhost:3000` |
| Extra | — | `serveLiveSessionHtml()` Vite plugin, `/engine` prefix rewrite |
| **Impact** | — | **Only works in dev on host.** Docker compose deployment broken. |

### CRIT-5: session.py — EMG integration stripped

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Task management | `_bg_tasks` set + `_spawn()` helper (GC-safe) | Bare `asyncio.create_task()` (GC-vulnerable) |
| EMG integration | `start_capture`/`stop_capture` on session start/end | Removed entirely |
| Calibration | `/session/calibrate` + `/calibration` endpoints | Removed |
| **Impact** | — | **EMG never starts/stops with sessions.** Background tasks may silently GC. Calibration gate gone. |

---

## Important Differences (Non-Breaking but Significant)

### IMP-1: pose_engine.js — Older version without refinements

| Feature | ROOT | REWORKED |
|---------|------|---------|
| One-Euro angle filter | `_angleFilter` via ANGLE_FILTER | Missing |
| Rep guards | Hold frames, min rep time, min movement via REP_GUARDS | Missing |
| 3D visibility gating | Yes | Missing |
| `tSeconds` parameter | Yes | Missing |
| `evidencePts` tracking | Yes | Missing |
| `live_tuning.js` import | Yes | Missing (file doesn't exist in reworked) |
| **Impact** | — | Lower quality rep detection. False reps possible. No angle smoothing. |

### IMP-2: session_orchestrator.js — Report URL + evidence changed

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Pose data | `msg.evidencePts ?? msg.pts` | `msg.pts` only |
| Report URL | `../../dist/report.html` | `/report.html` with token in URL |
| Debug code | Clean | `console.log` statements left in |
| **Impact** | — | Evidence replay broken. Token-in-URL = security concern (URL history, referrer leaks). |

### IMP-3: rules.js — Missing driverAngle + exerciseConfig

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| Check context | Includes `driverAngle` | Missing |
| build() signature | `spec.build(values, alerts, exerciseConfig)` | `spec.build(values, alerts)` |
| **Impact** | — | Checks needing driverAngle or exerciseConfig break silently. |

### IMP-4: docker-compose.yml — EMG config stripped

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| EMG env vars | `EMG_DATA_DIR` set | Missing |
| Data volume | Bind mount for persistence | Missing |
| UDP port | `8888/udp` exposed | Missing |
| Demo port | `127.0.0.1:5000` TCP | Missing |
| **Impact** | — | EMG recordings won't persist. UDP from band won't reach container. |

### IMP-5: nginx/default.conf — Demo EMG block removed

| Aspect | ROOT | REWORKED |
|--------|------|---------|
| `/emg/` location | Present (GET-only, demo, marked for revert) | Removed |
| **Impact** | — | Minor. ROOT's is temporary demo code. Reworked actually correct here. |

---

## Part2 Modified Files — Full Table

### Backend (15 files)

| # | File | Severity | Key Difference |
|---|------|----------|----------------|
| 1 | config/db.js | 🔴 CRIT | ROOT active CSFLE. REWORKED all commented + Windows crypt_shared path |
| 2 | ml/predict.py | 🟢 Minor | Reworked adds CalibratedClassifierCV, 6-decimal precision. Functionally same |
| 3 | package.json | 🟢 Minor | +`google-auth-library` |
| 4 | scripts/createAdmin.js | 🟢 Minor | ROOT checks email uniqueness, REWORKED checks admin role existence |
| 5 | scripts/createStaffAccount.js | 🟢 Minor | Different default staff ("Dr. Narendra Modi" vs "Dr. Suhani Suryawanshi") |
| 6 | src/index.js | 🔴 CRIT | CORS re-added. New commented version appended. Password reset routes |
| 7 | src/models/Assessment.js | 🟡 Medium | ROOT has commented CSFLE. REWORKED simpler active version |
| 8 | src/models/PatientProfile.js | 🟡 Medium | REWORKED adds hospital info (HTC, hematologist, existing patient number) |
| 9 | src/models/User.js | 🟡 Medium | REWORKED adds authProvider, googleId, conditional passwordHash. adminLevel default changed |
| 10 | src/routes/auth.js | 🔴 CRIT | ROOT active 3 endpoints. REWORKED: all commented (ROOT + Google OAuth versions) |
| 11 | src/routes/chatbot.js | 🟡 Medium | Both mostly commented. REWORKED has multi-model Gemini fallback |
| 12 | src/routes/exerciseRecommendations.js | 🟡 Medium | REWORKED adds safety engine (G2-C5), ML inference. Both mostly commented |
| 13 | src/routes/profile.js | 🟢 Minor | Similar. Both have consent + patientId generation |
| 14 | src/services/emailService.js | 🟡 Medium | REWORKED adds patient registration/profile update email types |
| 15 | src/services/otpService.js | 🟢 Minor | Same logic, slight refactoring |

### Frontend (26 files)

| # | File | Severity | Key Difference |
|---|------|----------|----------------|
| 1 | package.json | 🟢 Minor | +`@react-oauth/google` |
| 2 | src/App.jsx | 🟡 Medium | REWORKED adds ForgotPassword, AdminChangePassword routes. Both heavily commented |
| 3 | src/components/Layout.jsx | 🟡 Medium | REWORKED 2x size. Both mostly commented |
| 4 | src/i18n/i18n.js | 🟢 Minor | Similar i18n config |
| 5 | src/pages/AdminChangePassword.jsx | 🟢 Minor | Similar |
| 6-11 | Admin*.jsx, Doctor*.jsx | 🟢 Minor | Nearly identical (most commented) |
| 12 | src/pages/AuthScreen.jsx | 🟡 Medium | REWORKED adds GoogleOAuthProvider, name validation. Renames to PatientAuthScreen |
| 13 | src/pages/AwarenessScreen.jsx | 🟢 Minor | Similar |
| 14 | src/pages/DoctorDashboard.jsx | 🟢 Minor | 8290 vs 8282 lines. Nearly identical |
| 15 | src/pages/ExercisePlan.jsx | 🟡 Medium | REWORKED 3x size. YouTube links, translations added |
| 16 | src/pages/HemophiliaDetailsScreen.jsx | 🟡 Medium | ROOT much larger (20548 vs 10890). Possibly more commented variants in ROOT |
| 17 | src/pages/OTPVerification.jsx | 🟢 Minor | Similar |
| 18 | src/pages/Report.css/.jsx | 🟢 Minor | Styling differences |
| 19 | vite.config.mjs | 🔴 CRIT | ROOT→nginx gateway. REWORKED→localhost ports. Plugin + rewrite added |

---

## Non-Part2 Modified Files — Full Table (30 files)

| # | File | Severity | Key Difference |
|---|------|----------|----------------|
| 1 | docker-compose.yml | 🔴 CRIT | ROOT has EMG data vol, UDP port, env vars. REWORKED stripped |
| 2 | nginx/default.conf | 🟡 Medium | ROOT has demo /emg/ block. REWORKED removed (correct) |
| 3 | backend/app/config/exercises.json | 🟡 Medium | Structure changes need line-level review |
| 4 | backend/app/events.py | 🟢 Minor | Minor changes |
| 5 | backend/app/routes/session.py | 🔴 CRIT | ROOT has _bg_tasks, EMG integration, calibration. REWORKED stripped |
| 6-9 | backend/app/routes/test_*.py | 🟡 Medium | Test adjustments follow code changes |
| 10 | backend/app/services/emg_client.py | 🟡 Medium | Same circuit breaker, minor diff |
| 11 | backend/app/services/gemini_report.py | 🟡 Medium | Same report gen, minor config (timeout, tokens) |
| 12 | backend/app/ws/test_session_ws.py | 🟡 Medium | Test changes |
| 13 | emg-service/backend/app.py | 🟡 Medium | Recording/history logic diffs |
| 14 | emg-service/Dockerfile | 🟢 Minor | Minor |
| 15 | emg-service/data/history.json | 🟢 Minor | Data file |
| 16-19 | emg-service/website/*.html | 🟡 Medium | UI changes to EMG monitoring pages |
| 20 | frontend/src/lib/audio_cues.js | 🟡 Medium | Alert mapping differences |
| 21 | frontend/src/lib/checks/index.js | 🟡 Medium | Check registry changes |
| 22 | frontend/src/lib/events.js | 🟢 Minor | Event vocab changes |
| 23 | frontend/src/lib/pose_engine.js | 🔴 CRIT | ROOT has One-Euro, rep guards, 3D vis. REWORKED older version |
| 24 | frontend/src/lib/rules.js | 🟡 Medium | ROOT passes driverAngle + exerciseConfig. REWORKED doesn't |
| 25 | frontend/src/lib/session_orchestrator.js | 🟡 Medium | ROOT sends evidencePts. REWORKED uses pts + debug logs |
| 26 | frontend/src/lib/smoother.js | 🟡 Medium | Interface differs (tSeconds arg) |
| 27 | frontend/src/pages/live_session.html | 🟡 Medium | REWORKED adds token-in-URL. Security concern |
| 28 | frontend/src/workers/pose_worker.js | 🟡 Medium | Must match pose_engine.js API |
| 29 | emg-service/backend/sketch_jun22a.ino | 🟢 Minor | Arduino sketch |

---

## New Files in Reworked (17 files)

### Password Reset Flow (4 files) — CHERRY-PICK

| File | Purpose |
|------|---------|
| backend/scripts/passwordResetEmailService.js | Nodemailer + `sendPasswordResetOTP()` — branded HTML email |
| backend/src/models/PasswordResetOTP.js | Mongoose model: userId, email, role, challengeId, otpHash, TTL index |
| backend/src/routes/passwordReset.js | `POST /api/password-reset/request` — multi-role (patient by email, doctor by professionalId). No account enumeration |
| frontend/src/pages/ForgotPassword.jsx | Multi-step: select role → identifier → verify OTP → new password. Live validation |

**Verdict:** Good feature. Separate OTP model. Multi-role. Clean UX. Cherry-pick into ROOT.

### ML Exercise Recommendation (4 files) — CHERRY-PICK

| File | Purpose |
|------|---------|
| backend/ml/recommendation_inference.py | Python inference entrypoint. Called via child_process.spawn() from exerciseRecommendations.js |
| backend/ml/hemophilia_knee_exercise_model.json | Trained model (JSON serialized) |
| backend/ml/hemophilia_knee_model_metadata.json | Model metadata (version, features, training date) |
| backend/ml/example_shap_explanation.json | Example SHAP output for explainability |

**Verdict:** Completes ML recommendation pipeline. ROOT's exerciseRecommendations.js route exists but inactive without these. Cherry-pick.

### EMG Service Extras (7 files) — SELECTIVE

| File | Purpose | Verdict |
|------|---------|---------|
| emg-service/design/design_system.md | Design system doc | 🟡 Reference only |
| emg-service/emg_review.py | Recording review/analysis tool | 🟢 Useful utility, cherry-pick |
| emg-service/emg_serial_capture.py | Serial port capture (alt to UDP) | 🟢 Useful utility, cherry-pick |
| emg-service/run.py | Alternative entry point | 🟡 Evaluate if needed |
| emg-service/website/history2.html | Recording history v2 | 🔴 Skip — iterative experiment |
| emg-service/website/live2.html | Live monitor v2 | 🔴 Skip — iterative experiment |
| emg-service/website/live3.html | Live monitor v3 | 🔴 Skip — iterative experiment |

### Part2 Frontend (1 file)

| File | Purpose | Verdict |
|------|---------|---------|
| frontend/src/pages/ForgotPassword.jsx | Password reset UI | Listed above in Password Reset Flow |

### Duplicates/Legacy

| File | Purpose | Verdict |
|------|---------|---------|
| emg-service/website/live (copy)july 24.html | Old copy from July 24 | 🔴 Skip — legacy |
| backend/src/services/passwordResetEmailService.js | Duplicate of scripts/ version | 🟡 One is enough |

---

## Recommendations

### MUST PRESERVE from ROOT (reworked breaks these):

| # | What | Why |
|---|------|-----|
| 1 | Active auth code (auth.js) | Only working login/register |
| 2 | CORS removal (index.js) | G2-A single-origin architecture |
| 3 | Active DB config (db.js) | Only working CSFLE setup |
| 4 | Vite proxy to nginx (vite.config.mjs) | Containerized deployment |
| 5 | EMG integration (session.py) | _bg_tasks, capture, calibration |
| 6 | Pose engine refinements (pose_engine.js) | One-Euro, rep guards, 3D vis |
| 7 | driverAngle in rules.js | Checks need it |
| 8 | Docker compose EMG config | Volumes, UDP, env vars |
| 9 | Evidence pts (session_orchestrator.js) | Replay capability |

### CHERRY-PICK from REWORKED:

| # | What | How |
|---|------|-----|
| 1 | Google OAuth | Uncomment auth.js Google section, add to User model, add deps |
| 2 | Password reset flow | 4 new files, add route to index.js |
| 3 | ML recommendation pipeline | 4 files (model + inference), activate exerciseRecommendations.js |
| 4 | ForgotPassword.jsx | Pairs with password reset backend |
| 5 | Email service additions | Patient registration/profile update emails |
| 6 | ExercisePlan.jsx expansion | YouTube links, translations |
| 7 | emg_serial_capture.py + emg_review.py | Useful EMG utilities |
| 8 | PatientProfile hospital fields | HTC, hematologist, patient number |

### DO NOT CHERRY-PICK:

| # | What | Why |
|---|------|-----|
| 1 | CORS re-addition | Breaks G2-A architecture |
| 2 | vite.config localhost proxy | Breaks Docker deployment |
| 3 | Token-in-URL pattern | Security: URL history, referrer leaks |
| 4 | console.log in orchestrator | Production code |
| 5 | Windows crypt_shared path | Linux deployment |
| 6 | Commented-out code patterns | ROOT active code is cleaner |
| 7 | HTML variant files (live2/3, history2) | Iterative experiments, superseded |

---

## Stats

| Metric | ROOT | REWORKED |
|--------|------|---------|
| Graphify nodes | 3512 | 3485 |
| Graphify edges | 6791 | 6715 |
| Communities | 211 | 232 |
| Modified same-name files | — | 71 (41 part2 + 30 non-part2) |
| New files in reworked | — | 17 |
| Critical differences | — | 5 |
| Cherry-pick candidates | — | 8 |
