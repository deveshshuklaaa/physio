# Font Scale Plan — Single-Knob Text Size Control

## Problem

~1,900 inline `font-size` declarations across 32 JSX/CSS files in `part2/Hemophillia-confirm/frontend/src/pages/`. Most body text is 10–13px (small). No central control — every size is hardcoded.

## Solution

One CSS custom property `--font-scale` on `:root`. All font sizes reference it. Change `--font-scale: 1` → `--font-scale: 1.2` = everything 20% bigger.

## Current State

| Size | Count | Typical role |
|------|-------|-------------|
| 8–9px | 244 | Micro text, fine print |
| 10–11px | 376 | Labels, captions |
| 12–13px | 357 | Secondary/body text |
| 14–15px | 149 | Body text |
| 16–18px | 90 | Prominent text |
| 19–25px | 126 | Section headers |
| 26px+ | 58 | Page titles, hero |

Top files by count: AdminDashboard (224), AdminDoctorRequestDetails (203), PatientResearch (201), DoctorDashboard (199), HemophiliaDetailsScreen (172), AwarenessScreen (144).

## Implementation

### Phase 1 — The Knob (Approach A: mechanical wrap)

1. Add to `styles.css`:
   ```css
   :root {
     --font-scale: 1;
   }
   ```

2. Replace every `font-size: Xpx` in `<style>` blocks and CSS files with:
   ```css
   font-size: calc(Xpx * var(--font-scale));
   ```

3. Replace every JSX inline `fontSize: X` or `fontSize: "Xpx"` with:
   ```jsx
   fontSize: "calc(Xpx * var(--font-scale))"
   ```

4. Scriptable via sed (CSS) + codemod (JSX). Zero visual change at `--font-scale: 1`.

### Phase 2 — Semantic Tokens (optional, later)

Define 8 tokens that all reference `--font-scale`:

```css
:root {
  --font-scale: 1;
  --fs-micro: calc(8px * var(--font-scale));
  --fs-xs:    calc(10px * var(--font-scale));
  --fs-sm:    calc(12px * var(--font-scale));
  --fs-base:  calc(14px * var(--font-scale));
  --fs-md:    calc(16px * var(--font-scale));
  --fs-lg:    calc(20px * var(--font-scale));
  --fs-xl:    calc(25px * var(--font-scale));
  --fs-2xl:   calc(32px * var(--font-scale));
}
```

Migrate file-by-file, mapping each hardcoded size to nearest token. Requires judgment for in-between sizes (10.5px, 13.5px, etc.).

## Verification

1. Build: `npm run build` — no errors
2. Visual check at `--font-scale: 1` — must look identical to current
3. Visual check at `--font-scale: 1.2` — bigger text, no overflow/clipping
4. Check responsive: phone width (375px) at both scales

## Effort Estimate

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1 (calc wrap) | ~2 hours (scriptable) | Low |
| Phase 2 (semantic tokens) | ~4 hours (per-file review) | Medium |

## Recommendation

Do Phase 1 first. Knob works immediately. Phase 2 is cleanup — do it file-by-file when touching each page for other reasons.
