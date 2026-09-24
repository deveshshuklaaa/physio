# Demo execution plan — presentation 2026-09-22

**Written 2026-09-21.** Companion to `docs/12_emg_v3_integration_decisions.md`
(the decision log). This document does not make decisions — it executes the ones
already locked there. Where a task implements a decision, the decision id is
cited; if a task and a decision disagree, **the decision wins** and this document
is wrong.

---

## 0. What we are doing

Bringing the EMG/IoT service (`Major_iot`) into `final_project` as an internal
module, wiring it to the rehab engine and the part2 patient/doctor site, and
making one end-to-end run demonstrable: a patient logs in, runs an assigned
exercise in front of the camera with the EMG band on, gets a report, and their
doctor — and only their doctor — can see it.

This is the **presentation phase** (R4). The target is a working, honest
demonstration, not a finished product. Two things follow from that and are stated
up front so nobody has to rediscover them:

- **Visual design is out of scope.** Explicitly excluded by the owner.
- **One deliberate architectural shortcut is taken** — D29, showing Flask's
  unscoped operator pages instead of building scoped React views overnight. It is
  time-boxed and its expiry conditions are written into D29. It is not a pattern
  to copy.

---

## 1. Objectives

Ordered. An objective is met only when its **verification** passes, not when its
tasks are done.

| # | Objective | Verification |
|---|---|---|
| **O1** | The EMG service runs inside compose as an internal module, with its data surviving a rebuild | `docker compose up --build` twice; recordings and `history.json` still present after the second |
| **O2** | The band streams into the containerised service | Packets arrive on UDP 8888 inside the container; `/api/status` shows `udp_active: true` |
| **O3** | A demo patient and demo doctor exist, correctly related | The demo doctor's patient list contains the demo patient; a second (control) account sees nothing |
| **O4** | New recordings are attributable to a patient | A recording made through a session carries `patient_user_id` and `session_id` |
| **O5** | A patient cannot run an exercise they were not assigned | `/session/start` refuses an unassigned exercise id, server-side |
| **O6** | One end-to-end run completes | The rehearsal in §6 passes start to finish, once, before the demo |

**Non-objectives**, stated so they do not consume time: scoped React views
(§7.2 of doc 12, post-demo), band dropout detection (D21), clock sync (D18), the
ownership challenge (§5.1), any model training (§5.3), visual polish.

---

## 2. Rules of engagement

These are binding on every agent **and on the main agent**.

### 2.1 Ponytail before code

**No code is written — by anyone, including the main agent — before invoking the
`ponytail` skill.** Every dev subagent prompt must begin by invoking it. The
laziest solution that actually works is the correct one; the ladder runs after
understanding the problem, never instead of it.

A task that turns out not to need code is a success, not a skipped task. Say so
and move on.

### 2.2 Tests before development, always

**For each phase, a test-writing subagent runs to completion before any dev
subagent starts.** Never the reverse, never concurrently. The dev agent's job is
to make existing failing tests pass.

### 2.3 Test only what matters

**Do not test everything.** Strict priority:

> **data flow > data integrity > security** — these get tests
> **spelling, cosmetic defects, minor errors** — these do not

Concretely, a test is written only if a silent failure would corrupt data, lose
data, or disclose data across a patient boundary. Everything else is verified by
running the thing once and looking at it.

Explicitly **not** tested: HTML rendering, page styling, Gemini's prose, list
ordering, log wording, anything whose failure is visible the moment you look.

No frameworks beyond what the repo already uses. Assert-based `demo()`/`__main__`
self-checks or one small `test_*.py` per phase, matching the existing pattern in
`backend/app/`.

### 2.4 Model and effort policy

| Work | Agent | Model | Effort conveyed by |
|---|---|---|---|
| Moving, copying, renaming, deleting, file plumbing | `general-purpose` | **haiku** | Prompt states the exact file operations, no judgement calls |
| Writing tests | `backend-core-agent` / `general-purpose` | **sonnet** | Prompt names the invariant to test and forbids scope expansion |
| Coding workflows | matching specialist agent | **sonnet** | Prompt cites the decision, the files, and the ponytail requirement |
| Reading/locating only | `Explore` | **haiku** | Read-only by construction |

Never use opus for any task in this plan. If a haiku task needs judgement, that
is a sign the task was not atomised enough — split it rather than upgrading the
model.

### 2.5 Subagent hygiene

- One phase's agents finish before the next phase's start, unless §5 marks them
  parallel-safe.
- Menial agents get **absolute paths and exact filenames**, never "find the
  relevant file".
- Every dev agent prompt cites its decision id so it can check its own work.
- A subagent that cannot complete its task **reports and stops**. It does not
  improvise an alternative.

---

## 3. Phases and atomic tasks

Task ids are `P<phase>.<n>`. "Atomic" means one verifiable action.

### Phase 0 — Verify before touching anything (no code, ~15 min)

| Id | Task | Agent | Model |
|---|---|---|---|
| P0.1 | Confirm `Major_iot` working tree is clean on `b1`; list untracked files that are needed | Explore | haiku |
| P0.2 | Confirm `emg-service/data/` exists and `docker-compose.yml` has the `EMG_DATA_DIR`, bind mount and `8888/udp` entries | Explore | haiku |
| P0.3 | Read `part2` deep-link construction and `/session/start`'s current exercise handling; report whether D32's hole is live or theoretical | Explore | haiku |
| P0.4 | Confirm whether any existing Atlas account already has a `hemophiliadetails` row usable for the demo doctor | Explore | haiku |

**Gate:** P0.3's answer decides Phase 4's size. Do not start Phase 4 before it.

### Phase 1 — The copy (menial, ~30 min)

Implements D22, D23. Pure file movement; no logic changes.

| Id | Task | Agent | Model |
|---|---|---|---|
| P1.1 | Delete the stale `emg-service/` contents **except** `data/` and `Dockerfile` | general-purpose | haiku |
| P1.2 | Copy `Major_iot/backend/`, `website/`, `run.py`, `requirements.txt` into `emg-service/` | general-purpose | haiku |
| P1.3 | Copy the 11 `.csv.gz`, their `.annotations.json`, and `history.json` into `emg-service/data/` | general-purpose | haiku |
| P1.4 | Verify **nothing** excluded by D23 was copied: no `venv/`, no `gitkeys.txt`, no `*.bin`, no `sketch_jun22a bak`, no `_tmp_*.raw`, no `WORK_DONE_*.md`, no `progress_cache.json` | general-purpose | haiku |
| P1.5 | Delete the live-viewer cruft D4 kills: `website/live.html`, `live2.html`, `live3.html`, `live (copy)july 24.html` | general-purpose | haiku |
| P1.6 | Write `emg-service/.gitignore` so its rule matches its own comment — recordings and scratch files both ignored | general-purpose | haiku |

**Gate P1.4 is a hard stop.** `gitkeys.txt` holds a live PAT. If it is present in
`emg-service/` after P1.2, delete it and confirm before continuing.

### Phase 2 — Data plumbing (tests first, ~45 min)

Implements Q49 and D31. **Highest data-integrity risk in the plan**: get this
wrong and the demo data disappears on the next rebuild.

| Id | Task | Agent | Model |
|---|---|---|---|
| P2.T | **Write tests first.** Two invariants: (a) `DATA_DIR` resolves to `EMG_DATA_DIR` when set and to the legacy path when unset; (b) a finalised recording's `history.json` entry contains `patient_user_id` | backend-core-agent | sonnet |
| P2.1 | Make `app.py:23`'s `DATA_DIR` read `EMG_DATA_DIR`, defaulting to the current value | emg-integration-agent | sonnet |
| P2.2 | Add `patient_user_id` to the `history.json` entry written on recording finalisation (D31, new recordings only) | emg-integration-agent | sonnet |
| P2.3 | Thread `patient_user_id` from the engine's capture-start call through to finalisation | emg-integration-agent | sonnet |
| P2.4 | Rebuild twice; confirm recordings survive (O1) | general-purpose | haiku |

**Not in scope:** back-stamping the 11 demo recordings. The owner is doing that
directly (D31).

### Phase 3 — Demo accounts (tests first, ~45 min)

Implements D24. **Highest security risk in the plan**: this is where a wrong
relationship silently shows one patient's data to the wrong doctor.

| Id | Task | Agent | Model |
|---|---|---|---|
| P3.T | **Write tests first.** One invariant, both directions: the demo doctor resolves to the demo patient via `lookup_doctor_id`, **and** a control doctor resolves to `None` and is denied | backend-core-agent | sonnet |
| P3.1 | Write the seed script: demo patient `User`, demo doctor `User` (with `professionalId`), demo `PatientProfile` | backend-core-agent | sonnet |
| P3.2 | Add the `HemophiliaDetails` row carrying `consultingDoctorId` — **the step that silently breaks everything if omitted** | backend-core-agent | sonnet |
| P3.3 | Run the seed; verify the doctor's patient list contains the demo patient and nothing else (O3) | general-purpose | haiku |

**Credentials (D24):** plaintext, outside the project directory, owner-held. No
agent writes, reads, echoes or commits them. The seed script takes them as
arguments or env vars; it never contains them.

### Phase 4 — Exercise gating (tests first, size set by P0.3, ~30–60 min)

Implements D32. **Security.** Sized by P0.3's finding.

| Id | Task | Agent | Model |
|---|---|---|---|
| P4.T | **Write tests first.** One invariant: `/session/start` refuses an exercise the authenticated patient has no `ACTIVE` `PatientExerciseRecommendation` for, and the refusal is indistinguishable from not-found (D28) | backend-core-agent | sonnet |
| P4.1 | Add the server-side assignment check at `/session/start` (D32) | backend-core-agent | sonnet |
| P4.2 | Restrict the demo exercise set to `mini_squat` + `seated_knee_extension` | general-purpose | haiku |
| P4.3 | Flip `mini_squat` to `primary_branch: "both"` in `exercises.json` (D20) | general-purpose | haiku |

### Phase 5 — Band bring-up (~30 min)

| Id | Task | Agent | Model |
|---|---|---|---|
| P5.1 | Bring the stack up; confirm UDP packets reach the container and `/api/status` reports `udp_active` (O2) | general-purpose | haiku |
| P5.2 | Publish the Flask port temporarily for D29 operator access; record the exact command used to revert it | devops-agent | haiku |
| P5.3 | Confirm `history.html`, `playback.html`, `progress.html` render the demo data | general-purpose | haiku |

### Phase 6 — Rehearsal and post-demo (see §6)

---

## 4. Subagent plan at a glance

| Phase | Test agent (first) | Dev/menial agents | Parallel-safe with |
|---|---|---|---|
| 0 | — | 4 × Explore (haiku) | all of Phase 0 parallel |
| 1 | — | general-purpose (haiku), sequential | nothing |
| 2 | backend-core-agent (sonnet) | emg-integration-agent (sonnet) | Phase 3 |
| 3 | backend-core-agent (sonnet) | backend-core-agent (sonnet) | Phase 2 |
| 4 | backend-core-agent (sonnet) | backend-core-agent + general-purpose | nothing |
| 5 | — | general-purpose, devops-agent (haiku) | nothing |

**Parallelism:** Phase 0's four reads run together. Phases 2 and 3 touch disjoint
files (Flask data path vs Mongo seed) and may run together. Everything else is
sequential, because Phase 4 depends on Phase 3's accounts and Phase 5 depends on
everything.

**Total agent count: 15.** Eleven haiku, four sonnet, zero opus.

---

## 5. Test plan

Four tests exist at the end of this plan. Not five, not forty.

| Test | Guards | Priority class |
|---|---|---|
| `DATA_DIR` honours `EMG_DATA_DIR` | Recordings are not destroyed by a rebuild | data integrity |
| `history.json` entry carries `patient_user_id` | New recordings are attributable | data flow |
| `lookup_doctor_id` resolves the demo pair **and denies a control doctor** | No cross-patient disclosure | security |
| `/session/start` refuses an unassigned exercise | Deep links cannot escalate | security |

Each asserts one invariant. The control/denial half of the third test is the
point of it — a single-patient test cannot see the fail-closed branch break
(`db.py:78`'s own docstring says so).

**Deliberately untested**, per §2.3: page rendering, styling, Gemini output,
exercise card ordering, log text, `/api/status` field names, anything cosmetic.

---

## 6. Rehearsal and cut lines

### 6.1 The rehearsal (O6) — run once, tonight, not in the morning

Demo patient logs in → assigned exercises appear → runs mini squat with the band
→ live camera feedback → session ends → Gemini report → EMG recording visible as
physical evidence → session visible in profile → playback works → history lists
it → EMG dashboard shows it. Then: demo doctor logs in → sees that patient and no
other.

Any step that fails in rehearsal gets **cut from the demo**, not fixed at 3am.

### 6.2 Cut lines, in the order things get dropped

1. **Phase 4** (exercise gating) — narrate the assignment link instead of
   enforcing it. Costs a security property, not a visible feature.
2. **The band** (Phase 5, O2) — demo the recorded `.csv.gz` as evidence instead
   of a live capture. Costs the most impressive part, but it is the part with the
   most unbuilt failure modes behind it (D21, D18 do not exist).
3. **The EMG dashboard** (D29) — show the report and playback only.

**Never cut:** Phase 3's control-doctor check. Demonstrating a system that shows
the wrong doctor the wrong patient is worse than demonstrating less.

### 6.3 Immediately after the demo

- Revert P5.2's port publication (D29's expiry condition).
- Open §7.2 of doc 12 — the scoped React views D29 is standing in for.
- Confirm or reject **D26** (`clinician` as peer of `doctor`), still PROPOSED.
