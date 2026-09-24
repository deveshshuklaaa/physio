---
name: next-phase-skill
description: Use when the user says to proceed with the next phase, do the next phase tasks, continue the build, or names a phase of MASTER_BUILD_PLAN_v3.md (Phase H, I, J, K, L, M) in the Rehab Assessment Engine repo.
---

# Next Phase

Phase work in this repo runs tests-first with a human approval gate. Tests are
written by the main session (Opus 5) and **approved by the owner** before any
implementation subagent is spawned.

## The Iron Law

```
NO IMPLEMENTATION SUBAGENT BEFORE THE OWNER APPROVES THE TESTS
```

Not "I'll write tests and start in parallel." Not "the tests are obvious." Not
"the owner approved the last phase." Approval is per phase, explicit, and typed
by the owner in this conversation.

## Workflow

### 1. Identify the phase

Read `docs/PROJECT-STATUS.md` §1 (phase table) and `docs/G-CONTINUE.md`. The
next phase is the first one not marked DONE. If the owner named a phase, use
that one instead — but say so if it skips an unfinished phase.

### 2. Read the tasks — from the plan, not from memory

From `MASTER_BUILD_PLAN_v3.md`, read for that phase:

| Section | What to take |
|---|---|
| §5 Atomic task list | Every task ID and its stated output (H1, H2, …) |
| §7 Testing gates | The phase gate — the one condition that must pass to advance |
| §10 Subagent map | Which agent owns which files, its model tier, what it must not touch |
| §8 / §8b | Standing constraints and logging obligations that apply |

Also read `docs/PROJECT-STATUS.md` §5 (open decisions) — if an open decision
blocks a task in this phase, surface it now, not after the tests are written.

### 3. Write the tests — main session, Opus 5

Write them yourself. Do **not** delegate test-writing to a subagent; the test
suite is the contract the subagent is graded against, so it must not be authored
by the party being graded.

Requirements:

- **One test per atomic task ID**, named for it (`test_h2_buffer_flushes`).
  A task with no test is a task with no gate.
- **One test for the §7 phase gate**, explicitly labelled as the gate.
- Tests fail against the current tree (RED). Run them and show the failure — a
  test that passes before the code exists is testing nothing.
- Match the existing conventions: Python `test_*.py` beside the source
  (`backend/app/services/test_emg_client.py`), JS under the frontend suite
  (`frontend/run_tests.sh`). No new frameworks.
- Guard the *silent* failures this repo has been bitten by: dead code paths that
  no-op, event names that are never validated, hardcoded counts, assertions on
  invented identifiers. See `docs/PROJECT-STATUS.md` §3.

### 4. STOP — hand the tests to the owner

Present:
- The task-ID → test-name mapping, as a table.
- The gate test, called out separately.
- The RED run output proving they fail now.
- Anything you could not test, and why.

Then stop and ask for approval or edits. Wait for the owner's reply. Apply any
edits they ask for and re-present if the change is material.

### 5. Only then, spin up the subagent

Use the agent named for this phase in §10 of the plan (Phase H →
`realtime-agent`, I → `explainability-agent`, J → `frontend-agent`, K →
`devops-agent`). Its brief must carry:

- The approved test file paths, as the definition of done.
- Its §10 file ownership and its "must not touch" list.
- **It may not edit the approved tests.** If a test looks wrong, it reports back
  — it does not relax the test to pass.

### 6. Close the phase

Run the full suite. Update `docs/PROJECT-STATUS.md` §1 and write the phase's
`docs/NN_*.md` note. Report what actually ran, including anything still failing.

## Red flags — stop and return to step 4

- "Tests are straightforward, I'll dispatch and show them together"
- "The subagent can write its own tests"
- "The owner is clearly fine with this approach"
- "I'll get approval on the code instead"
- "This phase is too small for the gate"

All of these mean: no subagent yet. Present the tests.

## Common mistakes

| Mistake | Fix |
|---|---|
| Tests written from `docs/` summaries | §5 of the plan is the source of task IDs |
| Gate test folded into a task test | The §7 gate gets its own named test |
| Tests pass on first run | They were written to the current code, not the spec. Rewrite |
| Subagent edits a test to go green | Reject; the test is the contract |
| Phase marked DONE with the gate advisory or skipped | Say so plainly in the status update |
