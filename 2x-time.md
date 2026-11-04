# Double-Time Stopwatch Feature Plan

## Goal

Let the user temporarily make the running stopwatch count at twice its normal rate. Preserve the existing timestamp-based timing model, show when double time was active, and persist the mode and interval history across reloads.

## Product rules

- Spacebar toggles the currently running stopwatch between `1×` and `2×`. It does not start or pause a stopwatch.
- A rate change preserves the current displayed elapsed time. If the stopwatch reads `00:24.17` when double time starts, it remains at `00:24.17` at the transition and advances at twice the normal rate afterward.
- Calculate elapsed time from timestamps and the active rate. Display refresh intervals must not determine elapsed time.
- Record each double-time interval using the stopwatch's elapsed-time readings at its start and end, for example `00:24.17–00:40.00`. These values are stopwatch readings, not wall-clock times.
- Show the current rate and an open interval while double time is active, such as `2×` and `00:24.17–ongoing`. Show completed intervals on that stopwatch.
- The derived total continues to sum all stopwatch readings. It therefore advances at twice the normal rate while a stopwatch is in double time.
- Only a running stopwatch can enter double time. Pausing or switching to another stopwatch closes any open interval and returns the stopped stopwatch to `1×`. Resuming starts at `1×`.
- Resetting a stopwatch clears its interval history along with its elapsed time. Deleting a stopwatch removes its interval history.
- Preserve a running stopwatch's rate and open interval across reloads, consistent with existing running-stopwatch persistence.
- Ignore Space shortcuts while typing in editable controls, during key repeat, or when modifier keys are held. Preserve normal Space activation for focused controls.

## Proposed state model

- Keep accumulated elapsed time in milliseconds.
- Store the active multiplier as `1` or `2` and use the start timestamp as the anchor for the current rate segment.
- Store completed double-time intervals as pairs of start and end elapsed-time values.
- Store the start elapsed-time value for an open double-time interval while the stopwatch is running at `2×`.
- Validate that interval values are finite, nonnegative, ordered, and consistent with stopwatch status and multiplier.
- Keep interval history attached to its stopwatch; do not add a separate total-time counter.

## Implementation phases

- [x] **Phase 1 — Confirm behavior and update the main specification**
  - Add double-time rules to `spec.md` and link this plan from `plan.md`.
  - Confirmed: pause or switching ends an open interval; resuming starts at `1×`; reset clears interval history; reload preserves an active `2×` run and its open interval.
  - Confirmed: interval values are elapsed-time readings on the stopwatch, not wall-clock timestamps. The active interval shows its start reading through the current reading, then stores the end reading when closed.

- [x] **Phase 2 — Extend timestamp-based stopwatch calculations**
  - Add a state operation to toggle the active running stopwatch between `1×` and `2×`.
  - At each rate change, checkpoint elapsed milliseconds using the old multiplier, then anchor the new rate at the current timestamp. This prevents a jump or lost time at the transition.
  - Open a double-time interval at the current elapsed reading when entering `2×`; close it at the current reading when returning to `1×`.
  - Close an open interval when pausing or switching stopwatches. Ensure a resumed stopwatch starts at `1×`.
  - Keep the aggregate total derived from each stopwatch's current elapsed value.
  - Implemented in `src/state.ts`. Legacy version 2 records without double-time fields load at `1×` with empty interval history.

- [x] **Phase 3 — Version and migrate persisted state**
  - Bump the persisted stopwatch format from version 2 to version 3.
  - Migrate legacy version 2 stopwatches without double-time fields to `1×` with empty interval history, preserving labels, elapsed time, status, active stopwatch, and running timestamps. Preserve valid multiplier and interval fields already written by Phase 2.
  - Persist the multiplier, completed intervals, and open interval start value for version 3.
  - Reject malformed or inconsistent double-time state safely without affecting valid migrated state.
  - Implemented in `src/state.ts`: valid version 2 data is normalized and immediately rewritten as version 3; already-present double-time fields are preserved. Version 3 requires all double-time fields, and partial or inconsistent data is rejected.

- [x] **Phase 4 — Add keyboard and visible interface support**
  - Handle `KeyboardEvent.code === "Space"` for the active running stopwatch. Prevent page scrolling only when the shortcut is handled.
  - Ignore repeated keydown events, modifier combinations, editable targets, and native Space activation on unrelated focused controls.
  - Show a clear `1×` or `2×` indicator on the running stopwatch.
  - Show the live double-time interval while active and completed intervals after the mode returns to `1×` or the stopwatch pauses.
  - Advertise the Space shortcut in accessible help text; ensure labels and intervals remain readable on narrow screens.
  - Implemented in `src/main.ts`, `src/style.css`, and `index.html`. Space toggles rate only for the running stopwatch, with native control activation and editable fields left to the browser. The card shows the running rate and completed or ongoing interval readings.

- [x] **Phase 5 — Verify, document, and hand off**
  - Verify rate transitions, pause/switch behavior, persistence migration, reload restoration, interval display, and total-time updates.
  - Build the app and check the interface at desktop and narrow viewport sizes.
  - Update `README.md` and project notes with the double-time shortcut and interval behavior.
  - Leave a concise hands-on acceptance checklist for keyboard and mouse review.
  - Completed: build and deterministic state acceptance checks passed; headless Chrome checked the production UI at desktop and a 390px viewport, including Space behavior, interval display, and no horizontal overflow. Updated `README.md` and `project-notes.md` with behavior and a manual acceptance checklist. Hands-on review on the user's regular device remains pending.

## Verification plan

### State and timing

- Starting double time at `00:24.17` leaves the reading unchanged at that instant and advances at twice the normal rate.
- Returning to `1×` leaves the reading unchanged at the transition and closes the interval at that reading.
- A `1× → 2× → 1× → 2× → 1×` sequence records two separate intervals without time gaps or jumps.
- Delayed refresh callbacks do not cause drift; hundredths display remains timestamp-derived.
- The total equals the sum of the stopwatch readings and advances at the correct rate.
- Pausing or switching closes an open interval. Resuming begins at `1×` and preserves completed history.
- Reset clears elapsed time and interval history. Delete removes the stopwatch and its history; Clear all removes all stopwatch data.

### Persistence and keyboard behavior

- A valid version 2 state migrates to version 3 at `1×` without losing stopwatch data.
- Reloading while at `1×` or during an open `2×` interval restores the expected elapsed time, multiplier, and interval display.
- Invalid rates or interval ranges are rejected safely.
- Space toggles only the active running stopwatch, does nothing when none is running, and does not scroll the page when handled.
- Space does not interfere with typing, focused buttons, modifier keys, or repeated key events. Existing number shortcuts continue to work.

### User hands-on testing

- Start a stopwatch, wait for `00:24.17` or another visible reading, press Space, and confirm the value does not jump and then advances at double speed.
- Press Space again and confirm normal speed resumes and the interval is shown on the card.
- Pause, switch to another stopwatch, resume, reset, and reload; confirm the displayed rate and interval history match the rules above.
- Check the shortcut and interval display with the user's regular keyboard and at desktop and narrow window sizes.

## Acceptance criteria

- Spacebar toggles the running stopwatch's rate between `1×` and `2×` without starting, pausing, or changing its current reading at the transition.
- Each double-time interval is visible with its start and end stopwatch readings; the active interval is identified as ongoing.
- Timestamp-based timing stays accurate through rate changes, delayed refreshes, pause/resume, switching, and reload.
- Existing version 2 stopwatch data migrates without losing time or labels.
- The total remains the sum of all current stopwatch readings.
- Keyboard handling remains accessible and does not disrupt editable fields, controls, or existing number shortcuts.
