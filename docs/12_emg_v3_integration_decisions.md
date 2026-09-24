# EMG v3 integration — questionnaire and decision log

**Opened 2026-09-17. Last updated 2026-09-21.** Supersedes the recommendation
half of `docs/11_emg_v2_integration.md` (its *findings* still stand; its *phase
advice* predates the "drop live viewing" decision and is partly obsolete).

Security findings raised during this work are tracked separately in
`docs/security.md` and cross-referenced here as `S<n>`.

Live working document. Questions keep their number for the life of the
integration. Statuses:

- **LOCKED** — decided by the owner (or explicitly delegated to and decided by
  the implementer); do not relitigate without saying so
- **PROPOSED** — recommendation on the table, not confirmed
- **OPEN** — not yet discussed
- **V2** — deliberately deferred past the testing phase; see §5

Source of truth for the EMG service is `/home/billa-dakait/Desktop/Major_iot`
(branch `b1`). This repo's existing EMG code is discardable (D1).

---

## 0. Premise and standing rules

| | |
|---|---|
| **D1** | `Major_iot` is the primary source. Everything in `final_project` relating to the EMG/IoT device is **discardable** — the vendored July `emg-service/`, `emg_client.py`'s assumptions, `docs/02_emg_routes.md`, the staged `hardware/esp32_imu/` tree. |
| **D2** | **Live EMG viewing is dropped entirely.** The patient watches their own wireframe/posture, so a live EMG trace has no viewer. `live.html` and the browser-facing live-signal path go. Everything else — recording, `analysis.py`, `playback.html`, `history.html`, `progress.html`, annotations, firmware — is kept. |
| **D3** | Built for **multiple patients with their own devices**. Today there is **one** device, and during testing it must work across many accounts. |
| **R1** | **Ownership.** `part2/Hemophillia-confirm` and the engine are both fully owned. Comments calling part2 "theirs" (e.g. `backend/app/db.py:73-75`, "read-only (§1)") are historical; that boundary no longer constrains design. |
| **R2** | **Priorities: data security first and foremost, then future scalability.** |
| **R3** | **Validation.** Client side performs **input-format checks only**. All data verification, validation and checks happen **strictly server-side**. |
| **R4** | **This is the presentation phase.** The near-term goal is a working, demonstrable system — including a populated dashboard. Existing EMG recordings therefore **come across with the copy** as demo data. This re-reads, and in places reverses, earlier "just delete it" recommendations. See §6.1. |
| **R5** | **Proper multi-user is a goal, not a given.** Multiple patients and multiple doctors, each with their own relationships. The codebase today leans single-user-type in its data paths even though the role enum is already multi-role. EMG recordings must fit this model, not sit outside it. See §6.2. |

### Grill index

The interactive grill asked questions in this order; conversation references
("q3", "q7") map as follows.

| Grill | Topic | Outcome |
|---|---|---|
| Q1 | How many devices, physically? | D3 |
| Q2 | Where does the device lease live; restart survivability | D5 |
| Q3 | How does a session identify its device (sub-gaps G1–G7) | D6, D8–D13 |
| Q4 | Band-code storage and lookup | D7 |
| Q5 | Proof that the band belongs to the patient | Designed, then **deferred to v2** (§5.1) |
| Q6 | Assignment model: engine-owned collection + exclusivity | D8, D12 |
| Q7 | Recalibration during an active recording | D16, D17, D18 |
| Q8 | Pose-only sessions vs "only count calibrated recordings" | D20 |
| Q9 | Band dies mid-session on a band-required exercise | D21 |
| Q10 | Model variant selection when IMU data is absent | **V2** — §5.3 |
| Q11 | How `Major_iot` is copied in without becoming a second `part2/` | D22, D23 |
| Q12 | Who owns a demo recording under R5 | D24, D25 |
| Q13 | Is `clinician` a peer of `doctor` or a distinct tier | D26 — **PROPOSED, unconfirmed** |
| Q14 | Expose Flask and authenticate it, or keep it internal | D27 |
| Q15 | 404 vs 403 on authorization failure | D28 |
| Q16 | Demo surface for history/playback/dashboard | D29 — **temporary, expires at D25** |
| Q17 | Shape of `clinical.emg`; who writes it | D30 |
| Q18 | EMG↔patient link in `history.json` | D31 |

---

## 1. Decisions

### D4 — what dies with live viewing (LOCKED)

Derived from D2 and verified against `Major_iot/backend/app.py`: `data_queue`
has exactly one consumer, `event_stream()` (app.py:218), plus a drain in
`_start_recording_locked()` (app.py:332). Recording writes from the parsed
`lines` directly (app.py:166-180) and never touches the queue.

Removed, with no loss to recording:

- `website/live.html`
- `GET /api/stream` and `event_stream()`
- `data_queue` entirely, and its `maxsize=5000` bound
- `queue_drops` (would be permanently 0)
- the queue drain in `_start_recording_locked()`
- the destructive-read landmine from `docs/11` §4.1

*A short-lived server-side sample tap was proposed for the ownership challenge;
the challenge moved to v2 (§5.1), so this kill list stands as written.*

### D5 — lease in Flask memory; data made durable instead (LOCKED, grill Q2)

- The lease `{device_id: session_id}` lives in Flask memory only. A restart
  drops it; the device is claimable again immediately. No second copy of
  recording state in Mongo.
- On capture start the scratch file's first line is
  `# session_id=… device_id=… started=…`, so an orphaned partial is attributable.
- On boot, before the UDP thread starts: sweep `*.partial.csv` → `analyze()` →
  write `.csv.gz` with `# truncated=1` → append to `history.json` with its
  `session_id` → delete the partial. Reuses `_read_partial()`,
  `analysis.analyze()`, `_write_final_recording()`.
- Accepted cost: a restart mid-session loses the *remainder* of that capture; the
  session does not resume recording. Everything before the crash is kept and
  surfaces as `clinical.emg.truncated: true`.

Grounding: today nothing reads a `.partial.csv` back at boot (`app.py`
`__main__`), so a crash leaves an unanalysed, unattributed, unlisted file
despite the docstring promising crash survival.

### P1 — the device is a roaming resource, claimed per session (LOCKED)

1. **Device identity** — ESP32 MAC via `WiFi.macAddress()`, carried in HELLO.
   Today there is none: `last_device_addr` is a DHCP `(ip, port)` tuple, which is
   not identity and is spoofable (S3).
2. **Claim at session start** — engine → Flask claim; `200` claimed,
   `409 {"error": "device held", "held_by": "<session_id>"}`. Flask holds
   `{device_id: session_id}`; the dict is the whole N-device change.
3. **Stamp both ids into the recording** — `history.json` entry and
   `# session_id=` / `# device_id=` preamble lines.
4. **Release on session end, and on staleness** — a claim with no packets for N
   seconds is reclaimable.

**Amended:** P1 originally ruled out any device↔patient association. D6/D8/D12
replace that with an exclusive, audited band assignment. The per-session lease
still governs actual use.

### P2 — `409 device held` is a normal outcome (LOCKED — under review, Q8)

A session that cannot get the device runs **pose-only**, recorded on the session
doc. K4's concurrent clients (`backend/tools/test_k_gate.py:187`) never request
EMG, so they are unaffected. Pose-only sessions stay fully concurrent; only EMG
capture serialises.

**Amended by D20:** pose-only is valid only for exercises whose `primary_branch`
is `pose`. For `emg`/`both` exercises there is no pose-only fallback.

### P3 — Flask owns the lease; Mongo records it (LOCKED)

Flask owns it because Flask owns `current_temp_fh`, the contended resource.
Mongo stores `clinical.emg.deviceId` / `claimStatus` as a record of what
happened, never as the arbiter. Refined by D5.

### D6 — band code configured once, looked up per session (LOCKED, grill Q3)

- Band-code entry is done **once, in patient profile configuration**, not per
  session.
- Each live recording start: frontend → engine carries **exercise-selection
  data**; engine → Flask carries the **band code**. The client never holds or
  sends the code at session start.
- **No device code or other sensitive information in deep links.**

*D6's original "non-exclusive pairing" is superseded by D12.*

### D7 — unencrypted, engine lookup at session start (LOCKED, grill Q4)

- The band code is stored **unencrypted**. It is a hardware-id suffix, not PII;
  encrypting it would force CSFLE (master key + `mongo_crypt`) into the Python
  engine for no real protection. Atlas at-rest encryption still applies.
- At `/session/start` the engine resolves the current assignment **server-side**
  by JWT user id — same pattern as `resolve_patient_id()` (`db.py:72`) — and
  **snapshots** it onto the session doc, so a mid-session edit cannot rebind the
  recording.
- *Storage location refined by D8.*

### D8 — engine-owned band assignment collection (LOCKED, grill Q3/G1 + Q6)

Delegated under R1/R2 and confirmed in grill Q6.

```
emg_band_assignments
  userId        ObjectId
  bandCode      "A1B2C3"        // D9 format
  assignedAt    datetime
  revokedAt     datetime | null // null = current assignment
  assignedBy    userId          // patient, admin, or clinician
```

- **Append-only audit trail.** A change revokes the old row and inserts a new
  one; history of which band was on which account is never overwritten.
- **One narrow write path**: a dedicated engine route accepting only `bandCode`
  (Pydantic, `extra="forbid"`). Not reachable through part2's `profile.js`
  mass assignment (S1).
- **Double enforcement**: Pydantic format check in the route **and** a MongoDB
  `$jsonSchema` collection validator.
- **Minimal exposure**: band data is not part of the profile `GET`; it is served
  only by its own route.
- Scales with device lifecycle (last seen, firmware, replacement, stock).
- Session-start lookup: `find_one({userId, revokedAt: null})`.
- The patient still enters it inside profile configuration — the UI panel is
  backed by the engine route.

### D9 — code format (LOCKED)

6 hex characters = the last 3 bytes of the MAC (device-unique part), uppercase,
displayed as `EMG-A1B2C3`. Collision odds ~1 in 16.7M per pair.

### D10 — server-side format check on save (LOCKED, G4)

- Owner concern: server load. Resolution: the check is required by R3 and costs
  one 6-character regex on a rare action (saving a band assignment), never per
  sample — negligible.
- **No** "band online" check on save; a powered-off band must not block profile
  configuration.

### D11 — code discovery (LOCKED, G5)

- Code **printed on the band housing** (lives as long as the band; packaging
  gets discarded).
- **"Blink my band"** in profile configuration: engine → Flask → UDP `IDENTIFY`
  → distinctive LED pattern ~5 s. Wrong band stays dark, catching typos before
  save. Firmware already handles one server command (`RECAL` in `pollRx()`).
- Hosted by the engine (already talks to Flask). Authenticated and
  **rate-limited** against code enumeration (S16). Online status is checked
  here, not on save.

### D12 — exclusive assignment, enforced (LOCKED, G6 + grill Q6)

- Unique **partial** index on `bandCode` where `revokedAt: null` → at most one
  active account per band, enforced by the database.
- A patient may claim an **unassigned** band only. Taking over a band assigned
  to another account is **admin/clinician-only**.
- Testing with one band across accounts = explicit reassign (revoke + insert),
  fully audited.
- Replaces D6's non-exclusive pairing; closes the "read the label, bind the
  band" hole (S15). A per-session physical ownership check is deferred to v2
  (§5.1).

### D13 — mid-session calibration control (LOCKED, G7)

- Calibration is essential and must be recoverable when it goes wrong.
- `live.html` is gone, so a **Calibrate button on `live_session.html`** (the
  camera page) → engine route → existing Flask `/api/recalibrate`.
- All checks server-side: caller owns the session, session holds the band lease.
- What happens to data around a recalibration: D16.

### D14 — (reserved; `queue_drops`, questionnaire Q6)

Not yet decided. See §2.2.

### D15 — per-session ownership challenge → moved to v2

Designed in grill Q5, then removed from the testing phase as too complex. Full
problem statement and design preserved in §5.1.

### D16 — only calibrated recordings count; recalibration discards the past (LOCKED, grill Q7)

- **Only data recorded under a valid MPU calibration counts** as exercise.
- **Recalibration request → IoT recording ends immediately.** EMG and IMU samples
  recorded before the recalibration are **discarded and purged** (S17).
- **Video is recorded continuously for the entire session and is never cut in
  real time.** Each recalibration's **timestamp is recorded** on the session
  timeline. **Post-processing** removes video before the last valid starting
  line; only video under the final calibration is passed forward as input.
- **Pose frames and reps** before the final starting line are discarded the same
  way, so all sources cover the same time range.
- After recalibration the synchronizer (D18) brings every component to the
  starting line together; IoT capture resumes as a **new recording**.
- Consequence: every stored IoT recording has exactly **one** calibration, so the
  current single-calibration `.csv.gz` preamble stays valid. **No epoch markers**
  and no multi-calibration parser changes are needed.
- An audit record of each recalibration is kept (time, count, reason) — **without**
  biometric samples.
- Mid-recording `RECAL` is accepted only when requested by the engine for the
  session holding the band lease (server-side, S13).
- Stillness is verified server-side from IMU samples around the recalibration,
  not only from the device-computed `cal_shaky` (spoofable, S3). Failure →
  patient is asked to recalibrate again.
- Session-start order: **band claim → calibrate (limb still) → synchronized
  start**.

### D17 — pre-session disclaimer page (LOCKED)

- A page shown **just before the transition from the part2 website to the live
  assessment page**.
- Carries the warning that only recordings under a valid calibration count, and
  that recalibrating discards everything recorded before it (D16).
- **Designated home for all future warnings and tips.**
- *Proposed detail (not yet decided):* text served and versioned by the server,
  acknowledgment recorded server-side with the version it acknowledged (R3), so
  a deep link cannot skip it and a changed warning requires re-acknowledgment.

### D18 — clock synchronizer and all-ready gate (LOCKED requirement; design pending)

- EMG, IMU and video must be **in sync on one timeline**.
- **No component starts before every component is calibrated and ready**; all
  start together at the starting line.
- Applies at session start and after every recalibration (D16).
- Known constraints:
  - EMG and IMU already share one device clock and one packet; IMU is read every
    10th sample and held (up to 20 ms staleness), behind a ~44 Hz DLPF.
  - Packets carry **no device timestamp or sequence number** today (S14), and are
    batched 20 samples per datagram, so server arrival time is not sample time.
  - Video and pose frames are on the browser clock; the server is a third clock.
- Design depends on Q8 (whether the band is always part of the gate).

### D19 — band placement varies by exercise (LOCKED fact, tentative values)

Heel slide → ankle (or appropriate position); mini squat → thigh. *All placements
tentative until decided professionally.* Feeds Q51 (IMU orientation) and v2
§5.1.

### D20 — band requirement is per exercise (LOCKED, grill Q8)

`exercises.json` `primary_branch` (`pose | emg | both`, already validated by
`exercise_config.py:22`) decides whether a session needs the band:

- **`emg` / `both`** — band claim + valid MPU calibration are **required**. No
  pose-only fallback. `/session/start` refuses server-side (R3) when the band is
  unassigned, offline, already leased, or fails calibration. D16's
  "only calibrated data counts" applies.
- **`pose`** — camera only. The band plays no part, D16's calibration rule does
  not apply, and P2's pose-only path stays valid.

Consequences:

- The D18 start gate composition follows the exercise: three sources
  (video + pose + band) for `emg`/`both`, two for `pose`.
- **Testing-phase config:** only `mini_squat` becomes `"both"` — it is the one
  exercise with both a placement (thigh, D19) and rule logic
  (`checks/mini_squat.js`). The other five stay `"pose"` until their placement is
  professionally decided and their missing rule logic exists (§5.2).
- Rejected alternatives: band mandatory for *every* session (impossible today —
  four of six exercises have no placement at all), and allowing a `both` exercise
  to silently run pose-only (weakest reading of D16, and two classes of session
  data).
- Adding an exercise to the band set later is a **config-only** change.

### D21 — a band dropout ends the band part of the session (LOCKED, grill Q9)

Option **(c)** of §3, for the testing/presentation phase.

- A sustained dropout **ends the IoT capture**. The counted exercise is start →
  dropout. There is **no resume** under the same session; continuing means a new
  session.
- The capture is finalised through D5's existing path and marked
  `truncated`. One calibration, one recording, one preamble per session — every
  downstream assumption (D16's single-calibration `.csv.gz`, Q17's
  `clinical.emg` shape, D16's single-span video trim) stays true.
- **Brief gaps are tolerated.** The band counts as lost only after sustained
  silence — **5 s**, matching the firmware's own handshake timeout so both sides
  agree. Shorter gaps resume under the *same* calibration, nothing is discarded,
  and the gap is recorded for the report (feeds Q39).
- Rejected: **(a)** literal D16 (a 6-second brownout at minute 4 destroys 4 good
  minutes of clinical data for a fault the patient did not cause); **(b)**
  multi-recording sessions (correct long-term, but it reintroduces exactly the
  multi-span parsing, multi-span video trimming and epoch-marker work that D16
  bought its way out of). **(b) is logged to v2 — §5.3.**

**What has to be built.** None of this exists today:

- `udp_watchdog()` (`Major_iot/backend/app.py:187`) is **console-print only** —
  no state change, no event, no callback. "Band lost" is not a server concept.
- Ingest writes are packet-driven (`app.py:166-180`). No packets means no rows
  written, silently, while `recording_active` stays set.
- `last_packet_time` / `last_device_addr` are **globals, not per-device**, and the
  watchdog's ACK keepalive fires only at `last_device_addr`. Under D3 that is
  already wrong: the last device to speak wins the keepalive. A **per-device
  last-seen map** is required, and dropout detection is meaningless without it.
- `truncated=1` currently only exists on D5's boot sweep, not on a live dropout.

### D22 — `Major_iot` replaces the existing `emg-service/`; it is a module, not a guest (LOCKED, grill Q11)

The requirement: it must not stick out the way `part2/` does, but must not be
dissolved into `final_project` either, so that an EMG bug is still obvious to
localise.

**It lands in the existing `emg-service/` slot.** That directory is already a
stale July copy of this same project (see `project_emg_live_source` — it is what
broke Phase C), and `docker-compose.yml:2` already defines an `emg-service:`
service wired through nginx. So the copy **replaces the contents of a slot the
monorepo already knows about** rather than adding a new top-level directory.

What makes it a module rather than a guest — the concrete difference from
`part2/`:

| | `part2/` (the sore thumb) | `emg-service/` (the target) |
|---|---|---|
| Git | a whole foreign repo dumped in, its own origin | source only, no nested repo, no history carried (D23) |
| Deps | own `package.json` + `node_modules` | own `requirements.txt`, but **no vendored `venv/`** |
| Config | own `.env`, own conventions | the monorepo's single env + compose service |
| Surface | full app: frontend + backend + its own auth | one service behind the existing nginx route |

What stays intact, deliberately, so bugs stay localisable: the internal
`backend/` + `website/` + firmware layout, the module's own `CLAUDE.md`, and its
file and function names. A stack trace or a symptom still points at one
directory. Nothing is renamed to "fit in".

What does **not** come across:

- `venv/` — rebuilt from `requirements.txt` in the container.
- `gitkeys.txt` — it is untracked in `Major_iot` but **present in the working
  tree, and it held a live GitHub PAT**. It must never be copied.
- `sketch_jun22a bak`, `_tmp_*.raw`, `progress_cache.json` (derived), and the
  loose `WORK_DONE_*.md` planning files.
- All `.bin` recordings — see D23.

### D23 — copy the tree, not the history; keep the `.csv.gz` recordings, drop the `.bin` (LOCKED, grill Q11)

**No git history is carried.** `Major_iot`'s recordings are committed across
three commits (`8f3dcea`, `06ee326`, `502421c`) and are present on `b1`,
`master`, **and `origin/b1` / `origin/master`** — already pushed. Copying the
tree rather than the history means none of that enters `final_project`'s history,
with no `filter-repo` and no force-push on a shared branch. This also makes Q1
mostly moot: check out `b1`, confirm nothing needed is untracked, copy.

Note for the record: `Major_iot/.gitignore` carries the comment
`# EMG recordings and in-progress capture scratch files`, but the only rule under
it is `*.partial.csv`. The comment promised a policy the rule never implemented —
which is why the recordings were tracked at all. The fixed `.gitignore` must make
the rule match its own comment.

**Recordings that come across (R4).** The 11 `.csv.gz` captures + their
`.annotations.json` + `history.json` come, because the presentation needs a
dashboard with data in it. They are demo data, and they are treated as such:
they belong to no patient account and must be labelled that way (§6.1).

**`.bin` files are disregarded entirely.** All 15 legacy 4-byte `<hh>` captures
plus `emg_capture.bin` are dropped. They are not merely redundant — at the
current 16-byte stride they are **silently misparsed into plausible garbage**
rather than erroring (Q30). Not copying them removes the landmine instead of
documenting it.

### D24 — seeded demo patient + demo doctor, real relationship (LOCKED, grill Q12)

The demo data gets **real accounts**, not an unowned bucket. A seeded demo patient
and a seeded demo doctor, linked by the same relationship a real pair would use.

Chosen over a bare `demo: true` flag because the goal is to demonstrate a working
multi-user system (R5): a demo that exercises the real scoping path *is* the
better demo, and it costs one seed script. It also avoids building the
cross-patient disclosure bug (S12) in deliberately — "unowned" in a system that
filters by `patientUserId` tends to resolve to *visible to everyone*.

**The seed must create the `hemophiliadetails` row.** Per §6.2 the patient↔doctor
link is `hemophiliadetails.consultingDoctorId`, not a field on `User` or
`PatientProfile`. `db.py:78 make_lookup_doctor_id()` is fail-closed: a patient
with no `hemophiliadetails` row has **no** doctor and every doctor is denied. A
seed that creates only `User` + `PatientProfile` produces a demo doctor who
cannot see their own demo patient — and the failure looks like a permissions bug
rather than a missing row.

Seed requirements:

- demo patient `User` (`role: "patient"`, `accountStatus: "APPROVED"`)
- demo doctor `User` (`role: "doctor"`, `accountStatus: "APPROVED"`, a
  `professionalId` — it is `unique, sparse`)
- demo `PatientProfile` (supplies `patientId`, the `PATxxxxxx` display id that
  `resolve_patient_id()` snapshots at session start)
- demo `HemophiliaDetails` with `consultingDoctorId` = the demo doctor's `_id`
- the D23 demo recordings attributed to the demo patient
- both accounts clearly named as demo, so they are identifiable for removal

**Credentials handling.** The demo passwords are kept in **plaintext, outside the
project directory** — not in the repo, not in `docs/` (untracked by a blanket
`*.md` rule, but still inside the project tree and easy to copy by accident), not
in any scratch directory that gets shared. The owner keeps them in a personal
store of their choosing.

This is acceptable *specifically because* these are demo accounts holding demo
data and nothing else. It stops being acceptable the moment either account is
reused for a real patient, a real clinician, or any real capture. Two conditions
attach to it:

- **Never reuse the demo accounts for real data.** If real data needs to exist,
  make new accounts.
- **Before any deployment beyond the demo**, the accounts are removed or set to
  `accountStatus: "SUSPENDED"` — the enum already supports it — and the plaintext
  copy is destroyed.

### D25 — every dashboard is user-exclusive (LOCKED, grill Q12)

A hard requirement, not a later refinement:

- **A patient sees only their own dashboard, sessions and history.**
- **A doctor sees the sessions, histories and dashboards of only the patients
  assigned to them** — assignment being `hemophiliadetails.consultingDoctorId`
  (§6.2).

This applies to **every** surface, including the EMG service's own pages. Scoping
is enforced **server-side** (R3): the server returns only permitted rows. A
client-side filter over a full result set is not scoping, because the full set
already crossed the wire.

**Where this already holds:** the engine's `physiosessions` path. `patientUserId`
is documented as the only authorization key (`session_doc.py:62`),
`authorize_patient_access` (`auth.py:95`) gates on it, `doctorUserId` is snapshotted
at session start, and the doctor lookup is fail-closed (`db.py:78`). part2's
`doctorPatients.js` likewise filters by `consultingDoctorId`.

**Where it does not hold at all — the work this decision creates:** the EMG
service's operator pages. `history.json` is a single flat global list;
`history.html`, `playback.html` and `progress.html` plus `/api/progress` bucket
every recording globally; and Flask has **no auth of any kind** (Q24). Today any
viewer reaching those pages sees every patient's captures. This is Q20/Q21/Q24
(S12), and under R2 (security first) it outranks the dashboard polish it sits
next to. D25 makes it a blocker rather than an open question.

**Known gap that blocks part of this:** `clinician` is a valid `User` role that
`auth.py:119` does not authorize — it falls through to denied, while D8 and D12
assign it privileges. The role set must be settled before D25's rules can be
stated completely.

### D26 — `clinician` is a peer of `doctor` (PROPOSED — not confirmed by the owner)

**Status: PROPOSED.** Raised as grill Q13; the owner moved on without answering.
Do not treat as settled — confirm before building on it.

The inconsistency it addresses is real and live:

- **part2 treats `clinician` as a peer of `doctor` everywhere.** `staffAuth`
  (`roleMiddleware.js:30`) admits `["doctor","clinician"]`; `doctorAuth.js:262`
  logs both in through one path; `patientResearch.js:5749` is
  `allowRoles("doctor","clinician")`.
- **Decisively**, `hemophiliaDetails.js:1016` — the picker a patient chooses their
  consulting doctor from — queries `role: {$in: ["doctor","clinician"]}`. **A
  clinician can legitimately become a patient's `consultingDoctorId`.**
- **The engine denies that same person everything.** `auth.py:119` handles
  `admin`/`patient`/`doctor`; `clinician` falls through to `return False`.

So a clinician properly assigned as a patient's provider sees them in part2 and is
denied every `physiosession`, history and EMG view in the engine. A *false
denial* — safe direction, but it breaks D25's promise and will present as a random
permissions bug.

Proposed resolution:

1. `auth.py:119`'s doctor branch becomes `if user.role in ("doctor", "clinician")`,
   keeping the identical `consultingDoctorId` comparison. Fail-closed behaviour is
   unchanged — a clinician must still actually be that patient's assigned provider.
2. **Amend D8 and D12:** "admin/clinician-only" band takeover becomes
   **admin-only**. Those two decisions invented a privilege tier that neither
   codebase implements and neither has a way to grant. `User.adminLevel`
   (`SUPER_ADMIN`/`ADMIN`) and the `permissions` block are the existing mechanism
   if that override needs narrowing later.

Consequence to accept knowingly: `clinician` becomes **functionally redundant** —
a display label with no distinct privileges. That is fine, but if the distinction
should ever mean something, defining it now is cheaper than diverging later.

### D27 — `emg-service` stays internal forever; the engine proxies and scopes (LOCKED, grill Q14)

**Flask is never exposed to a browser.** It keeps no host port and gets **no nginx
location**. Every patient- or doctor-facing EMG read goes through the engine,
which enforces D25's scoping. Flask never learns what a user is.

Grounding: compose already says "internal only, no host port… reached at
`http://emg-service:5000` from inside the compose network", and nginx routes
`/api/` → hemo-backend, `/engine/` → backend, `/ws/`, `/dist/`, `/src/`, `/` →
hemo-frontend. **Nothing routes to emg-service.**

What this decides:

- **Q24 dissolves.** Flask needs no auth because no browser can reach it. The auth
  boundary is not built; it is declined.
- **Q25 dissolves.** `/api/*` only collides with nginx's `/api/` if emg-service
  gets a location. It does not get one. Flask's route naming stays as-is.
- **D25 is enforced in exactly one place** — the engine, which already has JWT
  verification against part2's secret, `authorize_patient_access`, and the
  fail-closed `lookup_doctor_id`. The rejected alternative (expose Flask, add JWT
  there) means **a second implementation of the doctor-assignment rule, in a
  second language, against a collection Flask does not currently query.** Two
  implementations of one authorization rule is where the disclosure bug comes
  from — one gets a fix the other misses.
- **Q23 is answered: absorbed.** Anything a patient or doctor sees becomes a
  scoped React view beside `Report.jsx`. `history.html`, `playback.html` and
  `progress.html` stop being the user-facing surface.

**Flask's own pages survive as unauthenticated bench/operator tools** for
debugging a capture — which is what D22's "keep EMG bugs localisable" was for.
They are never a user surface.

**Bench access needs a deliberate mechanism**, since the service is permanently
unexposed: a compose override that publishes the port locally, or
`docker compose exec`. Write it down and use it. Do **not** "temporarily" add an
nginx location — that is how it becomes permanent.

Cost accepted: the demo dashboard (R4) is a **new React view**, not
`progress.html`. It competes for the same time as §5.2.

### D28 — authorization failures return 404, never 403 (LOCKED, grill Q15)

On every resource scoped by `patientUserId`, "not yours" and "not there" must be
indistinguishable.

The current code is a disclosure oracle. `session.py:282-283` calls
`_load_or_404()` **then** `_authorize_or_403()`, so probing a session id returns:

- `404` → that session does not exist
- `403` → **that session exists, and belongs to someone else**

Any authenticated user can enumerate session ids and confirm which are real
without reading one — learning *that* a patient has sessions, and how many. Same
class of leak as the global `history.json`, quieter.

Decided:

- `_authorize_or_403` becomes `_authorize_or_404`, raising a response
  **byte-identical** to `_load_or_404`'s (`404 unknown session: <id>`).
- Applies to **every patient-scoped route and the WebSocket** — a WS closing with
  a distinguishable code leaks the same bit.
- **The engine's new EMG proxy endpoints inherit the rule**: another patient's
  recording is 404, never 403.
- `admin` is exempt; admins see everything regardless.

Accepted: a small timing difference remains on the exists-but-forbidden path (one
extra Mongo read). Not worth constant-time work here. Debuggability is unaffected —
bench debugging happens against Flask directly (D27), where none of this applies.

*Note: "manual Flask URL → 404" has no literal target. Under D27 no browser can
reach Flask at all; nginx's `location /` catch-all serves the SPA. The real
decision that instinct maps to is this one.*

### D29 — demo stopgap: Flask pages shown as operator tooling (LOCKED — **temporary, must be replaced by D25/D27**)

For the 2026-09-22 presentation only. `history.html`, `playback.html` and
`progress.html` are shown **as clinician/operator tooling**, reached through a
temporarily published port, not as the patient surface.

**This is a deliberate, time-boxed violation of D27**, taken because the scoped
React views and their engine proxy endpoints cannot be built the night before.
`frontend/app/src/pages/` holds two files (`ExerciseSelect.jsx`, `Report.jsx`);
the dashboard, history and playback views do not exist.

Conditions attached:

- **Nothing is presented as patient-scoped.** These pages are globally unscoped
  and must not be described otherwise. It is safe *only* because the demo
  database holds one patient, so there is nothing to disclose.
- **The temporary port publication is reverted immediately after the demo.**
  It must never become an nginx location (D27).
- **This decision expires on contact with D25.** The moment a second patient
  exists in any environment these pages serve, this stops being acceptable.
  Replacement is §7.2: engine proxy endpoints + scoped React views.

### D30 — `clinical.emg` carries metrics and a pointer, never samples (LOCKED, Q17 + Q18)

**Shape:** recording filename, `sampleRate`, `numSamples`, calibration,
computed metrics, `bandCode` snapshot, recalibration audit (D16), `truncated`
(D5/D21). **Never raw samples.**

Four independent reasons, any one sufficient:

- **Mongo's 16 MB document limit.** 500 Hz × 10 min ≈ 300k samples × 8 fields
  overruns it and the write fails mid-session.
- **Every read pays for them.** Session lists, dashboards and a doctor's patient
  view all pull the whole document; fat docs also evict useful data from the
  working set.
- **Two sources of truth.** The `.csv.gz` is already authoritative. A second copy
  diverges the first time one path is fixed and the other is not.
- **Security surface (R2).** Session docs are read by many code paths, the
  `.csv.gz` by few. Raw biometrics belong in the narrow place, not in every
  document a list query returns.

**Who writes it (Q18): the engine polls Flask after stop.** No Flask→engine
callback, so Flask keeps no knowledge of the engine and no retry/auth path back
into it.

### D31 — `history.json` gains `patient_user_id` (LOCKED, Q22)

New recordings carry `patient_user_id` in their `history.json` entry. This is the
EMG-side patient link every item in §7.2 depends on, and the session doc alone
cannot supply it — the legacy demo recordings have no session at all.

**Scope: new recordings only.** Back-stamping the copied demo recordings is being
done by the owner directly and is not an implementation task.

Note for whoever builds the scoped views: the 11 demo recordings have **no
`session_id`**, so they surface in EMG history and the dashboard but are not
`physiosessions`. "Session history" and "EMG history" are two different data
sources until a recording is made through a real session.

### D32 — exercise choice is server-validated, not client-selected (LOCKED)

**part2 deep-links the patient straight into execution of the selected exercise.**
The patient does not pick from a list on the engine side — `ExerciseSelect.jsx`'s
grid is not part of the patient flow; the assignment gate lives in part2, which
already knows what was assigned.

Consequence under R3: **a deep link is client-supplied input.** The exercise id in
the URL is editable, so `/session/start` must verify **server-side** that the
requested exercise is an `ACTIVE` `PatientExerciseRecommendation`
(`part2/.../models/PatientExerciseRecommendation.js`) for the authenticated user,
and refuse otherwise. This is a check at session start, **not** a filter over
`/engine/exercises` — smaller, and it is the only form that actually gates.

Combined with D6 ("no device code or other sensitive information in deep links"),
the rule is: a deep link may carry *what was requested*, never *what was
permitted*. Permission is always re-derived server-side.

---

## 2. Questionnaire

### 2.1 Copy & ownership

| # | Question | Status |
|---|---|---|
| Q1 | `Major_iot` HEAD is branch `b1` with untracked files. Copy from a committed `b1`, or merge to `master` first? | **DECIDED — D23** — neither; copy the tree, carry no history |
| Q2 | Does `emg-service/` become read-only downstream (fixes upstream, then re-copy), or fork here and `Major_iot` stops being primary? | OPEN — *rec: fork here; D22 makes it a module of this repo, and a copy with no history cannot cleanly re-copy* |
| Q3 | `Major_iot/backend/test_*.py` (1207 lines, 5 files, needs Flask). Come along and run in CI? | OPEN |
| Q4 | `emg_serial_capture.py` / `emg_review.py` are serial-era. Drop, or keep as bench tools? | OPEN |

### 2.2 What dies with live viewing

| # | Question | Status |
|---|---|---|
| Q5 | Full kill list confirmed? | **DECIDED — D4** |
| Q6 | `queue_drops` becomes permanently 0. Remove from `/api/status`? | OPEN — *rec: remove* |
| Q7 | Is `/api/live-value` wanted at all? | OPEN — *rec: no; no browser consumer. Retires `docs/11` §5.2* |
| Q8 | H3 `_emg_relay`: delete, or repurpose to push device health? | OPEN — *rec: repurpose (see Q9)* |
| Q9 | Does `live_session.html` keep an EMG health indicator? | OPEN — *rec: yes; D13's calibrate button and D18's ready gate need status context* |

*(Questionnaire Q8 above is unrelated to grill Q8 in §3.)*

### 2.3 Capture lifecycle

| # | Question | Status |
|---|---|---|
| Q10 | Who starts recording? | PARTLY — engine, via P1 claim, after calibration, at the D18 synchronized start |
| Q11 | Who stops it? `end_session()` converges all three end paths but is async; `stop_recording` runs `analyze()` synchronously over ~48k rows. | OPEN |
| Q12 | Phone dies mid-session — who stops the recording? | **Mostly answered — P1.4 + D5.** Still open: staleness detection while Flask stays up |
| Q13 | EMG start fails — does `/session/start` still succeed? | **DECIDED — D20** — yes for `pose` exercises; refused server-side for `emg`/`both` |
| Q14 | Session ends with no EMG running — silent or flagged? | OPEN — *rec: flag* |
| Q15 | Singleton recording vs overlapping sessions | **DECIDED — P1/P2** |
| Q50 | How does a session learn which device to claim? | **DECIDED — D6, D7, D8** |

### 2.4 Join key

| # | Question | Status |
|---|---|---|
| Q16 | `session_id` into `history.json` + preamble | **DECIDED — P1.3** (+ `device_id`) |
| Q17 | Shape of `clinical.emg` on the session doc | **DECIDED — D30** |
| Q18 | Flask callback into engine, or engine polls after stop? | **DECIDED — D30** — engine polls |
| Q19 | 20 existing recordings with no session id | **PARTLY — D23 + §6.1** — 11 `.csv.gz` come as demo data; how they are labelled/scoped is §6.1 |

### 2.5 Patient scoping

| # | Question | Status |
|---|---|---|
| Q20 | `progress.html` buckets all recordings globally | **BLOCKER — D25** — cross-patient disclosure (S12); must be patient-scoped server-side |
| Q21 | `history.html` / `playback.html` global file list — who may see it? | **BLOCKER — D25** — patient sees own only; doctor sees assigned patients only (S12) |
| Q22 | `history.json` gains `patient_user_id`, or session doc is the only link? | **DECIDED — D31** — `patient_user_id`, new recordings only |
| Q23 | Operator pages stay separate, or absorbed into `frontend/app/` as patient-scoped views? | **DECIDED — D27** — absorbed for any patient/doctor surface; Flask pages survive as bench tools only |

### 2.6 Auth boundary

| # | Question | Status |
|---|---|---|
| Q24 | Flask has no auth. JWT or nginx gating for reachable pages? | **DISSOLVED — D27** — Flask is never browser-reachable, so it needs no auth |
| Q25 | `/api/*` collides with nginx `/api/` → hemo-backend. Re-prefix or separate port? | **DISSOLVED — D27** — no nginx location for emg-service, so no collision; route names stay |

### 2.7 Transport & deploy

| # | Question | Status |
|---|---|---|
| Q26 | `ports: ["8888:8888/udp"]` on `emg-service` | OPEN — *rec: yes, required* |
| Q27 | `/api/status.server_ip` reports the container IP under Docker | OPEN |
| Q28 | Hardcoded WiFi credentials / `HOST_IP` in firmware | OPEN — D3 pressure; S10 |
| Q29 | Flask dev server vs gunicorn | OPEN |
| Q49 | `emg-service` has no `volumes:`; rebuild destroys recordings | OPEN — *rec: named volume, required for D5 to mean anything* |

### 2.8 Data & legacy formats

| # | Question | Status |
|---|---|---|
| Q30 | 15 legacy `.bin` (4-byte `<hh>`) would be silently misparsed at a 16-byte stride | **DECIDED — D23** — disregarded entirely, not copied |
| Q31 | Vendored `history.json` compact timestamps break the string sort in `/api/progress` | **REOPENED by R4** — `history.json` now comes across, so the sort bug must be *fixed*, not dropped. Blocks the demo dashboard |
| Q32 | Per-session / per-patient subdirectories for recordings? | OPEN |
| Q33 | `MV_PER_COUNT` is uncalibrated — show mV or counts? | OPEN — *rec: counts, or label as uncalibrated* |

### 2.9 Operator controls

| # | Question | Status |
|---|---|---|
| Q34 | Where does recalibrate live? | **DECIDED — D13** |
| Q35 | `/api/recalibrate` returns `409` while recording | **DECIDED — D16** (recording ends at recalibration request) |
| Q36 | Surface `cal_shaky` to the patient/clinician? | **DECIDED — D16** (server-side stillness check; failure prompts recalibration) |
| Q37 | `<emg-nav>` classes absent from this repo's Tailwind config | OPEN — *rec: keep operator pages self-contained* |
| Q38 | Palette token names collide with different values | OPEN — *corrects `docs/11` §5.5* |

### 2.10 Failure & degradation

| # | Question | Status |
|---|---|---|
| Q39 | ESP32 dies mid-session — report says so? | OPEN — *rec: yes; also interacts with D16 (video after band death has no calibrated IoT data)* |
| Q40 | No UDP sequence numbers → undetectable loss | OPEN — S14; also blocks precise D18 sync |
| Q41 | `cal_shaky: true` → block, warn, or omit IMU metrics? | **DECIDED — D16** (recalibrate; data before a failed calibration does not count) |

### 2.11 Firmware lineage

| # | Question | Status |
|---|---|---|
| Q42 | ESP32-S3 (`Major_iot`) wins, C3 tree discarded? | OPEN — *D1 implies yes* |
| Q43 | Salvage C3's arm/disarm + gap detection into S3? | OPEN — relevant to D18 (device timestamps, sequence numbers) |

### 2.12 Verification

| # | Question | Status |
|---|---|---|
| Q44 | `test_k_gate.py:138` passes with zero samples flowing | OPEN — *rec: assert samples arrived* |
| Q45 | Reopen Phase C, K1, K2 in `PROJECT-STATUS.md`? | OPEN — *rec: yes* |
| Q46 | Acceptance test | OPEN — *rec: real session, real band, `.csv.gz` preamble `session_id` matches the pose session doc, D18 start aligned across all sources* |

### 2.13 Privacy & retention

| # | Question | Status |
|---|---|---|
| Q47 | Recordings not gitignored in `Major_iot` → biometrics into git history on copy | **DECIDED — D23** — tree copied without history; `.gitignore` fixed so its rule matches its own comment. Residual: the copies already pushed to `origin/b1`/`origin/master` are a separate upstream question (§6.1) |
| Q48 | EMG recording retention policy | OPEN — D3 raises stakes |

### 2.14 Raised during the grill

| # | Question | Status |
|---|---|---|
| Q51 | Placement differs by exercise (D19). `mpuCalibrate()` sets `cal_az = mean_az - 16384`, assuming Z points up at rest; `summarize()` computes tilt as `atan2(hypot(ax, ay), az)`. At thigh/ankle, gravity falls on other axes → calibration zeroes the wrong axes and tilt/ROM are meaningless. Per-placement calibration and axis mapping? | OPEN — **blocks trustworthy IMU data under D13/D16** |
| Q52 | Where placement definitions live and who authors clinically-safe limits | OPEN — placements tentative pending professional input |
| Q53 | Server-side sample tap for the ownership challenge | **V2** — §5.1 |
| Q54 | part2 `profile.js` mass assignment | OPEN — tracked as S1 |
| Q55 | Per-service Mongo users / least privilege | OPEN — tracked as S9 |

---

## 3. Resolved — grill Q9 (see D21)

**Grill Q9 — the band dies mid-session on a band-required exercise.**
**Resolved: option (c), LOCKED as D21.** The analysis below is kept because §5.3
revisits it.

Under D20 the band is required for `emg`/`both` exercises, so a dropout breaks
that requirement partway through a session.

Facts:

- `/api/status` counts the band live if a packet arrived within **2 s**; the
  watchdog warns at **3 s**; the firmware drops `handshaked` after **5 s** with no
  `ACK`.
- D5 already finalises an interrupted capture and marks it `truncated`.
- Video keeps recording regardless (D16), so footage after the dropout has no
  band data behind it.
- **A reconnect means a fresh `mpuCalibrate()`** — the band recalibrates at boot
  and its offsets are gone after a power cycle.

The sharp edge: D16 discards everything before a new calibration. That rule was
written for a patient fixing a *bad* calibration; applied to a band that died, it
would throw away a valid first half.

Options:

- **(a) Apply D16 literally.** Reconnect → recalibrate → everything before is
  discarded. One rule, no special cases; a 6-second battery glitch at minute 4
  destroys 4 good minutes.
- **(b) Distinguish the reason.** Patient-requested recalibration discards the
  past; a reconnect after a dropout keeps the earlier data as recording #1 and the
  post-reconnect data as recording #2 under one session, gap excluded. Nothing
  valid is lost, but sessions hold several recordings, video needs multi-span
  trimming, and the *reason* must be established server-side (S13), never taken
  from the client.
- **(c) A dropout ends the band part of the session.** Counted exercise = start
  → dropout. No resume; the patient starts a new session to continue. Keeps one
  calibration and one recording per session, which the rest of the design now
  assumes, and D5's `truncated` flag already describes it.

*Decided: (c) for the testing/presentation phase — D21. (b) logged to §5.3 for when
several bands are in use and losing half a session actually costs a patient
something.*

Plus, independent of the choice: **tolerate brief gaps.** The band counts as lost
only after sustained silence (suggested **5 s**, matching the firmware's own
handshake timeout so both sides agree). Shorter gaps resume under the *same*
calibration — nothing is discarded, and the gap is recorded for the report.

---

## 4. Cross-cutting notes

**D3 re-weights severity.** Multi-patient, multi-device turns Q20–Q23 into
disclosure questions, Q24/Q25 into a real trust boundary, Q28 into provisioning,
and Q32/Q48 into data governance.

**R1 removes a constraint.** `MASTER_BUILD_PLAN_v3.md` §1 treats part2
collections as read-only for the engine. With full ownership, placement follows
R2 (security, then scalability) — which is what put band assignments in an
engine-owned collection (D8) rather than on `PatientProfile`.

**Misattribution.** A band moving between accounts makes one patient's EMG under
another's record a live risk. In the testing phase the layers are exclusive
assignment (D12) and — still to be built — verifying `device_id` from the packet
rather than the source IP (S3). The per-session physical ownership check is v2
(§5.1); until then, the residual risk is accepted for testing only.

---

## 5. V2 — deferred past the testing phase

### 5.1 Per-session band ownership verification

**Status:** V2. Designed in grill Q5; removed from the testing phase as too
complex to build and operate during testing.

**Problem.** Exclusive assignment (D12) proves an account is *allowed* to use a
band, not that the band is on *this patient's body* for *this session*. The band
code is printed on the housing (D11), a band can be lent or swapped, and UDP is
spoofable (S3). With multiple patients (D3), a band worn by someone else — or a
second band streaming at the same time — can record another person's muscle and
movement data under this patient's account. That is misattribution of clinical
biometric data.

**Solution designed.**

- **Timing-locked randomness.** At session start the server generates, with a
  CSPRNG: 3–4 prompts drawn from the exercise's allowed set, a random 1.5–4 s
  delay before each, random hold durations where applicable. Two sessions started
  simultaneously on different machines get different timelines; a band's
  responses line up only with its own session. Timing is the primary proof;
  movement choice adds variety.
- **Plausibility per exercise.** `exercises.json` gains, per exercise, the band
  placement (D19) and an `ownership_challenge` block: allowed prompts (e.g. mini
  squat → `partial_knee_bend`, `quad_tense_hold`, `heel_raise`), amplitude caps
  inside the exercise's own safe range, and the band's limb only. Never an
  implausible range, never a different limb. Caps require professional input.
- **Three channels, verified server-side:**

  | Channel | Source | Pass condition |
  |---|---|---|
  | EMG | band `envelop` → `analysis.find_contractions()` | contraction onset within ±600 ms of each contraction prompt |
  | IMU | band `gx/gy/gz`, `ax/ay/az` | motion burst within ±600 ms of each movement prompt; near-still between prompts |
  | Pose | `pose_batch` frames arriving over the session WebSocket | tracked joint angle changes in the same windows, same direction |

  Pose is decisive: IMU motion correlated with **camera-observed** limb motion
  proves the band is on the person in front of this camera, logged into this
  account.
- **Runs every session**, between calibration and the synchronized start.
- **Failure** → no EMG claim, outcome logged; up to 2 retries with fresh
  challenges; 3 failures → flag on the profile for clinician review. Data from a
  failed challenge is not stored under the patient's account (it may be someone
  else's biometrics).
- **Infrastructure it needs:** a short-lived server-side sample tap during the
  challenge window (Q53), and synchronized clocks (D18) to judge ±600 ms windows
  across device and browser timelines.
- **Side benefit:** the aligned events across EMG, IMU and pose can also measure
  and verify residual clock offset for D18.

### 5.2 Missing rule-based exercise logic — URGENT

**Status:** V2 section, flagged **urgent** by the owner.

**Problem.** `frontend/app/src/pages/ExerciseSelect.jsx` `PREVIEW` lists six
exercises. Rule-based logic exists for only the three marked `analysis: true`.
Findings from the graphify graph (`graphify-out/graph.json`):

| Exercise | `analysis` | Rule-based logic | Other code |
|---|---|---|---|
| `mini_squat` | true | `frontend/src/lib/checks/mini_squat.js` | ML extractor `backend/ml/exercise_extractors/mini_squat.py` |
| `seated_knee_extension` | true | `frontend/src/lib/checks/seated_knee_extension.js` | ML extractor `backend/ml/exercise_extractors/seated_knee_extension.py` |
| `straight_leg_raise` | true | `frontend/src/lib/checks/straight_leg_raise.js` | — |
| `heel_slide` | false | **none** | ML extractor `backend/ml/exercise_extractors/heel_slide.py` only |
| `squat` | false | **none in live code** | legacy only: `backend/_old_physio_reference/exercises/squat.py` (+ superseded copy), `posture_checks.py` |
| `terminal_knee_extension` | false | **none** | **nothing anywhere in the graph** |

Shared rule infrastructure: `frontend/src/lib/rules.js`,
`frontend/src/lib/checks/shared.js`, `frontend/src/lib/checks/index.js`, tested by
`frontend/tests/rules.test.mjs`.

**Why it is urgent.**

- Three of six offered exercises cannot give rule-based posture feedback or rep
  judgments.
- **Heel slide is one of the two exercises with a planned band placement (D19,
  ankle)**, yet has no rule logic — a band session on it would have EMG/IMU data
  and no rule-based assessment to pair it with.
- Terminal knee extension has no implementation of any kind.

**Solution.**

1. `checks/heel_slide.js` — author from clinical spec; `heel_slide.py` extractor
   shows which joints/angles the ML side already uses.
2. `checks/squat.js` — port from the legacy `_old_physio_reference` squat logic
   and `posture_checks.py`, re-validated against the current rules contract.
3. `checks/terminal_knee_extension.js` — author from clinical spec; no existing
   code to port.
4. Register each in `checks/index.js`; add cases to `rules.test.mjs`; confirm each
   has an entry in `backend/app/config/exercises.json`.
5. Flip `analysis` to `true` in `PREVIEW` only once logic and tests exist.

**Open items.**

- ~~`backend/app/config/exercises.json` is not in the graphify graph~~ — **wrong,
  corrected 2026-09-21.** The file exists and was read directly. All six entries
  are `primary_branch: "pose"`, so D20's band set requires flipping `mini_squat`
  to `"both"`.
- **Unverified R3 concern:** all rule logic runs in the browser. If rep counts
  and clean-rep judgments are decided there and the server only checks internal
  consistency (`session.py` verifies reps are `1..n` in order), data decisions
  are being made client-side. To confirm by reading the check files before
  logging in `docs/security.md`.

### 5.3 Two model variants per exercise, lazy-loaded

**Status:** V2. Raised by the owner at grill Q10. **No model is loaded at runtime
today**, so this is the spec for a loader that does not exist yet, not a change to
one — `backend/app/main.py:23` is still a commented-out placeholder
(`# app.state.model_bundle = joblib.load(...)`).

**The plan.** Train **two models per exercise**: one on pose features alone, one
on pose + IMU features. At scoring time, **lazy-load whichever matches the data
that actually exists** for that session — IMU present → the IMU variant, IMU
absent → the pose-only variant.

**Why this matters beyond convenience.** It is what makes a bandless session a
*declared* second class of data rather than a silently degraded one — which is
precisely the thing D20 rejected when it refused to let a `both` exercise run
pose-only. So **D20's "no pose-only fallback" is correct for the testing phase and
gets revisited in v2 together with this**, not before. The two must move together.

**It also resolves D21's sharp edge.** Under D21 a dropout truncates the session;
with a pose-only model, the post-dropout span is still scoreable rather than
worthless, which is what makes §3's option (b) worth returning to at that point.

**What the existing code already supports:**

- The package layout is per-exercise directories — `trained_models/mini_squat/`
  holds `model.joblib`, `feature_names.json`, `labels.json`, `impute_median.json`
  — with `_previous/` for rollback, `_uploads/`, an admin upload route
  (`backend/app/routes/admin_models.py`) and a validator. **A variant is another
  directory level, not a redesign.**
- The feature pipeline is additive: landmarks → `common_features.parquet` →
  per-exercise extractor (column selection + derived columns) →
  `aggregate_features.clip_features` → train. IMU columns append at the extractor
  stage; nothing in the pose path has to change.
- Every model that exists today is already the no-IMU variant.

**Open items when this is picked up:**

- **Variant selection must be server-side (R3), from the recording's span on the
  session doc — never a client flag.** D21 is what keeps this binary: because a
  dropout ends the capture, the analysed window either has IMU for its whole span
  or none at all, never partial. Under §3's option (b) this becomes a per-span
  choice with two models' outputs to reconcile into one report.
- **The IMU variant has zero training data.** It can only train on clips recorded
  with a band worn, which is a strictly smaller set that does not exist yet — it
  starts accumulating once band sessions run on `mini_squat`. This is gated on a
  data-collection campaign, not on code. For scale: the current pose models
  trained on 45 clips / 8 groups, and `model_card.json` already shows precision
  0.0 / recall 0.0 on some labels.
- **The variant must be stamped on the session doc beside the score.** Two
  variants score from different feature spaces; if progress trending plots them on
  one line without knowing which produced each point, a band dropout reads as a
  clinical change that never happened. Cheap now, expensive later. Ties into Q20.
- Only `mini_squat` can have an IMU variant at all today — it is the one exercise
  in the band set (D20). The rest wait on §5.2.

### 5.4 BMS board and battery-low warning

**Status:** V2. Raised by the owner at grill Q9.

A BMS board is to be added to the band so that **battery state is known before a
session starts**, not discovered when the band dies mid-exercise. The patient is
shown a battery-low warning and **chooses**: charge the device and come back
later, or proceed now without the device, accepting reduced accuracy.

This is the demand-side reason §5.3 exists — "proceed without the device" is only
an honest offer once there is a pose-only model to score the result with, and the
warning is where the accuracy trade-off gets stated to the patient. D17's
disclaimer page is the natural home for that warning.

It also makes D21 mostly a fallback rather than a routine path: the common cause
of a mid-session dropout becomes something the patient was warned about and chose
around, instead of a surprise.

---

## 6. Standing project context

*This section exists so the context below does not have to be re-explained in
future sessions. It is background, not decisions — the decisions it feeds are
cross-referenced.*

### 6.1 Presentation phase (R4)

The project is in its **presentation phase**. The near-term deliverable is a
system that visibly works end to end, and that includes a **dashboard with real
data in it**. A technically correct empty dashboard is a failed demo.

Consequences, which reverse some earlier recommendations in §2:

- **The `.csv.gz` recordings come across** with the copy (D23). Earlier "rec:
  delete" notes on Q19/Q30/Q31 were written under a clean-slate assumption that
  R4 overrides. `.bin` files are still dropped — they are not demo data, they are
  a silent-misparse hazard (Q30).
- **Q31 flips from "drop it" to "fix it".** `history.json`'s compact timestamps
  break the string sort in `/api/progress`. Since `history.json` now comes across
  to feed the demo, that sort bug is on the critical path to the dashboard.
- **Demo recordings are not patient data and must not masquerade as it.** They
  predate sessions, band assignments and accounts entirely — no `session_id`, no
  `device_id`, no owner (Q19). Under R5 they need to be explicitly labelled as
  demo/unattributed rather than silently adopted by whichever account first
  displays them. How they are labelled and scoped is **open** and depends on §6.2.
- **Residual, accepted for now:** the biometric recordings already pushed to
  `Major_iot`'s `origin/b1` and `origin/master` are untouched by D23. D23 protects
  `final_project`'s history; it does nothing about the upstream copies. Whether
  that needs a scrub-and-force-push depends on whose captures they are and whether
  that remote is private — **unanswered**, and worth answering before the repo is
  shared more widely (S6).

### 6.2 Multi-user is the target; the schema is halfway there (R5)

The system is to be **properly multi-user: multiple patients and multiple doctors,
each with their own relationships**. EMG recordings must fit inside that model.

**What already exists** (verified via the graphify graph, then read directly):

- **Roles are already multi-role.** `part2/.../models/User.js` defines
  `role: ["patient", "doctor", "clinician", "admin"]`, plus `accountStatus`
  (`PENDING`/`APPROVED`/`REJECTED`/`SUSPENDED`), admin `permissions` flags, and
  CSFLE on `email`. Route guards exist in
  `part2/.../middleware/roleMiddleware.js` (`staffAuth()`, `allowRoles()`).
- **The patient↔doctor link lives in an unexpected place.** It is **not** on
  `User` and **not** on `PatientProfile` — `PatientProfile` has no doctor field at
  all. It is `hemophiliadetails.consultingDoctorId`. A doctor's patient list is
  built by `part2/.../routes/doctorPatients.js:498`
  (`HemophiliaDetails.find({ consultingDoctorId })`), then joined out to profiles.
- **Reassignment has a workflow**, but only one direction: `DoctorChangeRequest`
  (patient requests release; status `PENDING`/`RELEASED`/`CANCELLED`;
  `releasedBy` recorded).
- **The engine already consumes the doctor seam correctly and fail-closed.**
  `backend/app/db.py:78 make_lookup_doctor_id()` resolves
  `consultingDoctorId` by `patientUserId`; a patient with no `hemophiliadetails`
  row has **no** doctor and every doctor is denied rather than guessed.
  `backend/app/models/session_doc.py:65` snapshots `doctorUserId` onto the session
  at start, with a `doctorUserId_startedAt` index, and `patientUserId` is
  documented as *the only authorization key*.

**Where it falls short of R5:**

- **The doctor relationship is stored inside a disease-specific model.** For a
  rehab/physio engine, "which doctor may see this EMG session" routes through a
  *hemophilia details* document. It works today because there is one disease
  context; it is the wrong home for a general patient↔doctor relationship and is
  the first thing that breaks when the relationship needs to be many-to-many, or
  to exist for a patient with no hemophilia record.
- **`clinician` is a role that nothing authorizes.** `backend/app/auth.py:119`
  handles `admin`, `patient` and `doctor`; `clinician` — a valid value in the
  `User` enum — falls through to denied. Meanwhile D8 and D12 both assign
  privileged actions ("admin/clinician-only" band reassignment) to that role.
  **This must be resolved before D12's reassignment path is built.**
- **EMG recordings have no patient scoping whatsoever.** `history.json` is one
  flat global list and `progress.html` buckets every recording globally, so any
  viewer sees every patient's data (Q20, Q21 — S12). This is the single largest
  gap between the EMG service and R5, and under R2 (security first) it outranks
  the dashboard polish it sits next to.
- The engine's `physiosessions` docs are correctly per-patient; **the EMG
  service's own files are not**. Bridging that is Q22's question of whether
  `history.json` gains a `patient_user_id` or the session doc stays the only link.

---

## 7. TODO

Open action items, newest first. Ordered within each block by what blocks what.

### 7.1 Demo accounts and data (D23, D24 — R4)

- [ ] Write the demo seed script: demo patient `User`, demo doctor `User`
      (with `professionalId`), demo `PatientProfile`, and **demo
      `HemophiliaDetails` carrying `consultingDoctorId`** — the last one is the
      easy omission that makes the doctor unable to see their own patient.
- [ ] Choose and record the demo credentials **in plaintext outside the project
      directory**. Not the repo, not `docs/`, not a shared scratch dir.
- [ ] Attribute the 11 copied `.csv.gz` recordings to the demo patient.
- [ ] Name both accounts recognisably as demo so they can be found and removed.
- [ ] Before any non-demo deployment: remove or `SUSPEND` both accounts and
      destroy the plaintext credential copy.

### 7.2 Dashboard exclusivity (D25, D27, D28 — R2, R5)

- [ ] Decide the EMG-side patient link (Q22): `history.json` gains
      `patient_user_id`, or the session doc stays the only link. Everything below
      depends on it.
- [ ] Build the engine's EMG proxy endpoints, patient-scoped server-side (D27).
- [ ] Build the scoped React views replacing `progress.html` / `history.html` /
      `playback.html` for patients and doctors (Q20, Q21, Q23).
- [ ] Implement the doctor view: only patients whose
      `hemophiliadetails.consultingDoctorId` is that doctor.
- [ ] `_authorize_or_403` → `_authorize_or_404`, byte-identical to the not-found
      response; cover the WebSocket too (D28).
- [ ] Confirm or reject **D26** (`clinician` as peer of `doctor`) — still
      PROPOSED. Blocks a complete statement of D25 and D12's reassignment path.
- [ ] Write down the bench-access mechanism for Flask (compose override or
      `exec`), so no nginx location ever gets added (D27).

### 7.3 The copy itself (D22, D23)

- [ ] Copy `Major_iot`'s tree into `emg-service/`, no git history.
- [ ] Exclude: `venv/`, **`gitkeys.txt` (holds a live PAT)**, all `.bin`,
      `sketch_jun22a bak`, `_tmp_*.raw`, `progress_cache.json`, `WORK_DONE_*.md`.
- [ ] Include: the 11 `.csv.gz`, their `.annotations.json`, `history.json`.
- [ ] Fix `.gitignore` so its rule matches its own comment about recordings.
- [ ] Fix the `history.json` compact-timestamp sort bug (Q31) — now on the
      critical path to the demo dashboard.
- [ ] Decide Q47's residual: whether `Major_iot`'s already-pushed biometric
      history on `origin/b1` / `origin/master` needs a scrub.

### 7.4 Band dropout (D21)

- [ ] Replace the `last_packet_time` / `last_device_addr` globals with a
      per-device last-seen map (needed for D3 regardless).
- [ ] Add dropout detection at 5 s of silence, and finalise the capture through
      D5's path with `truncated=1`.
- [ ] Tolerate sub-5 s gaps under the same calibration; record the gap for the
      report (Q39).
