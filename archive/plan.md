# Multi-Stopwatch Implementation Plan

The product direction is now elapsed-time stopwatches. The existing countdown implementation does not meet this specification, so Phases 2–4 are reopened for the stopwatch behavior.

## Phase checklist

- [x] Phase 1 — Project foundation
- [x] Phase 2 — Stopwatch state and persistence
- [x] Phase 3 — Stopwatch controls and display
- [x] Phase 4 — End-to-end verification and handoff

## Phase 1 — Project foundation

- Keep the Vite and TypeScript project, local development command, semantic page shell, responsive CSS, and single client-side state owner.
- Establish the stopwatch-specific data model in Phase 2; the current countdown data shape is not considered complete for the new product behavior.

**Status:** Complete for the existing project setup and reusable page foundation.

## Phase 2 — Stopwatch state and persistence

- Replace configured duration and remaining-time state with accumulated elapsed time, stopwatch status, and a start timestamp for the active stopwatch.
- Implement adding labeled stopwatches, starting, pausing, resuming, switching between stopwatches, individual clear, and clear-all.
- Implement reset separately from delete: reset stops a stopwatch, returns it to zero and Ready state, and preserves its label and entry.
- Provide a Reset all action that stops and zeros every stopwatch while preserving all labels and entries; keep it separate from Clear all.
- Enforce that no more than one stopwatch runs at a time. Starting another pauses the current stopwatch while preserving elapsed time.
- Calculate elapsed time from timestamps so delayed updates do not cause drift. Keep a running stopwatch advancing across reloads; restore paused stopwatches at their saved elapsed time.
- Version local storage and reject or safely discard the existing countdown-shaped saved data instead of interpreting it as stopwatch data.
- Handle absent, malformed, unsupported, or inconsistent persisted data safely.

**My verification:** Use an injectable clock and storage to check adding and labeling, count-up elapsed calculations, pause/resume, switching with one active stopwatch, resetting running and paused stopwatches, reload restoration for running and paused states, individual delete, clear-all, data-version rejection, invalid saved data, and storage failures.

## Phase 3 — Stopwatch controls and display

- Replace the duration form field with a label-only stopwatch creation form.
- Connect the stopwatch state to the on-screen list and display elapsed time upward as `MM:SS.hh` or `H:MM:SS.hh`.
- Provide mouse controls for start, pause, resume, individual clear, and clear-all. Remove countdown-only completion and restart behavior.
- Provide distinct Reset all and Clear all controls: Reset all preserves entries and labels, while Clear all deletes them.
- Add a Reset button that preserves the stopwatch entry and an X button that deletes it. Keep Reset separate from Clear all.
- Add digit shortcuts with `KeyboardEvent.key` for `1` through `9`, supporting both the main number row and numpad. Assign them to the first nine stopwatches in display order.
- Pressing another stopwatch's digit switches to it; pressing the active stopwatch's digit toggles pause/resume. Ignore shortcuts while an editable field has focus, so digits can be typed in labels.
- Make Ready, Running, and Paused states clear; ensure number shortcuts do not interfere with typing in editable fields.
- Keep the layout responsive and keyboard accessible.

**My verification:** Build and inspect the rendered controls; exercise mouse actions and digit shortcuts from both keyboard number sections, test same-digit pause/resume and typing/focus behavior, and review desktop and narrow layouts.

**Status:** Controls and display are implemented. TypeScript/build, local server checks, and headless browser shortcut checks passed. Human visual/mouse review and physical-keyboard use remain part of your hands-on acceptance.

## Phase 4 — End-to-end verification and handoff

- Fix issues found during review and confirm the production build succeeds.
- Update the README and project notes so they describe stopwatches rather than countdown timers.
- Document dependency installation, starting the local app, usage, keyboard shortcuts, and local storage behavior.

**My verification:** Perform a final browser pass for add/label, start, pause/resume, switching, reset running and paused stopwatches, X delete, clear-all, count-up accuracy after delayed updates, reload persistence for running and paused stopwatches, both main-row and numpad digit shortcuts, same-digit pause/resume toggling, and digit shortcuts after leaving the name field.

**Status:** Complete. Production build and headless Edge DOM interaction, persistence, focus-guard, digit-event, and responsive-layout checks passed. Manual visual/mouse review and keyboard use remain part of your hands-on acceptance.

**Your hands-on testing:** Run the app locally and repeat the core flows with your browser and keyboard. Confirm that elapsed time counts upward, only one stopwatch runs at once, pause/resume preserves accumulated time, reload restores the expected state, and number-row shortcuts work after leaving the name field (and numpad shortcuts if your keyboard has a numpad). Report any confusing behavior or differences before considering the app complete.

**Acceptance status:** Agent verification is complete; your hands-on browser, mouse, and keyboard review is pending.

## Total elapsed time follow-up

The total-time enhancement is tracked separately in [`../total-time.md`](../total-time.md). Its product rules are part of this specification. The implementation plan is:

- [x] Add a state-layer calculation that sums each stopwatch's current elapsed time, including the running stopwatch, without storing a separate total.
- [x] Display and refresh an accessible total-time summary using the `MM:SS.hh` / `H:MM:SS.hh` format and timestamp-based timing model.
- [x] Verify the aggregate across empty, Ready, Paused, and Running states; pause/resume and switching; reset; delete; Clear all; and reload.
- [x] Update README and project notes with implementation and verification results, then leave hands-on user acceptance steps.

## Double-time feature follow-up

The double-time feature is planned separately in [`../2x-time.md`](../2x-time.md). Phase 1 is complete: the specification now defines elapsed-reading intervals, pause and switch behavior, resume at `1×`, reset behavior, and persistence of an active `2×` run across reloads. Phases 2–5 remain to be implemented.
