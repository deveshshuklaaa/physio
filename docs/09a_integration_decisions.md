# Group 2 — Integration Decision Record

**Date:** 2026-09-09.
**Method:** structured design interview (`/grill-me`), 15 decisions, one at a
time, each with a recommendation and three rejected alternatives.
**Companion:** `docs/09_integration_plan_group_2_ui_integration.md` is the build
plan. This file is why it looks the way it does.

Every decision below is **locked**. Reopening one is allowed; doing it silently
is not, because most of them constrain the others. The dependency notes on each
entry say what else moves if you change it.

---

## Context a new session needs first

**Two systems.**

- **Ours** — the Rehab Assessment Engine, this repo. FastAPI (`backend/`), plain
  JS live pose client (`frontend/src/`), a small React app for the select and
  report pages (`frontend/app/`), Flask EMG service (`emg-service/`). Phases 0–H
  built, I unbuilt, J partial.
- **Theirs** — `part2/Hemophillia-confirm/`, written by a different team.
  Express + MongoDB Atlas + React/Vite. Patient/doctor/admin portals, OTP auth,
  clinical history, FHIR export, Gemini chatbot, exercise recommendations behind
  a doctor-approval gate.

**The product.** Their app is the landing page and the clinical record. Ours is
the camera-based movement assessment a patient runs from it. Group 2 wires them
together.

**What was already changed, on 2026-09-09, to get both running locally:**

| File | Change | Reversible? |
|---|---|---|
| `part2/.../backend/config/db.js` | Windows-only `crypt_shared` path made env-driven; falls back to `bypassAutoEncryption: true` instead of throwing on Linux | Backup at `config/db.js.orig` |
| `part2/.../backend/src/services/otpService.js` | In development, prints the OTP to console and does not delete the challenge when SMTP fails | Guarded by `NODE_ENV`; production path unchanged |
| `part2/.../frontend/src/apiClient.js` | Hardcoded port 5000 → `VITE_API_PORT` | Default unchanged at 5000 |
| `part2/.../backend/.env`, `frontend/.env` | Created | Gitignored |
| `backend/venv` | Installed `python-multipart` | Was already in `requirements.txt`, just absent from the venv |
| `frontend/.serve/` | Symlink dir (`dist`, `assets`, `src`) so the built client serves locally without Docker | Disposable; obsolete once nginx lands |

The `db.js` change means **CSFLE is off and clinical fields write in cleartext.**
See D15 and the plan's §8.

---

## The decisions

### D1 — Topology: nginx reverse proxy, one origin

**Chosen.** nginx on :80 is the only published port. `/` → their React,
`/api/*` → their Express, `/engine/*` and `/ws/*` → our FastAPI, `/dist/*` and
`/src/*` → our static client.

**Why.** One nginx config removes the CORS problem permanently instead of
managing two allowlists that drift. It also makes `localStorage` shared between
the two frontends, which is what later lets the JWT reach our client without
travelling in a URL (D12).

**Rejected.**
- *Side-by-side on separate ports* — fastest today, but every later decision pays
  for it: CORS on both backends, split `localStorage`, and our endpoints exposed
  unauthenticated on the LAN.
- *Mount ours inside Express via http-proxy-middleware* — free auth reuse, but
  puts a Node process in front of the WebSocket live path, which is the one path
  with a latency budget.
- *Full merge into one codebase* — weeks of rewrite, throws away working code on
  whichever side loses.

**Depends on this:** D2, D3, D11, D12, D15's deployment story.

---

### D2 — Auth: our FastAPI verifies their JWT locally

**Chosen.** A FastAPI dependency decodes the Bearer token with `pyjwt`, HS256,
using the same `JWT_SECRET` their Express uses. Payload is `{userId, role}`
(issued at `routes/auth.js:37`).

**Why.** No network hop on the live path. No new endpoint on their side. The cost
is one shared secret in two `.env` files, which is acceptable when the two
services already share a database.

**Rejected.**
- *Call Express to introspect every request* — one secret and instant revocation,
  but a round-trip per call and our uptime coupled to theirs.
- *Trust an nginx-injected header* — safe only if FastAPI is unreachable except
  through nginx, which is a deployment property that can quietly stop being true.
- *Leave it unauthenticated* — today's state. Anyone on the LAN can start a
  session as any patient.

**Note.** Their `middleware/auth.js:34` falls back to a hardcoded secret when the
env var is missing. Ours must fail at startup instead.

---

### D3 — WebSocket auth: first frame after accept

**Chosen.** Server accepts, waits for `{type:"auth", token}` with a 5-second
deadline, closes 4401 on failure.

**Why.** Browsers cannot set `Authorization` on a WebSocket handshake, so D2 does
not carry over. Of the ways to get a token onto a socket, this is the one that
keeps it out of nginx access logs, browser history and `Referer`.

**Rejected.**
- *Query param* — simplest, and lets us reject before accept, but the token lands
  in every access log.
- *`Sec-WebSocket-Protocol`* — header-based so not logged, but abuses a
  negotiation field and some proxies mangle it.
- *No WS auth, treat `session_id` as a capability* — **specifically ruled out**:
  `session_id` is the correlation id (master plan §8b.1) and is deliberately
  written into every log line on both sides. It is the most-logged string in the
  system and therefore a poor secret.

---

### D4 — Exercise vocabulary: knee → ours, ankle → heel slides, hip → breathing

**Chosen.** Joint picker trimmed to Knee, Ankle, Hip. Their catalogue is replaced
by our six knee exercises plus the ankle and breathing entries. Elbow, Shoulder,
Wrist, Lumbar Spine and Balance are removed.

**Correction on record.** An earlier claim in this project's discussion — that
the two catalogues had *zero* name overlap — was **wrong**. It was based on the
6-item `RULE_FALLBACK` list. The real catalogue
(`exerciseRecommendations.js:1110`) has 24 entries and the knee category overlaps
ours substantially:

| Theirs | Ours | Match |
|---|---|---|
| `terminal_knee_extension` | `terminal_knee_extension` | exact |
| `straight_leg_raise` | `straight_leg_raise` | exact |
| `heel_slides` | `heel_slide` | plural only |
| `mini_squats` | `mini_squat` | plural only |
| `static_quadriceps`, `static_adductors` | — | no pose model |
| — | `seated_knee_extension`, `squat` | not in their catalogue |

**Open item.** `heel_slides` is a **knee** exercise in both catalogues — their
own file lists it under `category: "Knee"`, and our config drives it off the
hip-knee-ankle triple with the knee as rep driver. Assigning it to Ankle was an
explicit instruction and is recorded as such. Their actual Ankle entries are
`ankle_pumps`, `heel_raises`, `inversion_eversion_exercises`. This is tracked as
G2-0.4 and is the one clinical call still open.

---

### D5 — Deep link auto-starts the session

**Chosen.** Start Now navigates to our client, which reads `?exercise=` and
`?rec=`, calls `POST /session/start` on mount, and goes straight to the live
page. No intermediate click.

**Trade-off accepted.** The camera permission prompt fires immediately on
arrival, with no beat for the patient to read instructions or reposition. The
rejected alternative (preselect, patient clicks Start) traded one click for that
beat. G2-E6 exists because of this: camera denial is now the first thing a
patient sees go wrong.

---

### D6 — Their ML recommender is deleted

**Chosen.** Remove the Python spawn and the two `.pkl` files. Replace with a
deterministic `JOINT_EXERCISE_MAP` in Node. **Port `safety_engine()` to JS and
keep it.**

**Why.** Three converging reasons. The model was already dead in practice — a
path bug (`ml_models/` vs `ml/`) made every call throw `FileNotFoundError` and
fall back to `RULE_FALLBACK`. Its quality is placeholder-grade: one training
subject, degenerate GroupKFold, F1 = 0.000 on two exercises
(`docs/PROJECT-STATUS.md:65-81`). And after D4 the mapping is a three-branch
lookup, so there is nothing left for a classifier to classify.

**`safety_engine` is not part of this deletion.** It withholds recommendations on
active bleeding, high pain and mucosal-systemic bleeding, it runs *before* the
model, and it is a clinical gate rather than an ML component. Port it literally
and diff both implementations against the same inputs (this is one of the two
high-effort tasks in the plan's §6).

**Not affected.** The chatbot severity model (`ml/predict.py`,
`hemophilia_chatbot_model.pkl`) is a separate feature and stays.

---

### D7 — Start Now visible always, enabled only on ACTIVE

**Chosen.** Every non-breathing card renders the button. `PENDING_DOCTOR_REVIEW`
→ disabled, "Awaiting doctor approval". `ACTIVE` → live. Breathing → no button.

**Why.** The instruction was "all exercises have a Start Now button." Taken
literally that would let a patient run an unreviewed, machine-generated exercise
on a bleeding joint — precisely what `safety_engine` and the review queue exist
to prevent. Rendering the button but disabling it satisfies the affordance
without dissolving the gate.

**This is the app's central clinical safety property.** Nothing in Group 2 may
weaken it further.

---

### D8 — Live summary written back; Gemini async on session end

**Chosen.** `/session/end` writes the numeric summary immediately, then kicks a
background task for the Gemini call. The report page polls until
`clinical.report.text` is filled.

**Why this is cheap.** `pose_engine.js:161` already emits `repCount`,
`cleanReps`, `repWasClean` and `repFailReason` live in the browser. The summary
costs nothing extra — it is already computed. And it needs no model and no
Phase I.

**Why async.** Gemini takes 2–8 seconds. Blocking `/session/end` on it means a
timeout fails the session end itself. Writing the row first means a Gemini
outage costs the narrative but never the measurements.

**Reused.** `_old_physio_reference/gemini.py` — `call_gemini()` at :99 is plain
REST (`gemini-2.5-flash-lite:generateContent`, `x-goog-api-key`), no SDK, ports
straight into FastAPI. `build_gemini_prompt_generic()` at :141 consumes exactly
the per-rep shape our engine produces.

**Explicitly changed from the old behaviour.** The old implementation rendered
the report into a cv2 window (`gemini.py:252`) and **never persisted it**. It is
now stored on the session row.

**The prompt must be rewritten.** The existing one is generic knee coaching and
never mentions hemophilia, bleeding risk, or joint protection. Tracked as
G2-0.5, clinical ownership.

---

### D9 — Video: disk, 30-day expiry, consent-gated

**Chosen.** Upload the blob to `data/videos/{sessionId}.webm`, record path, size,
consent flag and `expiresAt` on the row, sweep on expiry.

**Two things this reverses or unblocks.**

- **It reverses master plan line 1248** — "store temporarily, delete only after
  confirmed report save" (task I14). Keeping video for 30 days is a deliberate
  reversal of a locked constraint, made on instruction, recorded here rather than
  applied silently.
- **It unblocks Phase I2.** Master plan line 1029 flags that video currently
  "leaves the browser while I2/I14 assume a server-side file." `recorder.js:95`
  produces a Blob in memory and never uploads. Building the upload closes that
  gap.

**Consent was already modelled.** `patientprofiles` carries
`consentVideoMonitoring`, `consentAI`, `consentDataCollection` and
`consentTimestamp`. No new consent UI is needed — gate on the existing flag and
snapshot its value onto every session row.

**Rejected.** GridFS (bloats the DB, and ffmpeg needs the file on disk anyway,
so Phase I would pay an extra round trip); browser-only IndexedDB (zero
liability, but the doctor can never review and I2 can never re-extract);
indefinite retention (no deletion path for a patient who withdraws consent).

**Why this needs care.** Session video of a named patient is the most sensitive
artifact the system holds — more so than the encrypted clinical fields, because a
face is not pseudonymisable.

---

### D10 — New `physiosessions` collection, dual id

**Chosen.** A new collection in the same `hemophilia` database, owned solely by
our FastAPI. `patientUserId` (ObjectId) is the parent key; `patientId` (string)
is carried for display, mirroring their convention exactly.
`recommendationId` is a nullable back-pointer.

**The fact that forced this.** `patientexerciserecommendations` has a **unique**
index on `{patientUserId, exerciseId}`, verified against the live database. It is
current state, not history — one row per patient per exercise, updated in place.
So sessions cannot hang off a recommendation as their parent: a patient doing
`heel_slide` twelve times has one recommendation row and twelve sessions. The
1:many must be patient → sessions.

**Rejected.** Embedding a `sessions[]` array in the recommendation doc or in
`patientprofiles` — both grow unbounded against the 16 MB document cap, both mean
writing a collection we do not own, and sessions for a removed exercise would
vanish with it. Keying on the `patientId` string instead of the ObjectId — human
readable, but needs a second hop to reach `users` and breaks if an id is ever
reissued.

---

### D11 — Whole session document inline, rep log included

**Chosen.** Summary, per-rep log, Gemini text and video metadata in one document.

**Why the rep log specifically.** `build_gemini_prompt_generic` consumes
`{rep, clean, best_angle, errors}`. Keeping it means the report can be
**regenerated against a revised prompt** without asking the patient to redo the
session — which matters directly, because D8 already commits to rewriting the
prompt. Drop the log and every prompt change only ever affects future sessions.

**Size is not an objection.** Roughly 20 reps × ~80 bytes ≈ 2 KB against a 16 MB
cap.

---

### D12 — Deep link carries exercise and recommendation only

**Chosen.** URL is `/dist/index.html?exercise=<theirId>&rec=<recommendationId>`.
The token comes from the shared `localStorage.authToken` (possible because of
D1). `patientUserId` comes from the verified JWT.

**Why identity never travels in the URL.** A URL-supplied patient id is a trivial
IDOR — change one character and record a session against someone else's clinical
record. The URL says *what to do*, never *who*.

**Rejected.** Token in the URL (survives an origin split, but lands the JWT in
access logs and `Referer`); a server-minted single-use handoff ticket (tightest,
but needs a new endpoint, a ticket collection and an expiry path for no gain
under D1).

---

### D13 — Our report page immediately, their plan page for history

**Chosen.** Session end → our `report.html?session=<id>`, which shows counts at
once and polls for the text. Their `ExercisePlan.jsx` gains a "Past sessions"
list linking back into the same page.

**Why.** `Report.jsx` and `dist/report.html` already exist from Phase J and
already poll a session endpoint — they simply have nothing to display yet.
Rebuilding that inside their React would duplicate a shipped page and require
EN/HI/MR for all its chrome. The history list is what makes a report findable a
week later.

---

### D14 — Doctor sees full history and report

**Chosen.** Their doctor patient-detail page gains the session list and report
text. Video playable only where `consentVideoMonitoring` is true.

**The authorization shape this forces.** A doctor must see only their own
patients, and that link lives on `hemophiliadetails.consultingDoctorId` — **not**
on `users` or `patientprofiles`. So our FastAPI cannot authorize a doctor from
the JWT alone; it needs a lookup into a collection we only read. Two consequences
worth remembering:

1. A patient with no `hemophiliadetails` row has **no doctor at all** and is
   invisible to every doctor.
2. This is one of the two high-effort tasks. An error here leaks one patient's
   clinical record to another patient's doctor, and will not appear in any test
   that uses a single patient.

**Why not counts-only.** The doctor gate in D7 exists so a clinician owns the
prescription. Letting them approve an exercise but never see how it was performed
closes half the loop. The failure *reasons* are the clinically useful part.

---

### D15 — Encryption-ready now, CSFLE enabled later

**Chosen.** Group every sensitive field under one `clinical:{}` subtree —
`repLog`, `report.text`, `video.path`. Write plaintext today. Enable CSFLE for
both the Node and Python clients in a single change once `crypt_shared` is
installed.

**Why not encrypt now.** CSFLE is off system-wide because `crypt_shared` is not
installed; `config/db.js` was patched to pass `bypassAutoEncryption: true` rather
than refuse to boot on Linux. A Python client would need `pymongocrypt` plus that
same library, so adding a second encrypted client today does not work — it
compounds the existing gap rather than closing it.

**Why the subtree matters.** One `schemaMap` entry on `clinical` later covers
everything sensitive at once, while the metrics outside it (`repCount`,
`startedAt`, `status`) stay queryable either way. **Do not move a sensitive field
out of the subtree for query convenience** — that is exactly how this decision
gets quietly undone.

**Current risk, stated plainly.** Every field their `schemaMap` marks encrypted
is now written in cleartext, mixed into collections that may already hold
encrypted documents. Reads still decrypt what was encrypted before, so it looks
like it works. The boot log says `CSFLE DISABLED (cleartext)`. Acceptable for a
development window against seeded data; not acceptable for real patient records.
G2-0.3 forces the call rather than letting it drift.

---

## Decisions deliberately NOT made

- **Phase I is not in scope.** No job queue, no MediaPipe Heavy re-extraction, no
  per-rep video cutting, no feature builder, no SHAP, no `report_builder.py`. The
  audit on 2026-09-09 found 13 of 15 Phase I tasks are ordinary backend plumbing
  with no model dependency; only I7 and I8 are genuinely model-blocked. Group 2
  does not start any of it.
- **The Gemini report is not the Phase I clinical report.** It is coaching prose
  generated from live rule-based rep counts. Per master plan E-DEC.6 a report
  separates what was measured from what was inferred; this is neither. The UI
  must not imply a model assessed the patient.
- **The LiveEMG viewer and Streamlit dashboard are not integrated.** They are a
  fourth codebase, not yet in this repo. Two forward-compatible choices were made
  so they slot in later without rework: signal data never enters MongoDB (files
  on disk, a pointer row in the DB — which is what `emg-service` already does
  with packed `.bin` files plus `data/history.json`), and every record carries
  `sessionId` and `patientUserId` from day one. Current EMG captures have neither,
  which is why joining them to a patient later would otherwise be forensic work.
- **Their `.env.example` credential and the two Atlas passwords are not rotated.**
  Flagged repeatedly; still outstanding. Tracked as G2-0.1 and G2-0.2.

---

## Corrections made during this session

Recorded so a future session does not re-derive them from a stale claim:

1. **Exercise overlap is not zero.** See D4. The earlier claim came from reading
   only `RULE_FALLBACK`, a 6-item subset of the real 24-item catalogue.
2. **The EMG viewer does not use gzipped CSV.** `emg_serial_capture.py:66` packs
   `struct.pack('<hh', signal, envelop)` into `.bin` files, with
   `data/history.json` as a flat manifest. The gzipped-CSV description belongs to
   the not-yet-present fourth system.
3. **Phase completion was overstated.** The claim "everything through Phase J is
   done except AI models" does not hold: Phase I is essentially unbuilt and most
   of it is not model-related, and Phase J fails its own manual end-to-end gate.
   Full audit appended to `docs/PROJECT-STATUS.md` on 2026-09-09.
