# J — Frontend pages

**Phase J: PARTIAL.** The automated half is green (29/29). §7's gate is
*"Manual end-to-end passes"* — a human click-through that has **not been run**.
Phase J is not done and must not be marked done on the harness alone.

Agent: frontend-pages-agent (§10 #11), plus orchestrator corrections.

---

## 1. What was built

| Task | Outcome |
|---|---|
| **J1** | React + shadcn + ReactBits under `frontend/app/`, vite build → `frontend/dist/`. **Deviation from the plan — see §3.** |
| **J2** | `ExerciseSelect.jsx` — grid from `GET /exercises`, availability from `GET /admin/models/status` |
| **J3** | Start → `POST /session/start` → navigate with the **real** `session_id` |
| **J4** | Live page unchanged (Phase G). Asserted intact, not rebuilt |
| **J5** | Already resolved by vendoring `pose_landmarker_lite.task` (G-CONTINUE §8) |
| **J6** | Chart source identified by C1: `live.html` is real, `live2/live3` dead |
| **J7** | End Session → `POST /session/end` → report page |
| **J8** | `Report.jsx` — polls `GET /session/{id}`, E-DEC.6 two-panel split |
| **J9** | **NOT RUN** — human end-to-end |

Files: `frontend/app/src/pages/{ExerciseSelect,Report}.jsx`,
`src/{main,report-main}.jsx`, `index.html`, `report.html`, `vite.config.js`,
`src/index.css`, `src/components/{ui,}/…`, `src/vendor/fonts/`.

---

## 2. Three real bugs found and fixed

### 2.1 CORS — the whole flow was dead at the first click

`ExerciseSelect` showed *"Preview data / Failed to fetch"* against a **running,
healthy** backend. No CORS middleware existed, so the browser blocked every
request while the server returned 200 — `curl` looked fine.

Worse than a mislabelled footer: `POST /session/start` was blocked too, so
**the Start button did nothing** and no session could ever begin.

Fixed in `backend/app/main.py` (orchestrator — `main.py` is backend-core's
file, done as integration glue): `CORSMiddleware` with an origin regex for
localhost/127.0.0.1, no credentials. Marked `ponytail:` — correct for a
LAN-local clinical deployment, tighten to an allowlist if ever exposed beyond
the clinic network. Covered by `backend/app/routes/test_cors.py`, wired into
`backend/run_tests.sh`.

This is the repo's recurring silent-failure shape (PROJECT-STATUS §3): the
happy path reports success while the real path is dead. **No server-side test
can catch it — only a browser enforces CORS.** That is why J's harness drives
real Chrome against real uvicorn.

### 2.2 The report page ended live sessions

`Report.jsx` called `POST /session/end` on mount whenever `job_id` was missing.
A live session has no `job_id` **by definition**, so it fired exactly when it
was most harmful. Verified against a running server:

```
started LIVE session
before:  status "active"   ended_at null   job_id null
        ← report page's on-mount call →
after:   status "queued"   ended_at set    job_id job_b3ba4833...
```

A stale bookmark, a second tab, or a back-button press mid-squat would end the
session server-side — flushing the buffer, enqueuing the report job, tearing
down the WebSocket. **A read-only page destroying an in-progress session.**

**Root cause was the test, not the code.** `j7_j8_report` navigated straight to
the report page *without ending the session*, then demanded a job id. In
headless there is no camera, so no WebSocket, so H6's disconnect handler never
fired either. The only way to satisfy the test was for the page to end the
session itself. The implementing agent chose that and documented it honestly
rather than hiding it — but the test forced a hazard into the product.

Fixed both ends:
- **Test corrected** to end the session first, matching how a user actually
  reaches that page (End Session → report).
- **`Report.jsx` never ends anything.** Sessions end via J7's button or H6's
  disconnect handler. A session with no `job_id` is simply still running, and
  the page now says *"Session in progress — nothing queued yet"* instead of the
  misleading *"Analysis pending"*.

Note `gate_manualEndToEnd` never had this problem — it always ended the session
explicitly, which is the real J7 flow.

### 2.3 `https://tailwindcss.com` in the built CSS

Tailwind v4 stamps a `/*! … https://tailwindcss.com */` licence banner that
minifiers preserve on purpose. Stripped via a rollup `generateBundle` hook.

A comment, not a fetch — but treated as a genuine §8 violation, correctly: the
test cannot tell a comment from a request, and neither can a reviewer scanning
for leaks. Fonts were also unvendored in the new build; copied from the
existing `frontend/src/vendor/fonts/`, not re-downloaded.

---

## 3. Deviations from the plan

| Plan says | Built as | Why |
|---|---|---|
| **J1** "Plain HTML/JS, no framework, unless the team already knows React" | **React + shadcn + ReactBits + vite** | Owner instruction, stated twice. |
| `package.json`: "No build step, no framework" | **Build step exists** | Unavoidable: neither shadcn nor ReactBits ships a UMD bundle. That claim in `frontend/package.json` is now false. |
| — | ReactBits limited to zero-dep + `motion` tiers | `three`/`ogl`/`gsap` components are 500KB+ each. Offline delivery matters more than an animated background. |
| — | ElectricBorder removed after one render | It wrapped outside the card's height, so the three analysis-ready cards overflowed their grid cell and looked broken — worse than the plain ones they were meant to stand out from. |

**Offline is preserved.** Everything bundles locally; the J1 check asserts zero
external runtime URLs in `dist/`.

**Consequences to carry forward:**
- **K1** needs a build stage in the Docker image (`npm ci && npm run build`).
- `frontend/app/node_modules/` must be gitignored (~80MB).
- Runtime deps are 4: `react`, `react-dom`, `radix-ui`, `motion`.

---

## 4. The DOM contract

Tests key off `data-testid` / `data-*` **only** — never markup, structure or
class names. That is what lets Stitch/shadcn/ReactBits restyling proceed
without touching the suite.

| Attribute | Meaning |
|---|---|
| `[data-exercise="<name>"]` | one per exercise card |
| `[data-analysis="true\|false"]` | analysis availability |
| `[data-testid="start-<name>"]` | that card's Start button |
| `[data-testid="backend-status"]` | online vs preview |
| `[data-testid="job-id"]` | report: the job id |
| `[data-testid="analysis-state"]` + `data-state` | `pending\|ready\|unavailable` |
| `[data-testid="measured-panel"]` | E-DEC.6 left panel |
| `[data-testid="suggested-panel"]` | E-DEC.6 right panel |

---

## 5. What Phase I must change

`Report.jsx` polls `GET /session/{id}` because **I15's `GET /report/{id}` and
`GET /job/{id}` do not exist**. When they land:

1. Swap the poll target to `GET /job/{job_id}`.
2. Extend `analysisState()` — it is the single mapping point, deliberately.
3. Fill the **measured** panel from the rule findings (I10–I12). D7 proves the
   legacy report was **100% rules** — this panel is the report's spine.
4. Fill the **suggested** panel from model + SHAP, always hedged, carrying the
   model card's own caveats.

**E-DEC.6 is structure, not styling.** A rule *measures* a quantity; a model
*infers* a judgement, and SHAP explains what influenced a prediction — never
that the patient did the thing. That holds at F1 0.95 as much as at 0.46. Never
interleave the panels. Model quality changes *prominence*, never *placement*.

Both panels currently state that Phase I has not shipped, rather than inventing
findings (§8: no agent invents clinical wording).

---

## 6. Verification (re-run by the orchestrator, not taken on the agent's word)

```
frontend/tools/j_pages_test/run_j_test.mjs   29/29 checks passed
backend/run_tests.sh                          ALL BACKEND CHECKS PASSED
frontend/run_tests.sh                         ALL PHASE G CHECKS PASSED
```

Test files confirmed byte-identical to the approved versions before the
orchestrator's own correction in §2.2.

---

## 7. Outstanding

- **J9 / §7 gate — the human end-to-end has not been run.** Camera permission,
  live pose overlay, skeleton, audio cue, EMG chart, End Session, report.
  Phase J stays PARTIAL until someone does it.
- **`frontend/package.json`'s "no build step, no framework" line is now false.**
- **K1** must add the frontend build stage.
- The 9.4 fps question (docs/00_baseline.md §9.8) is untouched by J.
