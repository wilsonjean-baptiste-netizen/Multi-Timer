# Total Stopwatch Time Feature Plan

## Goal

Add a visible total that sums the elapsed time of every stopwatch. The total includes Ready, Paused, and Running stopwatches. It updates while a stopwatch is running and reflects reset, delete, and Clear all actions.

## Product rules

- Calculate the total from the current elapsed time of each stopwatch; do not maintain a separate counter that could drift from individual stopwatch state.
- Use the existing timestamp-based elapsed-time calculations so delayed display updates do not affect accuracy.
- Include the active stopwatch's time as it advances, along with the saved elapsed time of all other stopwatches.
- Reset subtracts that stopwatch's elapsed time by setting its elapsed value to zero, while keeping the entry.
- Reset all sets every stopwatch contribution to zero while keeping all entries and labels.
- Deleting a stopwatch removes its elapsed time from the total. Clear all makes the total zero.
- Format the total to hundredths of a second: `MM:SS.hh`, with hours as `H:MM:SS.hh` when needed.
- Show the total in a clearly labeled, accessible summary that remains visible and usable on narrow screens.
- The total is derived from stopwatch data and requires no separate persisted value. Existing persistence and reload behavior should therefore restore the correct total automatically.

## Implementation phases

- [x] **Phase 1 — Confirm behavior and update documentation**
  - Add the total-time behavior and reset/delete effects to `spec.md`.
  - Add this feature to the relevant implementation and verification steps in `plan.md`.
  - Confirm that the aggregate includes all stopwatch states and is derived from elapsed time rather than tracked independently.

- [x] **Phase 2 — Add aggregate elapsed-time calculation**
  - Add a state-layer calculation for total elapsed milliseconds using the current stopwatch snapshot, including the running stopwatch's up-to-date elapsed time.
  - Preserve the existing one-running-stopwatch rule and timestamp-based timing model.
  - Ensure the calculation returns zero for an empty list and does not mutate or persist separate aggregate state.

- [x] **Phase 3 — Display and maintain the total in the interface**
  - Add a clearly labeled total-time summary near the stopwatch list.
  - Format it consistently with individual stopwatch displays, including values over one hour.
  - Refresh it with the existing UI update cycle while a stopwatch runs.
- Ensure add, reset, Reset all, X/delete, Clear all, switching, pause/resume, and reload all display the expected aggregate.
  - Keep the summary readable and responsive on desktop and narrow screens, with an accessible label.

- [x] **Phase 4 — Verify and document handoff**
  - Update `README.md` and `project-notes.md` with the total-time behavior and verification results.
  - Build the application and exercise deterministic aggregate calculations and browser interactions.
  - Leave a concise hands-on acceptance checklist for the user.

## Verification plan

### My verification

- Check aggregate calculations for an empty list, one stopwatch, and multiple Ready, Paused, and Running stopwatches.
- Confirm that elapsed time from the running stopwatch advances the aggregate based on timestamps, including after delayed display updates.
- Confirm pause/resume and switching preserve the same aggregate at the transition and then advance only for the active stopwatch.
- Confirm individual reset and Reset all reduce the total to the expected value; confirm X/delete and Clear all remove entries and their contributions.
- Confirm the displayed format handles minutes, hours, and totals over one hour.
- Reload with a running stopwatch and with paused stopwatches; confirm the aggregate is reconstructed from restored stopwatch state without a separately saved total.
- Check the summary's accessible name and layout at desktop and narrow viewport sizes.
- Run the project build and browser checks for the updated behavior.

### User hands-on testing

- Add multiple stopwatches and check that the total equals their displayed elapsed times combined.
- Start one stopwatch, wait, pause it, and start another; confirm only the active stopwatch advances the total.
- Reset one stopwatch and confirm its time is removed from the total while its label remains.
- Delete one stopwatch with X, then use Clear all; confirm the total updates and reaches zero.
- Reload while a stopwatch is running and while stopwatches are paused; confirm the total matches their restored times.
- Check that the total remains easy to read on the user's regular desktop and narrow window sizes.

## Acceptance criteria

- A labeled total is visible alongside the stopwatch interface and equals the sum of all stopwatch elapsed times.
- The total advances while a stopwatch runs and remains stable when all are paused or Ready.
- Reset, Reset all, deletion, Clear all, and reload produce the correct aggregate.
- The total uses accurate timestamp-derived elapsed time and the existing display format.
- Build and implementation verification pass; user hands-on review is recorded separately.
