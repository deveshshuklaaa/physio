# Security issues log

**Opened 2026-09-17. Last updated 2026-09-21.**

Running log of security issues found across `final_project` (engine, frontend,
`part2/Hemophillia-confirm`) and `Major_iot` (live EMG service + firmware).
Added to as issues are found; nothing here is fixed yet unless its status says so.

Priority rule for this project: **data security first, scalability second**
(see `docs/12_emg_v3_integration_decisions.md` R2). All validation is
server-side only (R3).

Severity is an engineering estimate, not a formal CVSS score. Items marked
**UNVERIFIED** rest on something observed but not yet confirmed (e.g. git
history) and must be checked before their severity is treated as final.

Statuses: **OPEN** · **MITIGATED BY DESIGN** (a decision addresses it, not yet
implemented) · **REQUIREMENT** (a control a planned feature must include) ·
**FIXED**.

---

## Summary

| # | Issue | Severity | Status |
|---|---|---|---|
| S1 | Profile route mass assignment | High | OPEN |
| S2 | Flask EMG service has no authentication | High | OPEN |
| S3 | UDP ingest is unauthenticated and spoofable | High | OPEN |
| S4 | Device accepts commands from any sender | Medium | OPEN |
| S5 | Biometric data in plaintext over WiFi | Medium-High | OPEN |
| S6 | Patient recordings not gitignored in `Major_iot` | High | OPEN |
| S7 | GitHub PAT file on disk (`gitKeys.txt`) | High | OPEN — not git-tracked (2026-09-21) |
| S8 | CSFLE master key stored beside `.env` | Critical / High | OPEN — not git-tracked (2026-09-21) |
| S9 | One Mongo credential shared by all services | Medium-High | OPEN |
| S10 | WiFi credentials hardcoded in firmware | Medium | OPEN |
| S11 | Flask binds all interfaces when run directly | Medium | OPEN |
| S12 | EMG history/progress/playback not patient-scoped | High | OPEN |
| S13 | Flask trusts caller-supplied `session_id` on claim | Medium | REQUIREMENT |
| S14 | No sequence numbers — undetectable sample loss | Medium | OPEN |
| S15 | Printed band code could be bound by anyone | High | MITIGATED BY DESIGN |
| S16 | "Blink my band" could enumerate valid codes | Medium | REQUIREMENT |
| S17 | Discarded pre-recalibration biometric data must be purged | Medium-High | REQUIREMENT |
| S18 | Deep link lets a patient run an unassigned exercise | High | OPEN — PARTIALLY MITIGATED |
| S19 | Demo doctor's password committed in `createStaffAccount.js` | High | OPEN |
| S20 | Dangling `consultingDoctorId` defeats fail-closed doctor lookup | Medium-High | OPEN |
| S21 | EMG service exposed at nginx `/emg/` for the demo | High | OPEN — TEMPORARY, revert after 2026-09-22 |
| S22 | `emg-service` container runs as root; recordings written `root:root` | Low-Medium | OPEN — revert after 2026-09-22 |

---

## S1 — Profile route mass assignment

**Where:** `part2/Hemophillia-confirm/backend/src/routes/profile.js`,
`POST /api/profile/patient-profile`.

**What:** the handler validates a list of required fields, then does
`Object.assign(profile, data)` with the entire request body. Only `userId` is
overwritten server-side afterwards. Mongoose strict mode drops keys that are not
in the schema, but **every field that is in the schema is client-writable**.

**Impact:**

- A client can overwrite its own `patientId` (the `PATxxxxxx` display id). The
  engine snapshots `patientprofiles.patientId` onto every session at
  `/session/start` (`backend/app/db.py:72` `resolve_patient_id`), so a forged
  value propagates into clinical session records.
- A client can set consent flags (`consentAI`, `consentVideoMonitoring`,
  `consentDataCollection`, `privacyAccepted`, `termsAccepted`) and
  `consentTimestamp` through the profile route, bypassing the dedicated
  `POST /api/profile/consent` flow. The engine gates video handling on
  `consentVideoMonitoring`.
- Any schema field added in future becomes writable automatically.

**Fix direction:** explicit server-side allowlist of writable fields per route;
never `Object.assign` a request body. `patientId` and consent fields must not be
writable from this route.

## S2 — Flask EMG service has no authentication

**Where:** `Major_iot/backend/app.py` — every route.

**What:** no auth, no CORS policy. Destructive and state-changing routes are open
to anything that can reach port 5000:

- `DELETE /api/recording/<filename>` — deletes a recording and its annotations
- `POST /api/start_capture`, `POST /api/stop_recording`
- `POST /api/recalibrate` — sends `RECAL` to the device
- `POST /api/save_history` — appends arbitrary `{filename, timestamp}` entries
- annotation create/update/delete
- `GET /api/recording/<filename>` — returns raw biometric samples

**Impact:** anyone with network reach can read, delete or corrupt patient EMG
data and control the device.

**Fix direction:** service reachable only from the engine on the internal compose
network (no host port for HTTP), plus a service-to-service credential so network
placement is not the only control. Any operator page exposure must go through
authenticated, patient-scoped routes (see S12).

## S3 — UDP ingest is unauthenticated and spoofable

**Where:** `Major_iot/backend/app.py` `EMGUDPHandler.handle()`, UDP `0.0.0.0:8888`.

**What:** any datagram is accepted. Sample lines are written into the active
recording; `HELLO`/`CAL` payloads replace the stored calibration.
`last_device_addr` is taken from the packet's source address, which is used for
ACK keepalives and `RECAL`.

**Impact:** sample injection into a patient's recording; forged calibration;
hijacking which address receives device commands; misattribution of biometric
data between patients once several devices exist.

**Fix direction:** device identity carried in every packet and checked against
the active lease (never trust source IP); per-device secret provisioned at
manufacture with a message authentication code on each datagram.

## S4 — Device accepts commands from any sender

**Where:** `Major_iot/sketch_jun22a/sketch_jun22a.ino` `pollRx()`.

**What:** `ACK` and `RECAL` are acted on regardless of the sender's address.

**Impact:** anyone on the same network can force recalibration mid-session
(corrupting IMU offsets) or fake a handshake so the LED reports a healthy link
while no server is receiving data.

**Fix direction:** accept commands only from the configured host, and
authenticate them with the same per-device secret as S3. `IDENTIFY` (planned,
D11) must follow the same rule.

## S5 — Biometric data in plaintext over WiFi

**Where:** firmware → Flask, UDP 8888.

**What:** EMG and IMU samples are sent as ASCII CSV with no encryption.

**Impact:** anyone on the network path can capture a patient's muscle-activity
and movement data.

**Fix direction:** encrypt in transit (e.g. DTLS, or an authenticated-encryption
scheme using the S3 per-device key). Weigh against ESP32-S3 CPU budget at 500 Hz.

## S6 — Patient recordings not gitignored in `Major_iot`

**Where:** `Major_iot/.gitignore`.

**What:** ignores `*.partial.csv`, `progress_cache.json`, `gitkeys.txt`, but
**not** `*.csv.gz`, `*.csv`, `*.bin`, `*.emgz` or `*.annotations.json`. The repo
root holds ~20 recordings (~9.5 MB), including an untracked
`emg_20260909_164511.csv`.

**Impact:** copying `Major_iot` into `final_project` (the agreed vendoring
approach) would put patient biometric recordings into git history, where removal
is effectively impossible once pushed. `docs/PROJECT-STATUS.md` §3 already
records one near-miss of this kind.

**Fix direction:** add the recording patterns to `.gitignore` in both repos and
confirm with `git status` **before** the copy. Check whether any recording is
already tracked in `Major_iot` history.

## S7 — GitHub PAT file on disk — UNVERIFIED

**Where:** `Major_iot/gitkeys.txt`.

**What:** `.gitignore` comments that this file "held a live GitHub PAT". It is now
ignored but still present on disk.

**Unverified:** whether it was ever committed or pushed.

**Impact:** if ever committed, the token is exposed to anyone with repository
access, now and in history.

**Fix direction:** revoke/rotate the PAT regardless; delete the file; check git
history for it.

## S8 — CSFLE master key stored beside `.env` — UNVERIFIED

**Where:** `part2/Hemophillia-confirm/backend/master-key.txt`, alongside
`backend/.env`.

**What:** a local CSFLE master key file sits in the application directory next to
the environment file holding `MONGO_URI` and `JWT_SECRET`.

**Unverified:** whether `master-key.txt` or `.env` is tracked by git.

**Impact:** CSFLE only protects fields (`fullName`, `mobile`, `email`, `address`,
emergency contacts) if the key is kept apart from the data and database
credentials. Co-locating them means one host or repository compromise yields
both ciphertext access and the key. **Critical** if committed; High otherwise.

**Fix direction:** move the master key to a KMS (or at minimum outside the
application tree and image); rotate the key and data keys if it was ever
committed.

## S9 — One Mongo credential shared by all services

**Where:** `docker-compose.yml` — `backend` and `hemo-backend` both load
`part2/Hemophillia-confirm/backend/.env`.

**What:** a single `MONGO_URI` (one database user) is used by every service.

**Impact:** no least privilege. A compromise of any one service exposes every
collection — profiles, sessions, clinical reports, band assignments.

**Fix direction:** a separate database user per service, each granted only the
collections it needs (e.g. engine: sessions, `emg_band_assignments`, read-only
on `patientprofiles.patientId`).

## S10 — WiFi credentials hardcoded in firmware

**Where:** `Major_iot/sketch_jun22a/sketch_jun22a.ino` — `WIFI_SSID`,
`WIFI_PASS`, `HOST_IP`.

**What:** network credentials and the server address are compiled in and
committed.

**Impact:** credentials exposed to anyone with repository access; every band
ships with the same network secret; unworkable for multiple patients (D3).

**Fix direction:** provision per device at setup (stored in NVS), never in source.

## S11 — Flask binds all interfaces when run directly

**Where:** `Major_iot/backend/app.py` `__main__` — `app.run(host='0.0.0.0')`.

**What:** outside Docker, the unauthenticated service (S2) listens on every
interface.

**Impact:** reachable from the whole LAN during development and testing.

**Fix direction:** bind `127.0.0.1` by default; expose only via compose networking.

## S12 — EMG history, progress and playback not patient-scoped

**Where:** `Major_iot` `history.json`, `/api/list_recordings`, `/api/progress`,
`/api/recording_meta/<f>`, `/api/preview/<f>`; `website/history.html`,
`progress.html`, `playback.html`.

**What:** one global list of every recording, with no patient or account
attribute. `progress.html` aggregates all recordings into one trend view.

**Impact:** with multiple patients (D3), any exposure of these routes or pages is
cross-patient disclosure of biometric data.

**Fix direction:** attribute every recording to a session (and thereby a patient);
serve history, progress and playback only through authenticated routes that
filter server-side by the caller's authorization.

## S13 — Flask trusts caller-supplied `session_id` — REQUIREMENT

**Where:** planned capture-claim route (P1.2).

**What:** Flask cannot verify that a `session_id` it is handed is real or belongs
to the patient wearing the band.

**Requirement:** only the engine may call the claim route (network isolation plus
service credential, see S2). The engine verifies session ownership, band
assignment (D8/D12) and the ownership challenge (D15) before claiming.

## S14 — No sequence numbers: undetectable sample loss

**Where:** UDP wire format, `Major_iot` firmware and `app.py`.

**What:** datagrams carry no sequence numbers or timestamps. `queue_drops` counts
only local queue overflow, never network loss.

**Impact:** clinical-data integrity — a recording can silently miss samples and
nothing can show it.

**Fix direction:** per-packet sequence number (and device timestamp) with
server-side gap counting recorded in the recording's preamble. The abandoned
`hardware/esp32_imu/` tree has a working design (`!BIII` header) to borrow from.

## S15 — Printed band code could be bound by anyone — MITIGATED BY DESIGN

**Where:** band assignment design.

**What:** the code is printed on the band (D11). Under the earlier non-exclusive
pairing, anyone who read the label could bind the band to their own account.

**Mitigation:** exclusive assignment enforced by a unique partial index;
taking over an assigned band is admin/clinician-only (D12); per-session
ownership challenge verified server-side across EMG, IMU and pose (D15).

## S16 — "Blink my band" could enumerate valid codes — REQUIREMENT

**Where:** planned `IDENTIFY` feature (D11).

**What:** a route that makes a band light up when its code is entered can be used
to discover which codes exist and are online.

**Requirement:** authenticated callers only; per-account and global rate limits;
identical responses for "no such band" and "band offline"; audit log entries.

## S17 — Discarded pre-recalibration biometric data must be purged — REQUIREMENT

**Where:** recalibration flow (`docs/12_emg_v3_integration_decisions.md` D16).

**What:** on recalibration, EMG/IMU samples, pose frames and reps recorded before
the final starting line do not count, and video is recorded for the whole session
with the pre-recalibration part removed in post-processing.

**Risk:** "does not count" implemented as "excluded from reports" leaves
biometric data the patient was told is discarded sitting in scratch files, the
session buffer, uploaded video, backups or logs. The full-session video in
particular holds pre-recalibration footage until post-processing runs.

**Requirement:**

- Pre-recalibration IoT samples are deleted, not flagged — including the
  `.partial.csv` scratch file.
- Pose frames and rep entries before the final starting line are removed from the
  session buffer and session document.
- Post-processing trims the pre-recalibration video deterministically, deletes the
  untrimmed original, and records that the purge happened.
- The server enforces the trim point from its own recorded timeline (R3); a
  client-supplied trim point is never trusted.
- Only an audit record of each recalibration (time, count, reason) survives, with
  no biometric content.

---

## S18 — Deep link lets a patient run an unassigned exercise

**Severity: High. Status: OPEN — partially mitigated 2026-09-21.**
Relates to D32, D28, D12, D7. Found during P0.3 of the demo execution plan.

### The problem

part2 deep-links a patient straight into an exercise. The plan page builds the
link at `part2/Hemophillia-confirm/frontend/src/pages/ExercisePlan.jsx:1196`:

```js
const startHref = `/dist/index.html?exercise=${encodeURIComponent(item.exerciseId)}&rec=${encodeURIComponent(item._id)}`;
```

The only assignment gate on that page is `canStart = item.status === "ACTIVE"`
(line 1190), which chooses between rendering an `<a>` and a disabled `<div>`.
That decides what is **drawn**, not what is **permitted**.

The engine client (`frontend/app/src/pages/ExerciseSelect.jsx:161, 235-245`)
parses the query string and POSTs it to `/session/start`. It adds no check.

`backend/app/routes/session.py:224-246` then validates only that the exercise
exists in the registry (line 228). `recommendation_id` is taken from the request
body and written straight onto the session row (line 244) — never read back,
never checked to exist, never checked to belong to the authenticated patient,
never checked to be `ACTIVE`. Nothing in `backend/app/` reads
`patientexerciserecommendations` at all.

**Consequence.** A patient edits the exercise id in the address bar — or POSTs to
`/session/start` directly — and gets a real `session_id`, a snapshotted doctor
link and a generated report for an exercise nobody assigned them, including one
still in `PENDING_DOCTOR_REVIEW`. D7 calls doctor approval the app's central
clinical safety property; today that property is **displayed, not enforced**.

This is a live hole, not a theoretical one. It was verified by reading the three
files end to end, not inferred.

### What was done (partial mitigation, 2026-09-21)

`ExerciseSelect.jsx` now clears the query string with `history.replaceState`
immediately after parsing it, so the exercise id no longer appears in the address
bar, in the back-history, or in a copied URL.

**This is cosmetic and must not be mistaken for a fix.** It removes the
temptation, not the capability: devtools, a saved link, or a direct POST to
`/session/start` all still work exactly as before. It is recorded here so nobody
later reads a clean address bar as evidence the hole is closed.

### The solution

Re-derive permission server-side, at session start, from the database — the
client states what it wants, the server decides what is allowed. In
`session_start`, before the insert:

```python
rec = await app.state.db.patientexerciserecommendations.find_one({
    "patientUserId": dbmod.to_object_id(user.user_id),   # from the JWT, never the body
    "exerciseId": body.exercise_id,
    "status": "ACTIVE",
})
if rec is None:
    raise HTTPException(status_code=404, detail="unknown exercise")
```

Four properties are what make this real rather than theatre:

1. **Identity comes from the JWT**, never from the request body (D12).
2. **Keyed on patient + exercise, not on the `rec` id.** A check written against
   the id alone is bypassed by omitting the id — and the engine's own client
   legitimately sends no `rec` at all (`ExerciseSelect.jsx:275`), so that path
   must not become a hole.
3. **`status: "ACTIVE"`**, so `PENDING_DOCTOR_REVIEW` rows are refused. This is
   the clause that makes D7 true instead of decorative.
4. **The refusal is indistinguishable from not-found** (D28). The existing 404 at
   `session.py:228` echoes the requested exercise id back in its `detail` string,
   so it must be flattened at the same time; otherwise the two branches are
   trivially distinguishable and the error text itself becomes an oracle.

Once this is in, the deep link is safe in plain sight. That is the test of
whether the problem is actually solved: editing the URL should produce a 404,
and it should not matter that the URL was visible.

**Estimated cost:** ~20 minutes of code; 2-4 hours honestly, almost all of it
verification — confirming the real field names against the mongoose schema (a
wrong name matches nothing and locks every patient out), the test, and an
end-to-end run against a real account. Deliberately deferred past the 2026-09-22
demo, where a mistake would block the opening step; §6.2 of the demo plan already
lists this as the first thing to cut.

---

## S19 — Demo doctor's password committed in `createStaffAccount.js`

**Severity: High. Status: OPEN.** Found 2026-09-21.

`part2/Hemophillia-confirm/backend/scripts/createStaffAccount.js` is **tracked in
git** and contains a hardcoded plaintext temporary password and a real email
address, for professional id `DOC002` — the doctor account being used for the R4
demo.

Unlike S7 and S8, this one is in the repository, so it is in the history of every
clone and cannot be undone by deleting the file.

**Fix:** change the account's password; take credentials from `argv`/env in that
script rather than literals (D24 requires demo credentials to live outside the
project directory entirely); and treat the committed value as burned regardless
of what the file says afterwards.

---

## S20 — Dangling `consultingDoctorId` defeats the fail-closed doctor lookup

**Severity: Medium-High. Status: OPEN.** Found 2026-09-21.

`backend/app/db.py` `make_lookup_doctor_id()` is documented and tested as
fail-closed: a patient with no `hemophiliadetails` row has no doctor, and every
doctor is denied. That holds for a **missing** row.

It does not hold for a **dangling** one. Two patient rows were found carrying a
`consultingDoctorId` pointing at a `users` document that does not exist. A
dangling ObjectId is truthy, so the lookup returns it rather than `None` — the
function does not fail closed, it fails to a doctor who cannot exist. No real
doctor ever matches, so the patient becomes permanently invisible to their own
clinician, and the symptom presents as a permissions bug rather than as corrupt
data.

One such patient (`kokila ben`) was deleted on 2026-09-21 at the owner's
instruction — 11 documents across 5 collections, backed up to
`/home/billa-dakait/kokila_ben_deleted_backup.json` outside the project.
**`PAT980086` still carries the same dangling id.**

**Root cause.** Mongo does not enforce referential integrity; `ref: "User"` in the
mongoose schema is documentation, not a constraint. Whatever deleted that doctor
left the references behind. In a relational store this row would have been
impossible to create.

**Fix:**

- Repair or clear `PAT980086`'s `consultingDoctorId`.
- Treat "resolves to a nonexistent user" as no doctor: either validate the
  reference in `lookup_doctor_id`, or run an integrity check that flags dangling
  links. `backend/app/test_doctor_lookup.py` currently covers the missing-row and
  null cases but **has no dangling-reference case** — the one variant real data
  has already produced.
- More broadly: where Mongo cannot enforce an invariant, something else must.

---

## S21 — EMG service exposed at nginx `/emg/` for the demo

**Severity: High. Status: OPEN — deliberate, temporary, revert after 2026-09-22.**
Owner-approved loosening of D27 and D29. Recorded here because it is a knowing
exception, not an oversight.

### What changed

`nginx/default.conf` gained:

```nginx
location /emg/ {
    limit_except GET {
        deny all;
    }
    proxy_pass http://emg-service:5000/;
}
```

D27 says the Flask EMG service is "permanently unreachable from a browser" and
D29 says the stopgap "must never become an nginx location". Both are set aside
here, knowingly, so the patient and doctor profiles can show real EMG recordings
and a real dashboard without building the scoped engine routes first.

### What this exposes

- **Unauthenticated** (S2). Flask has no auth of any kind.
- **Unscoped** (S12). `/emg/api/progress` and `/emg/api/list_recordings` return
  **every** recording for **every** patient. The patient and doctor UI blocks
  embed these pages directly, so both see everything.
- **Reachable from the whole network**, not just the demo machine: nginx listens
  on `0.0.0.0:80`, unlike the P5.2 loopback port.

### Why it was accepted

Every recording in the demo dataset belongs to one real person (the owner). There
is no second party's data to disclose. The properly-scoped alternative — engine
list route, playback proxy with a filename ownership check, two bespoke UI blocks
— was costed at ~5 hours the night before the demo.

### What was NOT accepted

`limit_except GET { deny all; }` blocks every write path. Verified: `GET` 200,
`POST /emg/api/start_capture` / `/stop_recording` / `/recalibrate` all **403**.

Without it, anyone on the venue network could stop a recording mid-session or
trigger a recalibration, against a service with no authentication. That was not a
risk worth carrying for zero benefit — nothing in the demo posts through nginx.

The engine is unaffected: it reaches Flask directly over the compose network,
never through nginx, so session-driven capture start/stop still works. Manual
capture control remains on the loopback port (`127.0.0.1:5000`).

### Expiry

This decision expires the moment a second person's data exists in any environment
these pages serve — the same condition D29 already carries, and D29's stated
premise ("the demo database holds one patient") is **already false** for the Mongo
side: there are 5 patients, and the demo doctor has 2 of them. It holds only for
the EMG recordings, which are all the owner's.

**Revert list:**

- the `/emg/` location block in `nginx/default.conf`
- the `127.0.0.1:5000:5000` line in `docker-compose.yml`
- the EMG iframe blocks in `ExercisePlan.jsx` and `PatientResearch.jsx`

Each carries a `D29 TEMPORARY` comment naming itself. The permanent replacement
is §7.2 of doc 12: engine proxy endpoints plus scoped React views, which closes
S12 and S21 together and retires D29.

---

## S21 addendum — the read-only guard is now bypassed (2026-09-22)

The `limit_except GET { deny all; }` on nginx `/emg/` (which blocks the write
paths) **no longer protects anything**. The patient/doctor EMG iframes were
changed to load directly from `http://127.0.0.1:5000/...` instead of `/emg/...`,
because the Flask pages fetch root-absolute `/api/...` paths that resolved to
part2's backend through nginx and 404'd (docs/13 F4).

Consequence: the browser now talks to Flask on the loopback port, where
`POST /api/start_capture`, `/stop_recording` and `/recalibrate` are **open and
unauthenticated**. This is reachable only from `127.0.0.1` (the loopback
publication is `127.0.0.1:5000:5000`, not `0.0.0.0`), so the exposure is limited
to code running on the demo machine itself — but any page open in that browser
can stop a recording or recalibrate the band with a one-line fetch, no auth.

The nginx `/emg/` block is now dead weight. Both it and the loopback port are on
the revert list; the permanent fix (scoped engine routes, §7.2) removes the
browser's direct line to Flask entirely.

---

## S22 — EMG service container runs as root

**Severity: Low-Medium. Status: OPEN — revert after 2026-09-22.** Found 2026-09-22.

The `emg-service` container runs its Flask process as `uid=0(root)`. Recordings
written into the bind-mounted `emg-service/data/` are therefore owned
`root:root`, mode `0644`, unlike the host-written legacy files (`billa-dakait`,
`0664`).

Two issues:

- **Least privilege.** A web-facing service (unauthenticated UDP ingest S3, no
  HTTP auth S2) running as root is more than it needs. A compromise of the Flask
  process is a root process inside the container.
- **Host friction.** New recordings and `progress_cache.json` cannot be edited or
  chmod'd from the host without sudo (they can still be deleted — that needs
  directory write, which the host user has).

Not a data-disclosure issue and harmless to the running app; recorded for
completeness and least-privilege hygiene.

**Fix:** add `user: "1000:1000"` to the `emg-service` service in
`docker-compose.yml`, or create and switch to a non-root user in
`emg-service/Dockerfile`. Needs a rebuild and a retest that the container can
still write `/srv/data` and bind UDP 8888 — deliberately deferred past the demo.
