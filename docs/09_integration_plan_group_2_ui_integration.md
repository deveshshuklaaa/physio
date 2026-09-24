# Group 2 — UI Integration Plan

**Status:** not started. Written 2026-09-09.
**Companion document:** `docs/09a_integration_decisions.md` records every design
decision behind this plan, the alternatives that were rejected, and why. Read it
before changing anything here — this file says *what to build*, that one says
*why it is shaped this way*.

This plan is self-contained. A session starting from zero should be able to read
this file plus `09a` and begin work without re-deriving anything.

---

## 0. What this is

Two working systems have to become one product:

1. **The Rehab Assessment Engine** — this repo. FastAPI backend, plain-JS live
   pose client, EMG service. Phases 0 through H are built; I is unbuilt; J is
   partial. See `docs/PROJECT-STATUS.md` and the 2026-09-09 phase audit appended
   to it.
2. **The Hemophilia Care Management System** — `part2/Hemophillia-confirm/`.
   Written by a different team. Node/Express + MongoDB Atlas + React/Vite.
   Patient onboarding, OTP auth, clinical history, doctor and admin portals,
   FHIR export, Gemini chatbot, and an exercise recommendation flow with a
   mandatory doctor-approval gate.

**The product shape.** Their app is the front door. A patient registers, gives
clinical history, and receives an exercise plan that a doctor approves. Each
approved exercise carries a **Start Now** button that hands off to our engine for
a live camera-assessed session. The session's results, and an AI-written report,
come back into their record and their doctor's view.

**Group 2 is the UI-and-data integration of those two systems.** It does not
include Phase I (post-session ML analysis), which remains unbuilt and is tracked
separately.

---

## 1. System definition after integration

```
                          nginx :80  (only published port)
                               |
    /                 -->  hemo-frontend    their React SPA
    /api/*            -->  hemo-backend     Express  :5000
    /engine/*         -->  backend          FastAPI  :8000
    /ws/*             -->  backend          FastAPI  :8000   (websocket upgrade)
    /dist/*, /src/*   -->  frontend         our static client :3000

                     also, not published:
                          mongo        :27017
                          emg-service  :5000 (internal name, no host port)
```

One origin. No CORS. `localStorage` is shared between their React and our client,
which is how the JWT reaches us without ever entering a URL.

**Database.** One MongoDB, database `hemophilia`. Collection ownership is
disjoint and strict:

| Collection | Owner | Our access |
|---|---|---|
| `users` | theirs | read only |
| `patientprofiles` | theirs | read only |
| `hemophiliadetails` | theirs | read only |
| `patientexerciserecommendations` | theirs | read only |
| `screeningsessions`, `assessments`, `fhirresources`, `loginotps`, `doctorregistrationrequests`, `doctorchangerequests` | theirs | none |
| **`physiosessions`** | **ours** | read + write |

Our FastAPI never writes a collection it does not own.

---

## 2. Locked decisions

Full rationale in `09a`. Summary, because the tasks below assume all of it:

| # | Decision |
|---|---|
| D1 | nginx reverse proxy, one origin, only :80 published |
| D2 | FastAPI verifies their JWT locally (HS256, shared `JWT_SECRET`) |
| D3 | WebSocket auth is the first frame after accept, 5s deadline, close 4401 |
| D4 | knee → our 6 exercises; ankle → heel slides; hip → breathing. Joint picker trimmed to Knee / Ankle / Hip |
| D5 | Start Now deep-links to our client, which auto-starts the session on mount |
| D6 | Their ML recommender is deleted and replaced by a deterministic rule table. `safety_engine` is kept, ported to JS |
| D7 | Start Now renders on every non-breathing card, enabled only when `status === "ACTIVE"` |
| D8 | Live summary written back on session end. Gemini report generated async; report page polls |
| D9 | Video stored on disk, 30-day expiry, gated on the existing `consentVideoMonitoring` flag |
| D10 | New `physiosessions` collection, dual id, `recommendationId` as a nullable back-pointer |
| D11 | Whole session document inline, including the per-rep log |
| D12 | Deep link carries exercise + recommendation id only; identity always from the JWT |
| D13 | Our `report.html` post-session; their ExercisePlan gets a "Past sessions" list |
| D14 | Doctor sees full history, authorized via `hemophiliadetails.consultingDoctorId` |
| D15 | Sensitive fields isolated under `clinical:{}`, plaintext for now, CSFLE-ready |

---

## 3. What already exists, precisely

Do not rebuild any of this. Line numbers are as of 2026-09-09.

### Ours

| Thing | Where | Note |
|---|---|---|
| `POST /session/start` | `backend/app/routes/session.py:79` | Already accepts `{exercise, patient_id}`. `patient_id` is currently unvalidated. |
| `POST /session/end` | `session.py:100` | Idempotent, mints a `job_id` |
| `GET /session/{id}` | `session.py:110` | Returns the in-memory record |
| `WS /ws/session/{id}` | `backend/app/ws/session_ws.py:68` | No auth; only checks the session exists |
| Live rep counting | `frontend/src/lib/pose_engine.js:161` | Emits `repCount`, `cleanReps`, `repWasClean`, `repFailReason` |
| Video capture | `frontend/src/lib/recorder.js:95` | Produces a Blob **in the browser**. Never uploaded. |
| Exercise select page | `frontend/app/src/pages/ExerciseSelect.jsx` | Reads `?api=` at :22; `startSession()` at :151 |
| Report page | `frontend/app/src/pages/Report.jsx` | Built in Phase J, polls a session endpoint, nothing to show yet |
| Exercise registry | `backend/app/config/exercises.json` | 6 exercises, all knee |
| Old Gemini report | `backend/_old_physio_reference/gemini.py` | `build_gemini_prompt_generic()` :141, `call_gemini()` :99. Rendered to a cv2 window and **never persisted**. |

Our six exercises: `heel_slide`, `mini_squat`, `seated_knee_extension`,
`straight_leg_raise`, `terminal_knee_extension`, `squat`.

### Theirs

| Thing | Where | Note |
|---|---|---|
| JWT issue | `backend/src/routes/auth.js:37` | `jwt.sign({userId, role}, JWT_SECRET)`, HS256 |
| JWT verify | `backend/src/middleware/auth.js:34` | Has a hardcoded fallback secret — see §8 |
| Token storage | `frontend/src/apiClient.js` | `localStorage.authToken`, sent as `Authorization: Bearer` |
| Exercise catalogue | `backend/src/routes/exerciseRecommendations.js:1110` | `MANUAL_EXERCISE_CATALOG`, 24 entries |
| Rule fallback | `exerciseRecommendations.js:874` | `RULE_FALLBACK`, 6 entries |
| Generate endpoint | `exerciseRecommendations.js:1094` | `POST /generate`, spawns Python |
| Doctor approve / remove | `exerciseRecommendations.js:1283`, `:1312` | Flips status |
| ML inference | `backend/ml/recommendation_inference.py` | `safety_engine()`, then a sklearn pipeline. Joint→category gate at :165. |
| Joint picker | `frontend/src/pages/HemophiliaDetailsScreen.jsx:17510` | Knee, Ankle, Elbow, Shoulder, Hip, Wrist |
| Exercise plan page | `frontend/src/pages/ExercisePlan.jsx:862` | Live block; earlier blocks are commented-out prior versions |
| Doctor review panel | `frontend/src/components/ExerciseReviewPanel.jsx` | |

Their live Mongo, verified 2026-09-09: `users` n=6, `patientprofiles` n=2,
`hemophiliadetails` n=1, `patientexerciserecommendations` n=3, `fhirresources`
n=11, `assessments` n=1, `doctorregistrationrequests` n=2, `loginotps` n=3,
`screeningsessions` n=0, `doctorchangerequests` n=0.

Conventions confirmed against the live data:

- Dual identity everywhere: `patientUserId` (ObjectId → `users`) **and**
  `patientId` (string, `PATxxxxxx`). Both indexed.
- `patientexerciserecommendations` has a **unique** index on
  `{patientUserId, exerciseId}` — it is current state, not history. One row per
  patient per exercise, updated in place.
- `patientprofiles` already carries `consentDataCollection`, `consentAI`,
  **`consentVideoMonitoring`**, `privacyAccepted`, `termsAccepted`,
  `consentTimestamp`.
- The doctor↔patient link is `hemophiliadetails.consultingDoctorId`, indexed. It
  is **not** on `users` or `patientprofiles`. A patient with no
  `hemophiliadetails` row therefore has no doctor.
- `hemophiliadetails` also has `jointsAffected` (array) and `targetJoint`
  (single).

---

## 4. The `physiosessions` schema

```js
{
  _id:              ObjectId,
  sessionId:        "s_ab12cd34...",        // our uuid, unique index
  patientUserId:    ObjectId,               // -> users._id      PARENT KEY
  patientId:        "PAT000123",            // display only
  recommendationId: ObjectId | null,        // -> patientexerciserecommendations
  doctorUserId:     ObjectId | null,        // snapshot of consultingDoctorId

  exerciseId:       "heel_slides",          // THEIR vocabulary
  engineExercise:   "heel_slide",           // OUR vocabulary

  startedAt:        ISODate,
  endedAt:          ISODate | null,
  durationS:        Number | null,

  repCount:         Number,
  cleanReps:        Number,

  status:           "active" | "ended" | "reported" | "failed",

  clinical: {                               // <- one schemaMap entry, later
    repLog: [ { rep, clean, bestAngle, errors: [String] } ],
    report: {
      text:         String | null,
      model:        "gemini-2.5-flash-lite",
      promptVersion: "g2-v1",
      generatedAt:  ISODate | null,
      error:        String | null
    },
    video: {
      path:         "data/videos/s_ab12cd34.webm" | null,
      bytes:        Number | null,
      mimeType:     String | null,
      consentVideoMonitoring: Boolean,      // snapshot at capture time
      expiresAt:    ISODate | null,
      deletedAt:    ISODate | null
    }
  },

  createdAt: ISODate,
  updatedAt: ISODate
}
```

Indexes:

```js
{ sessionId: 1 }                    // unique
{ patientUserId: 1, startedAt: -1 } // "this patient, newest first"
{ doctorUserId: 1, startedAt: -1 }  // doctor dashboard
{ "clinical.video.expiresAt": 1 }   // retention sweep
```

**Why `clinical:{}` is a subtree.** Everything inside it is patient clinical
content — a narrative describing how a named person moved, the per-rep failure
reasons behind it, and a path to video of their face. When `crypt_shared` is
installed, a single `schemaMap` entry on `clinical` encrypts all of it at once.
The metrics outside it (`repCount`, `startedAt`, `status`) stay queryable either
way. Do not move a sensitive field out of this subtree for query convenience.

---

## 5. Atomic task list

Phases run roughly in order. `G2-A` unblocks everything else; `G2-B` and `G2-C`
are independent of each other and can run in parallel.

### PHASE G2-0 — Prerequisites

**Resolved 2026-09-10 — see `docs/09g_g2_0_resolutions.md` for each decision and
its residual risk. Summary:**

- **G2-0.1** Atlas passwords **not** rotated. Accepted risk while the DB holds
  test patients only. Rotate before any real record.
- **G2-0.2** `.env.example` unchanged; the credential line stays. Tied to 0.1.
- **G2-0.3** CSFLE on, via `CRYPT_SHARED_LIB_PATH` (no code change —
  `config/db.js:86` is already env-driven). **Still blocked:** the library at the
  project root is an aarch64 build and this host is x86_64. Need the
  `linux-x86_64-enterprise` tarball. Does not block G2-A.
- **G2-0.4** Ankle → `heel_slides` → our `heel_slide`. D4 stands. Deliberate,
  not a mapping error.
- **G2-0.5** Done — prompt `g2-v1` written in `09g`, ready for G2-F2.

### PHASE G2-A — Origin and infrastructure

- **G2-A1** `part2/Hemophillia-confirm/backend/Dockerfile` — `node:20-alpine`,
  `npm ci`, `CMD node src/index.js`.
- **G2-A2** `part2/Hemophillia-confirm/frontend/Dockerfile` — build with Vite,
  serve the built `dist/` statically. Mirror the pattern in
  `frontend/Dockerfile`.
- **G2-A3** Add `hemo-backend`, `hemo-frontend`, `mongo` and `nginx` services to
  `docker-compose.yml`. **Unpublish every port except nginx's :80.** Internal
  service names replace `localhost` everywhere.
- **G2-A4** `nginx/default.conf` with the route table from §1. `/ws/*` needs
  `proxy_http_version 1.1` plus the `Upgrade`/`Connection` headers or the live
  session silently fails to connect.
- **G2-A5** Remove the `VITE_API_PORT` workaround. Under one origin their
  `apiClient.js` baseURL becomes the relative `/api`.
- **G2-A6** Widen nothing in CORS — delete the now-dead origin lists in both
  backends rather than leaving stale allowlists behind.
- **G2-A7** `docs/09b_running.md` — how to bring the whole stack up, and the one
  URL to open.

**Gate:** `docker compose up` serves their landing page at `http://localhost/`,
their API answers at `/api/health`, ours at `/engine/health`, and a WebSocket
connects through `/ws/`.

### PHASE G2-B — Authentication

- **G2-B1** `backend/app/auth.py` — a FastAPI dependency that reads
  `Authorization: Bearer`, decodes HS256 with `JWT_SECRET`, returns
  `(user_id, role)`. Reject expired and malformed tokens distinctly in the logs.
- **G2-B2** Add `JWT_SECRET` to our backend config. **It must be the same value
  as theirs.** Fail loudly at startup if it is unset — do not fall back to a
  literal, which is the bug their `middleware/auth.js:34` already has.
- **G2-B3** Apply the dependency to `/session/start`, `/session/end`,
  `GET /session/{id}`. Derive `patient_id` from the token; **ignore any
  `patient_id` in the request body** and remove it from `SessionStart`.
- **G2-B4** WS auth per D3: accept, then `receive_json()` with a 5s timeout,
  expect `{type:"auth", token}`, close 4401 on failure. Bind the socket's user to
  the session's `patientUserId` and close 4403 on mismatch.
- **G2-B5** `frontend/src/ws/client.js` — send the auth frame first, before any
  other message.
- **G2-B6** Authorization helper: given a JWT and a target `patientUserId`,
  allow if the caller is that patient, or an admin, or a doctor whose
  `_id` matches that patient's `hemophiliadetails.consultingDoctorId`. One
  function, used by every patient-scoped route.
- **G2-B7** `docs/09c_auth.md` — the token shape, the WS handshake, the authz
  rule.

**Gate:** a request with no token is 401. A patient reading another patient's
session is 403. A doctor reading their own patient is 200; another doctor's
patient is 403.

### PHASE G2-C — Catalogue and recommender (their side)

- **G2-C1** Replace `MANUAL_EXERCISE_CATALOG`
  (`exerciseRecommendations.js:1110`) with the Group 2 catalogue: our 6 knee
  exercises, the ankle entry from G2-0.4, and the breathing entries. Delete
  Elbow, Shoulder, Wrist, Lumbar Spine and Balance.
- **G2-C2** Trim the joint picker (`HemophiliaDetailsScreen.jsx:17510`) to Knee,
  Ankle, Hip. Remove the i18n keys for the dropped joints in all three languages.
- **G2-C3** Handle existing rows: patients whose `jointsAffected` contains a
  removed joint still exist in the DB. Decide and implement — migrate, ignore, or
  surface for doctor review. Do not let a stale joint produce an empty plan
  silently.
- **G2-C4** Delete the Python spawn from `/generate`. Replace with a
  deterministic `JOINT_EXERCISE_MAP` in Node.
- **G2-C5** Port `safety_engine()` from `recommendation_inference.py` to JS
  **exactly** — active bleeding, high pain, and mucosal-systemic bleeding all
  still withhold recommendations. This is a clinical gate; it is not optional and
  its thresholds are not to be re-tuned during a port.
- **G2-C6** `source` becomes `"RULE"`. Keep `"DOCTOR"` for manual prescription.
  Retire `"ML"` from the enum only after existing rows are migrated.
- **G2-C7** Delete `backend/ml/recommendation_inference.py`,
  `hemophysio_exercise_recommendation_model.pkl`,
  `hemophysio_exercise_model_metadata.pkl`, and the `PYTHON_EXECUTABLE`
  dependency for this path. The chatbot severity model
  (`predict.py`) is a **different** feature and stays.
- **G2-C8** `docs/09d_catalogue.md` — the mapping table, and what was removed.

**Gate:** a patient selecting Knee gets our 6 as `PENDING_DOCTOR_REVIEW`. Ankle
gets the ankle exercise. Hip gets breathing. An actively bleeding patient gets
the safety-gate response, not exercises.

### PHASE G2-D — Persistence

- **G2-D1** Add `motor` to `backend/requirements.txt`. Async driver — a sync
  `pymongo` call inside an async handler blocks the event loop and will show up
  directly in the latency budget from §3 of the master plan.
- **G2-D2** `backend/app/db.py` — motor client on lifespan startup, closed on
  shutdown. `MONGO_URI` from env, no default.
- **G2-D3** `backend/app/models/session_doc.py` — the §4 schema as Pydantic, and
  the index creation, idempotent, at startup.
- **G2-D4** Rewrite `session.py` to persist: `/session/start` inserts,
  `/session/end` updates. Delete `app.state.sessions` and `app.state.jobs`.
  **`end_session()`'s signature is pinned** — `session_ws.py` imports it; see the
  docstring at `session.py:1`.
- **G2-D5** Resolve `patientId` and `doctorUserId` at session start by reading
  `patientprofiles` and `hemophiliadetails`. Snapshot them onto the row; do not
  join at read time.
- **G2-D6** `POST /session/{id}/summary` — accepts `repCount`, `cleanReps`,
  `repLog` from the client at session end. Validate: reps monotonic, counts
  consistent with the log length, size-capped.
- **G2-D7** `docs/09e_persistence.md`.

**Gate:** a completed session survives a backend restart and is readable by
`sessionId`. Two sessions of the same exercise by one patient produce two rows.

### PHASE G2-E — Handoff

- **G2-E1** `ExercisePlan.jsx` — render **Start Now** on every non-breathing
  card. Enabled only when `status === "ACTIVE"`; otherwise disabled with
  "Awaiting doctor approval". Breathing exercises get no button at all.
- **G2-E2** The link is relative: `/dist/index.html?exercise=<theirId>&rec=<recommendationId>`.
  No token, no patient id. Add the i18n strings.
- **G2-E3** `ExerciseSelect.jsx` — read `?exercise=` and `?rec=`. On mount, read
  `localStorage.authToken`, call `startSession()` immediately, redirect to the
  live page. No click.
- **G2-E4** `ENGINE_SUPPORTED` map: their `exerciseId` → our `exercise` name.
  Expose as `GET /engine/capabilities` so their frontend never renders a button
  for something we cannot assess.
- **G2-E5** Failure paths, all of them visible rather than silent: no token →
  bounce to their login; unmapped exercise → explain, offer the plan page;
  `/session/start` fails → error with a retry, never a blank camera page.
- **G2-E6** Camera permission denial must land somewhere sensible. With D5's
  auto-start the prompt fires on arrival, so this is the first thing a patient
  sees go wrong.

**Gate:** Start Now on an ACTIVE knee exercise opens a live session with the
right exercise selected, with no intermediate click. A PENDING card's button is
disabled. A breathing card has none.

### PHASE G2-F — Report and video

- **G2-F1** `backend/app/services/gemini_report.py` — port `call_gemini()` from
  `_old_physio_reference/gemini.py:99`. Plain REST, `x-goog-api-key`, no SDK.
  Timeout, one retry, structured logging.
- **G2-F2** Port `build_gemini_prompt_generic()` :141 and replace its prompt body
  with the revised text from G2-0.5. Tag it `promptVersion: "g2-v1"`.
- **G2-F3** `GEMINI_API_KEY` in our backend env. Never sent to the browser.
- **G2-F4** On `/session/end`: write the summary row **first**, then
  `asyncio.create_task()` the Gemini call. A Gemini failure sets
  `clinical.report.error` and leaves `status: "ended"` — it must never lose the
  numeric summary.
- **G2-F5** `GET /engine/session/{id}` returns the row for polling. Include
  enough state for the page to distinguish "generating" from "failed".
- **G2-F6** `POST /engine/session/{id}/video` — multipart upload, write to
  `data/videos/{sessionId}.webm`. Cap the size. Reject if the patient's
  `consentVideoMonitoring` is false, and record the flag's value on the row
  either way.
- **G2-F7** `recorder.js` — upload the blob at session end. It currently only
  produces it in memory; this is the gap flagged at master plan line 1029.
- **G2-F8** Retention sweep: delete files past `clinical.video.expiresAt`, set
  `deletedAt`, log `video_deleted` per §8b.3 of the master plan. A scheduled task,
  not a request-time check.
- **G2-F9** `docs/09f_report.md` — the prompt, its version, and the retention
  rule.

**Gate:** a finished session shows counts immediately and report text within ~10
seconds. Killing Gemini mid-run leaves a readable row with an error recorded.
Video lands on disk with an expiry, and a patient without consent produces no
file.

### PHASE G2-G — Return UI

- **G2-G1** `Report.jsx` — poll `GET /engine/session/{id}`. Counts first, then
  the report text. "Analysing your session…" while pending, an honest message on
  failure. Link back to their plan page.
- **G2-G2** `GET /engine/patients/{id}/sessions` — paginated history, authorized
  by G2-B6.
- **G2-G3** "Past sessions" list on `ExercisePlan.jsx`: date, exercise, reps,
  clean rate, link into `report.html`.
- **G2-G4** Doctor patient-detail page: same history plus report text. Video
  playable only where the consent flag is true.
- **G2-G5** i18n for every new string, EN/HI/MR. Their app is fully translated;
  half-translated pages are a visible regression.
- **G2-G6** The Gemini report text itself is English-only. Either translate it or
  say plainly in the UI that it is English. Do not leave it silently monolingual
  in a Hindi or Marathi session.

**Gate:** a patient completes a session, reads the report, returns to their plan,
finds it under Past sessions, and their doctor sees it. In all three languages.

---

## 6. Subagent map

Same rules as master plan §10: strict file ownership, no two agents write the
same file, each finishes with a notes file in `docs/`.

| # | Agent | Model | Owns (writes) | Reads | Phase | Must not touch |
|---|---|---|---|---|---|---|
| 13 | **integration-infra-agent** | Haiku → Sonnet low for A4 | `nginx/`, `docker-compose.yml`, both new `Dockerfile`s, `docs/09b_running.md` | this doc | G2-A | Any application logic |
| 14 | **integration-auth-agent** | **Sonnet default** | `backend/app/auth.py`, auth wiring in `session.py` and `session_ws.py`, `frontend/src/ws/client.js` auth frame, `docs/09c_auth.md` | their `middleware/auth.js`, `routes/auth.js` | G2-B | Their backend, report logic |
| 15 | **catalogue-agent** | Sonnet low | `part2/.../routes/exerciseRecommendations.js`, `HemophiliaDetailsScreen.jsx` joint list, `docs/09d_catalogue.md` | `exercises.json`, `recommendation_inference.py` | G2-C | Our backend, `ExercisePlan.jsx` (agent 17 owns) |
| 16 | **session-persistence-agent** | **Sonnet default** | `backend/app/db.py`, `app/models/session_doc.py`, `app/routes/session.py`, `docs/09e_persistence.md` | §4 schema, their models | G2-D | WS internals (agent 14), Gemini (agent 18) |
| 17 | **handoff-agent** | Sonnet low | `ExercisePlan.jsx`, `ExerciseSelect.jsx`, `app/routes/capabilities.py` | `docs/09d` | G2-E | `exerciseRecommendations.js` (agent 15 owns) |
| 18 | **report-agent** | **Sonnet default** | `app/services/gemini_report.py`, video upload route, retention task, `recorder.js` upload, `docs/09f_report.md` | `_old_physio_reference/gemini.py` | G2-F | `session.py` (agent 16 owns) |
| 19 | **return-ui-agent** | Sonnet low | `Report.jsx`, doctor patient-detail page, i18n files | `docs/09e`, `docs/09f` | G2-G | Backend routes |

**Where a high-effort model is worth it.** Two places, for the same reason as
master plan §10 — a wrong call is expensive and hard to detect later:

1. **G2-B6, the authorization rule.** It spans two collections and three roles,
   and the doctor link lives somewhere non-obvious. A subtle error here leaks one
   patient's clinical record to another doctor and will not show up in any test
   that only uses one patient.
2. **G2-C5, the `safety_engine` port.** A silently wrong threshold recommends
   exercise to someone with an active joint bleed. Port it literally, then diff
   the two implementations against the same inputs.

**Sequencing.** G2-0 blocks everything. G2-A blocks everything after it. G2-B and
G2-C are independent — run them in parallel. G2-D needs A. G2-E needs B, C, D.
G2-F needs D. G2-G needs E and F.

---

## 7. Testing gates

Per master plan §7, a phase is not done because its code exists. It is done when
its gate passes.

| Phase | Gate |
|---|---|
| G2-0 | Passwords rotated. `.env.example` no longer commits a credential. `crypt_shared` decision recorded with a date. |
| G2-A | One `docker compose up`. Their landing page at `/`. Both APIs answer. A WebSocket connects through nginx. |
| G2-B | No token → 401. Wrong patient → 403. Doctor's own patient → 200, another doctor's → 403. WS with no auth frame closes 4401 within 5s. |
| G2-C | Knee → our 6. Ankle → the ankle exercise. Hip → breathing. Active bleed → safety response. Elbow/Shoulder/Wrist absent from the picker. |
| G2-D | Session survives a backend restart. Two sessions, one exercise, one patient → two rows. |
| G2-E | Start Now → live session, right exercise, no click. PENDING disabled. Breathing has no button. Denied camera lands somewhere sensible. |
| G2-F | Counts immediate, report within ~10s. Gemini killed mid-run → row readable, error recorded, counts intact. No consent → no file. |
| G2-G | Full loop in EN, HI and MR. Doctor sees the session. |
| **Group 2** | **A patient registers, gets a plan, a doctor approves it, the patient runs a session, reads the report, and the doctor sees the result — without anyone touching a terminal.** |

Manual end-to-end is a required gate, not an optional extra. Phase J's own gate
is still unmet for exactly this reason (`docs/J_frontend_pages.md:1-5`); do not
repeat that here by declaring a phase green on automated tests alone.

---

## 8. Standing constraints

**On credentials.** Two Atlas passwords are already exposed: one in root
`.env.example`, one in a chat transcript. `.gitignore`'s `!.env.example` negation
means the first commits. Rotate both. Their `middleware/auth.js:34` falls back to
a hardcoded JWT secret when the env var is missing — a deployment that forgets
`JWT_SECRET` silently signs tokens with a public string. Make it fail instead.

**On encryption.** CSFLE is currently disabled system-wide. `config/db.js` was
patched on 2026-09-09 to boot on Linux without `crypt_shared` by passing
`bypassAutoEncryption: true`, which means every field their `schemaMap` marks
encrypted is now written in cleartext, mixed into collections that may already
hold encrypted documents. The boot log says `CSFLE DISABLED (cleartext)`. This is
acceptable for a development window and unacceptable for real patient records.
G2-0.3 forces the decision rather than letting it drift.

**On patient video.** Master plan line 1248 says: store temporarily, delete only
after confirmed report save. D9 deliberately reverses this to a 30-day retention.
That reversal is a decision, not an oversight, and it is the reason
`consentVideoMonitoring` is checked at capture and snapshotted onto every row. A
patient who withdraws consent must have a deletion path — currently G2-F8's
sweep is the only one, and it is time-based, not request-based.

**On the doctor gate.** Their app's central clinical safety property is that no
machine-generated exercise reaches a patient without a doctor approving it. D7
preserves it. Nothing in Group 2 may weaken it, and "the button is right there
but greyed out" is the maximum concession.

**On their code.** `src/index.js` (2447 lines), `chatbot.js` (1552) and
`exerciseRecommendations.js` carry three to five commented-out prior versions of
themselves above the live code. When editing, confirm you are in the **last**
block. A change to a commented-out copy looks correct in a diff and does nothing.

**On what Group 2 does not include.** Phase I remains unbuilt: no job queue, no
MediaPipe Heavy re-extraction, no per-rep video cutting, no feature builder, no
SHAP explainability, no `report_builder.py`. The Gemini report in G2-F is a
coaching narrative built from live rule-based rep data. **It is not the
model-explained clinical report Phase I specifies, and must not be presented as
one.** Per master plan E-DEC.6, a report separates what was measured from what
was inferred; a Gemini narrative is neither — it is generated prose about
measurements, and the UI should not imply a model assessed the patient.

---

## 9. Open items

Closed 2026-09-10 (`docs/09g_g2_0_resolutions.md`): ankle mapping (`heel_slides`),
the revised Gemini prompt (`g2-v1`), Atlas credentials (not rotated, accepted),
`.env.example` (unchanged).

Still open:

1. **`crypt_shared` binary** — the installed build is aarch64, host is x86_64.
   Fetch the `linux-x86_64-enterprise` 8.3.x tarball and repoint
   `CRYPT_SHARED_LIB_PATH`. Until then CSFLE stays off in practice.
2. **Video retention period** — 30 days is a placeholder in the schema.
3. **Existing rows with removed joints** — G2-C3 needs a decision before it can
   be implemented.
