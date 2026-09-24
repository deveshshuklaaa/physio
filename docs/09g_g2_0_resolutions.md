# Group 2 — Phase G2-0 resolutions

**Decided:** 2026-09-10. Closes the five G2-0 blockers in
`docs/09_integration_plan_group_2_ui_integration.md` §5 and the open items in §9.
Decisions here are the user's; rationale and any residual risk is recorded so the
next session does not re-litigate them.

---

## G2-0.1 — Atlas passwords: NOT rotated

**Decision:** keep the current Atlas credentials. No rotation during the
integration window.

**Accepted risk.** Two passwords are already public (root `.env.example`, one
chat transcript). Anyone holding either has read/write on the `hemophilia`
database, including `patientprofiles` and `hemophiliadetails`. This is acceptable
only while the database holds seeded/test patients (verified 2026-09-09:
`users` n=6, `patientprofiles` n=2). **Rotation is mandatory before any real
patient record is entered.** Compensating control available today: restrict the
Atlas project's IP access list to the dev machines actually in use.

## G2-0.2 — `.env.example`: unchanged

**Decision:** leave `.env.example` and the `!.env.example` negation in
`.gitignore` as they are. The credential line stays.

Follows from G2-0.1 — removing the line from the working tree does not unpublish
it from history, and the password is not being rotated, so the removal would buy
nothing. Same trigger as above: when credentials are rotated, delete this line in
the same change.

## G2-0.3 — `crypt_shared`: installed, but **wrong architecture**

**Decision:** enable CSFLE using the library unpacked at the project root:

```
mongo_crypt_shared_v1-linux-aarch64-enterprise-amazon2023-8.3.9/lib/mongo_crypt_v1.so
```

`part2/Hemophillia-confirm/backend/config/db.js:86` already reads
`CRYPT_SHARED_LIB_PATH` from the environment, so no code change is needed — set:

```
CRYPT_SHARED_LIB_PATH=/home/billa-dakait/Desktop/final_project/mongo_crypt_shared_v1-linux-aarch64-enterprise-amazon2023-8.3.9/lib/mongo_crypt_v1.so
```

**Blocker, unresolved.** That build is aarch64; this host is x86_64:

```
$ uname -m
x86_64
$ file .../lib/mongo_crypt_v1.so
ELF 64-bit LSB shared object, ARM aarch64, ...
```

`db.js:90` only does `fs.existsSync()`, so the file *will* be found and CSFLE
*will* be attempted — then fail at `dlopen`, at connect time rather than at boot
validation. Download the
`mongo_crypt_shared_v1-linux-x86_64-enterprise-*` tarball of the same 8.3.x
version and point the env var at that. Until then the stack runs with
`CSFLE DISABLED (cleartext)`, which is the pre-existing state, not a regression.

The aarch64 copy is still the right artifact for an arm64 container image; if the
compose stack ever builds for arm64, keep both and select by platform.

## G2-0.4 — Ankle mapping: `heel_slides`

**Decision:** the Ankle category maps to `heel_slides` → our engine exercise
`heel_slide`. D4 stands as written.

Noted for the record: `heel_slides` is biomechanically a **knee** exercise in both
catalogues (`backend/app/config/exercises.json`, and their
`MANUAL_EXERCISE_CATALOG`). This is a deliberate product call — it is the only
exercise our engine can assess that an ankle-affected patient can perform safely
— not a mapping error. Their `heel_raises` entry is not routed anywhere and is
removed with the rest of the trimmed catalogue in G2-C1. Do not "fix" this
mapping in a later pass without re-reading this paragraph.

## G2-0.5 — Revised Gemini prompt

Written below, `promptVersion: "g2-v1"`. It replaces the prompt body of
`build_gemini_prompt_generic()`
(`backend/_old_physio_reference/gemini.py:141-205`) when agent 18 ports it in
G2-F2. The data-assembly half of that function (error counts, rep lines, error
descriptions) is unchanged and still produces the substitutions used here.

---

# The `g2-v1` prompt

Substitutions, all already computed by the existing builder:
`{name}`, `{description}`, `{total}`, `{clean}`, `{clean_rate}`,
`{error_summary}`, `{rep_lines}`, `{error_descriptions}`.

```text
You are writing a short session note for a patient with hemophilia who has just
finished a home physiotherapy session. A camera-based pose system counted the
repetitions and flagged form errors. You are reading only that automated
movement data. You did not see the patient, and no clinician reviewed this
session.

Exercise: {name}
{description}

SESSION DATA
Total reps:  {total}
Clean reps:  {clean}
Failed reps: {failed}
Clean rate:  {clean_rate}%

Error frequency (number of reps each error appeared in):
{error_summary}

Rep-by-rep breakdown:
{rep_lines}

ERRORS THIS SYSTEM DETECTS FOR THIS EXERCISE
{error_descriptions}

CLINICAL CONTEXT — THIS SHAPES EVERYTHING YOU WRITE
This patient has hemophilia. Repeated bleeding into a joint causes
hemarthrosis, synovitis and, over time, arthropathy. Their target joint is
already vulnerable. Because of that:

- Pain, warmth, tightness or swelling in a joint is a possible bleed. It is
  never something to work through, breathe through, or push past. If the
  session data suggests the patient was struggling, say plainly that stopping
  and contacting their care team is the correct response, not persistence.
- Never tell the patient to add repetitions, add sets, add weight or
  resistance, train more often, increase range of motion, or progress to a
  harder exercise. Their plan was approved by their doctor. Changing the dose
  is the doctor's decision, not yours and not the patient's.
- Say nothing about factor products, prophylaxis, dosing, timing of infusions,
  pain medication, or ice and heat. Those are clinical decisions.
- Do not diagnose. Do not state or imply that a bleed, a joint problem, or any
  condition is present or absent. You are describing movement quality only.
- Corrections must be about technique and control: slower tempo, smaller and
  cleaner range, better alignment, resting longer between reps. Never about
  effort or intensity.

WHAT YOU MAY AND MAY NOT CLAIM
The numbers above come from rule-based pose checks on a live camera feed. They
are a measurement of movement, not a clinical assessment, and no predictive
model examined this patient. Do not describe this note as an analysis,
assessment, diagnosis, or AI evaluation of their condition. Do not invent data
that is not in the session above — if there were few reps, or none were clean,
work with that honestly rather than filling the gap.

REPORT STRUCTURE — use exactly these four headings:

## How the session went
One short paragraph. Honest about the numbers, warm in tone. If the clean rate
was low, treat it as information, not failure.

## What to adjust
The 1 to 3 most frequent or most important form errors. For each: name it,
say in one sentence what is physically happening, and give two or three
specific technique cues. Cues about control, alignment and tempo only.

## What went well
Real positives from the data: consistency, errors that did not appear,
improvement across the set. If the data is thin, say something true and brief
rather than padding.

## Next session
One clear priority, expressed as a technique focus at the same dose their
doctor approved.

## When to stop
Two or three lines, always included, in plain language: stop the exercise and
contact your care team if a joint becomes painful, warm, swollen or tight, if
it feels full or "different", or if you lose movement in it. Do not soften this
into a footnote.

Tone: a physiotherapist speaking directly to their patient. Second person.
Professional, warm, never alarming and never cheerleading.
Plain text only. No asterisks, no bold, no bullet characters other than "-".
English. Under 400 words total.
```

## Notes for the implementer (G2-F2)

- `promptVersion: "g2-v1"`. Bump the version on any wording change to the
  clinical-context or "when to stop" blocks; those are the safety-bearing parts.
- `## When to stop` is mandatory output. If the model omits it, that is a
  defect, not a style variance.
- The prompt is English-only by construction. G2-G6 owns telling a Hindi or
  Marathi user that, or translating it.
- Keep `temperature: 0.4` from the old `call_gemini()`. Drop
  `maxOutputTokens: 100000` — the report is under 400 words; cap it around 2048
  so a runaway generation fails fast.
- §8 of the plan still governs how the UI labels this text: a coaching narrative
  built from rule-based rep data, not the Phase I model-explained report.

---

## Status after this document

| Item | State |
|---|---|
| G2-0.1 | Closed — accepted risk, rotate before real patients |
| G2-0.2 | Closed — no change, tied to G2-0.1 |
| G2-0.3 | **Blocked** — need the x86_64 build of `crypt_shared` |
| G2-0.4 | Closed — `heel_slides` |
| G2-0.5 | Closed — `g2-v1` above |

G2-A is unblocked and can start. G2-0.3 does not block G2-A; it blocks any claim
that patient data is encrypted at rest in the field-level sense.
