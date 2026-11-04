# Multi-Stopwatch Project Notes

## Product direction correction

The requested behavior is an elapsed-time stopwatch, not a countdown timer. Each named stopwatch counts upward from zero; it has no configured duration, remaining-time value, or completed state. Only one stopwatch may run at a time. Starting another pauses the active one, and each stopwatch can resume from its accumulated elapsed time.

The initial direction correction changed documentation only. Phase 2 replaced the countdown state model with stopwatch state and persistence. Phase 3 has now connected the stopwatch controls and display; final browser review and user acceptance remain in Phase 4.

## Current implementation status

- **Phase 1 — Project foundation:** Complete. The Vite and TypeScript setup, local development command, semantic page shell, responsive CSS, and shared client-side state owner can be retained.
- **Phase 2 — Stopwatch state and persistence:** Complete. `src/state.ts` now uses accumulated elapsed milliseconds, status, and a running timestamp in a version 2 persisted format. Old countdown data is rejected and removed.
- **Phase 3 — Stopwatch controls and display:** Complete. The page has label-only creation, count-up stopwatch cards, mouse controls, reset and separate delete actions, and digit shortcuts for both the number row and numpad.
- **Phase 4 — End-to-end verification and handoff:** Agent work complete. Build, headless browser flows, and handoff documentation are verified; manual visual review and your physical-keypad acceptance remain.

## Revised documentation

- `spec.md` now describes the stopwatch behavior, timing/state rules, persistence, accessibility, and existing technology stack.
- `plan.md` marks Phases 1–4 complete and records your hands-on acceptance as pending.
- `README.md` explains how to run the app and use its stopwatch controls.
- The application shell uses stopwatch copy, and the form and timer cards are connected to the stopwatch store.

## Phase 2 implementation notes

- Added `Stopwatch`, `StopwatchStatus`, and `StopwatchAppState`; elapsed time accumulates in milliseconds. Ready, running, and paused are the only states.
- `StopwatchStateStore` supports add, start/resume, pause, switching, individual clear, clear-all, subscriptions, and timestamp-based elapsed-time snapshots.
- Persisted state uses version 2 under `multi-timer-state`. Starting a stopwatch stores the current start timestamp; pause/switch saves accumulated elapsed time. On reload, a running stopwatch continues from its timestamp and a paused stopwatch remains paused.
- The constructor validates labels, elapsed values, status/timestamp consistency, unique IDs, and the single-active-stopwatch invariant. Missing/invalid/legacy countdown state results in an empty store; blocked storage does not prevent in-memory use.
- At the end of Phase 2, the old duration field and countdown interactions were disabled while the stopwatch controls awaited Phase 3.

## Phase 2 verification

- `npm run build` — passed, including TypeScript checking and the Vite production build.
- Deterministic stopwatch checks — passed for adding/label trimming, count-up elapsed arithmetic, pause/resume, switching with one active stopwatch, running and paused reload restoration, clear-one, clear-all, version 1 countdown-data rejection, malformed JSON recovery, blank-label rejection, and storage write failure fallback.
- No browser interaction was tested because Phase 3 controls are not implemented yet. The state tests use an injected clock and storage adapter for deterministic results.

## Phase 3 implementation notes

- Replaced the temporary disabled creation form with an enabled label-only form. It trims labels, rejects whitespace-only names, clears after successful addition, and returns focus to the name field.
- Stopwatch cards display elapsed time counting upward in `MM:SS`, switching to `H:MM:SS` after one hour. Each card shows its label, Ready/Running/Paused state, and an accessible Start, Pause, or Resume action.
- Starting a card or its number-pad shortcut switches to that stopwatch; the store pauses the previously running stopwatch. The active stopwatch can be paused from its card.
- Reset stops a running or paused stopwatch, clears its elapsed time, returns it to Ready, and retains its label/list entry. The X button deletes the stopwatch and its persisted entry.
- Added individual Clear and working Clear all actions. The list and empty state update with the store, and the clear-all control is disabled when the list is empty.
- Digits `1` through `9` start or switch to the corresponding first nine stopwatches from either the number row or numpad. Pressing the active stopwatch's digit toggles pause/resume. The handler ignores editable fields, repeated keydown events, and modifier-key combinations; later entries show mouse-only guidance.
- The UI refreshes at 250 ms intervals. Displayed time comes from the state store's timestamp calculation, not interval callback counts.
- Timer cards use a responsive two-column desktop grid and one-column narrow layout. Visible focus styling and accessible labels are retained.

## Phase 3 verification

- `npm run build` — passed with strict TypeScript checking and a Vite production build.
- Local Vite smoke check — passed; `/`, `/src/main.ts`, `/src/state.ts`, and `/src/style.css` returned HTTP 200.
- Served-source checks — confirmed the label-only form is present, the duration field is absent, count-up formatting is wired, and digit shortcuts use `KeyboardEvent.key`.
- At Phase 3 completion, browser interaction had not yet been exercised. Phase 4 headless Edge checks cover DOM click flows, dispatched digit events from both keyboard number sections, editable-field protection, and responsive computed columns; human visual/mouse and keyboard review remains pending.

## Historical verification from the countdown version

The following checks were performed before the product direction changed. They verify the previous countdown application only; they are not evidence that the stopwatch requirements work.

- `npm run build` passed TypeScript checking and the Vite production build.
- Vite development and production preview smoke checks returned HTTP 200 for the page and generated assets.
- Deterministic state checks passed for the old countdown lifecycle, switching, persistence, clearing, completion, and malformed-data handling.
- No desktop browser or browser automation runtime was available for visual, mouse, or keyboard testing at that time. The later Phase 4 headless Edge verification is recorded below; human visual, mouse, and keyboard acceptance is still pending.

## Phase 4 findings

- Updated the README setup and usage guide for the stopwatch implementation. It documents installation, local development, production preview, mouse controls, numpad shortcuts, and `localStorage` behavior.
- Final code review found no further defects requiring changes.
- The production build passed with TypeScript checks. The local Vite app and transformed modules served successfully during browser verification.
- Production preview smoke test passed; the built page and generated JavaScript/CSS assets returned HTTP 200.
- Headless Edge end-to-end checks passed for adding multiple labeled stopwatches; count-up display; pause and resume; switching with only one active; numpad activation; ignoring shortcuts while the label field is focused; running stopwatch continuation across reload; paused-state persistence; hour-format display; individual clear; clear-all; and desktop/narrow responsive column counts.
- The browser reported no JavaScript runtime exceptions during the interaction pass.
- Human visual/mouse inspection and keyboard acceptance remain for the user; the first automated headless pass dispatched `KeyboardEvent.code` numpad events. The later shortcut follow-up also validates `KeyboardEvent.key` digit events from both number sections.

## Phase 4 verification

- `npm run build` — passed.
- Headless Edge browser checks — passed for UI controls, keyboard handling, focus guard, local storage, reload behavior, and responsive layout.
- Production and development server smoke checks — passed in the current and prior phases.
- User acceptance is pending a hands-on run in a regular browser using mouse controls and number-row shortcuts; a numpad can also be used if available.

## Number shortcut follow-up

- Changed shortcut detection to `KeyboardEvent.key` digits `1`–`9`, so both the main number row and numpad work on laptops and desktops.
- The active stopwatch's digit now toggles it between running and paused; pressing it again resumes. A different stopwatch's digit switches to that stopwatch.
- Shortcut handling remains disabled while an editable field has focus, allowing digits in names. Repeated keydown events are ignored to avoid rapid toggling while a key is held.
- Updated the card keycaps, on-screen instructions, spec, plan, and README to describe the new behavior.
- `npm run build` passed after the change. Headless Edge regression checks passed for the main number row and numpad, same-digit pause/resume, switching to another stopwatch, shortcut suppression in the label field, ignoring repeated keydown/modifier events, and allowing digits in stopwatch names.

## Reset and delete follow-up

- Added a per-stopwatch Reset button that stops the stopwatch, sets elapsed time to zero, returns it to Ready, and preserves the label and list entry. Resetting a running stopwatch clears the active stopwatch ID.
- Kept deletion as a separate X button with a stopwatch-specific accessible name; deletion still removes its saved entry.
- The README and specification now distinguish Reset from X/delete and Clear all.
- `npm run build` passed. Headless Edge checks passed for reset while running and paused, persistence of the zeroed Ready state, entry preservation, accessible X labeling, X deletion, and removal from saved storage.

## Data compatibility note

The browser may contain saved countdown entries under the existing `multi-timer-state` storage key. The current store requires version 3 and discards countdown-shaped data safely. Valid version 2 stopwatch data migrates automatically; it does not infer stopwatch elapsed time from old configured durations or remaining seconds.

## Total elapsed time — Phase 1

- Clarified the feature as the sum of current elapsed time across all stopwatches, including Ready, Paused, and Running entries.
- The total will be derived from timestamp-based stopwatch state, not persisted or maintained as an independent counter. Reset removes that stopwatch's contribution; X/delete removes the entry and contribution; Clear all returns the total to zero.
- Updated `archive/spec.md` with the behavior and `archive/plan.md` with the implementation and verification outline. The root-level spec and plan files are absent, so the existing archived documents remain the project references.
- Marked Phase 1 complete in `total-time.md`. No application code was changed and no implementation tests were run in this documentation phase.

## Total elapsed time — Phase 2

- Added `StopwatchStateStore.getTotalElapsedMs()` in `src/state.ts`. It sums elapsed time from the current state snapshot, so a running stopwatch contributes its timestamp-derived current time and stopped stopwatches contribute their saved elapsed time.
- The calculation returns zero when the list is empty, does not mutate state, and does not persist an aggregate. `getState()` captures one `now` value for the snapshot, keeping the aggregate internally consistent.
- Marked Phase 2 complete in `total-time.md` and checked off the corresponding state-calculation item in `archive/plan.md`.
- No tests were run in this phase; aggregate verification remains listed in the feature plan's verification work.

## Total elapsed time — Phase 3

- Added an always-visible Total elapsed time summary above the stopwatch creation form. It starts at `00:00` when the list is empty and uses the same `MM:SS` / `H:MM:SS` formatting as individual stopwatches.
- The summary refreshes on the existing render/update cycle. Rendering takes one stopwatch snapshot and passes it to `getTotalElapsedMs()`, so the total and cards use the same timestamp sample.
- Styled the summary to stay legible at narrow widths and exposed it with the accessible label Total elapsed time and a timer role.
- Marked Phase 3 complete in `total-time.md` and checked off its interface item in `archive/plan.md`. Build and browser verification remain in Phase 4.

## Total elapsed time — Phase 4

- Updated the README to describe the aggregate: all stopwatch states contribute, the value changes with the active stopwatch and reset/delete/Clear all actions, and no separate total is persisted.
- `npm run build` passed, including the TypeScript typecheck and Vite production build.
- Deterministic state checks passed for empty and Ready lists, timestamp-derived Running time, Paused time, switching between stopwatches, restoration after reload, reset, delete, Clear all, and confirming the aggregate is not stored separately.
- Headless Edge browser checks passed for the visible total matching the individual displays, zero with no stopwatches, running updates, pause/switch and combined totals, paused reload restoration, running reload continuation, reset preserving the entry while reducing the total, X deletion, Clear all while running, `H:MM:SS` formatting, accessible timer labeling, and a 390px mobile viewport without horizontal overflow.
- Checked off Phase 4 in `total-time.md` and the verification and documentation tasks in `archive/plan.md`. The user's hands-on visual, mouse, and keyboard acceptance remains pending.

## Hundredths display precision update

- Updated each stopwatch and the total elapsed-time summary to display hundredths (`MM:SS.hh`, or `H:MM:SS.hh` after an hour).
- Changed the display refresh interval from 250 milliseconds to 10 milliseconds. Elapsed time continues to come from timestamps; the interval only refreshes the display and does not accumulate time.
- Updated the archived specification, total-time feature plan, and README with the precision and format.
- Implementation verification was not run for this follow-up request.

## Reset all follow-up

- Added a separate **Reset all** button that sets every stopwatch to zero and Ready, clears the active stopwatch, and preserves all entries and labels. **Clear all** continues to delete every entry.
- The Reset all button is disabled when there are no stopwatches or all stopwatches are already at zero in Ready state.
- Added `StopwatchStateStore.resetAll()` and updated the archived specification, implementation plan, total-time plan, and README.
- Implementation verification was not run for this follow-up request.

## Double-time feature - Phase 5

- Added the Space shortcut to toggle only the running stopwatch between 1x and 2x. Repeated events, modifier combinations, editable fields, and focused controls do not trigger the shortcut; handled Space events prevent page scrolling.
- Stopwatch cards display the current rate while running and each double-time interval as elapsed stopwatch readings. An active interval is shown through the current reading and marked ongoing.
- Persistence now writes version 3. Valid version 2 data migrates automatically; legacy records default to 1x and empty interval history, while valid Phase 2 fields are retained. Invalid version 3 state is discarded safely.
- `npm run build` passed. Deterministic state acceptance checks passed for transition continuity, 2x elapsed arithmetic, derived totals, multiple interval boundaries, pause/resume/switch/reset, active 2x reload restoration, both version 2 migration shapes, and malformed version 3 rejection.
- Headless Chrome production rendering passed at desktop and a 390px embedded viewport. At 390px, the app shell fits inside the viewport with no horizontal document overflow. Browser interaction checks confirmed page Space toggles the rate and closes the interval; Space on the name field or focused button, and repeated Space events, are ignored.

### Hands-on acceptance checklist

- [ ] Add a stopwatch, start it, and press Space. Confirm its reading does not jump and then advances at double speed.
- [ ] Press Space again. Confirm normal speed resumes and the interval start/end readings appear on the card.
- [ ] Press Space while the name field and a stopwatch button are focused. Confirm typing and native button activation remain available without changing the rate.
- [ ] Pause or switch stopwatches during 2x, then resume. Confirm the open interval closes and the resumed stopwatch runs at 1x.
- [ ] Reload during a 2x interval and confirm the rate and ongoing interval continue; reset and delete stopwatches and confirm their interval history clears with them.
- [ ] Review the cards and interval text at desktop and a narrow phone-sized viewport.
