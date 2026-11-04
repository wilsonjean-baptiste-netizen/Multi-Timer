# Multi-Stopwatch — Product and Technical Specification

## Product purpose

A small local web application for creating and displaying multiple named stopwatches. Each stopwatch measures elapsed time upward from zero. At most one stopwatch may run at once.

## Total elapsed time

- Show a clearly labeled total elapsed time that sums the current elapsed time of every stopwatch, including Ready, Paused, and Running stopwatches.
- Derive the total from the stopwatch elapsed-time values; do not keep a separate aggregate counter or persisted total.
- Include the running stopwatch's timestamp-derived elapsed time so the total advances while it runs. Continue to use timestamps as the source of timing accuracy.
- Resetting a stopwatch sets its contribution to zero while preserving its entry. Deleting a stopwatch removes its contribution. Clear all returns the total to zero.
- Provide a Reset all action that zeros and stops every stopwatch while preserving all labels and entries; keep it separate from Clear all, which deletes entries.
- Reconstruct the total from the individual stopwatch state after reload; no additional persistence field is needed.
- Display the total using hundredths precision: `MM:SS.hh`, adding hours as `H:MM:SS.hh` when needed.
- Keep the total summary accessible and readable at desktop and narrow screen sizes.
- The total includes any double-time rate applied to the running stopwatch because it is derived from the current elapsed readings.

## Behavior

- Let the user add multiple stopwatches by entering a label. New stopwatches begin at `00:00` in a ready state; there is no configured duration.
- Show all stopwatches on screen at once, including their label, elapsed time, and state: Ready, Running, or Paused.
- Let the user start a ready stopwatch, pause a running stopwatch, and resume a paused stopwatch without losing its accumulated elapsed time.
- Starting or resuming a different stopwatch automatically pauses the currently running stopwatch and preserves its elapsed time.
- Let the user activate a stopwatch by selecting its on-screen control or by pressing its assigned number key. Assign `1` through `9` to the first nine stopwatches in their displayed order; these shortcuts work from either the main number row or a numpad. Later stopwatches remain usable by mouse.
- Pressing the number for a different stopwatch starts or resumes it and pauses the currently running stopwatch. Pressing the active stopwatch's number again pauses it; pressing that number again resumes it.
- Ignore number shortcuts while the user is typing in a form field or another editable control, so digits can be included in stopwatch names. After leaving an editable field, number shortcuts are active again.
- Provide a Reset action on each stopwatch. Reset stops that stopwatch, returns elapsed time to `00:00`, and leaves it in Ready state without removing the entry or label.
- Provide a separate X delete action on each stopwatch and a Clear all action. Deleting removes the entry and its saved state; resetting preserves the stopwatch.
- Provide a Reset all action that returns every stopwatch to zero and Ready while preserving the list and labels.
- Keep a running stopwatch running across a page reload or app close by restoring its start timestamp and accumulated elapsed time. A paused stopwatch stays paused and resumes from its saved elapsed time.
- Display elapsed time to hundredths of a second as `MM:SS.hh` and include hours as `H:MM:SS.hh` when needed. The display must count upward and must not stop at a duration or enter a completed state.

## Double-time mode

- Pressing Space toggles the currently running stopwatch between normal `1×` speed and `2×` speed. Space does not start or pause a stopwatch.
- A rate change is continuous: the elapsed display keeps its current value at the transition, then advances at the selected rate. Calculate elapsed time from timestamps and the active multiplier, never from interval callback counts.
- Show the running rate on the stopwatch card. Record each double-time interval as a start and end reading on that stopwatch's elapsed-time scale, for example `00:24.17–00:40.00`; these are not wall-clock times. Show an active interval from its start reading through the current reading.
- Only a running stopwatch can use double time. Pausing it or switching to another stopwatch closes the current interval and returns it to `1×`. Resuming starts at `1×`.
- Reset clears that stopwatch's interval history. Deleting a stopwatch removes its history.
- If the page reloads while a stopwatch is running at `2×`, it remains at `2×` and the open interval continues. Reload at `1×` preserves its normal running state.
- Ignore Space shortcut handling during key repeat, with modifier keys, while an editable control has focus, or when Space should activate a different focused control. Prevent page scrolling only when the shortcut is handled.

## Stopwatch layouts

- Provide a visible two-option layout selector above the stopwatch list: **Numpad** and **Inline**. Implement it as a segmented pair of buttons with an accessible group name, pressed state for the selected option, and visible keyboard focus.
- Numpad layout places the first nine stopwatches according to their assigned shortcut numbers in a 3x3 physical-keypad arrangement:

  ```text
  7 8 9
  4 5 6
  1 2 3
  ```

- Inline layout keeps all stopwatches in one horizontal row, left to right in shortcut order. Cards and their contents shrink as needed to fit the available screen width instead of wrapping.
- Stopwatches after the first nine follow those positions in their existing displayed order in either layout.
- Changing layouts changes card placement only. It does not reorder stopwatch state, change shortcut assignments, or affect a stopwatch's running state, elapsed time, rate, or interval history.
- Keep both layouts responsive and readable at desktop and narrow screen sizes. The Numpad arrangement must retain its keypad ordering when it reflows.
- Save the selected layout in a separate local-storage preference key, independent of the version 3 stopwatch data. Default to Numpad when the preference is missing, invalid, or storage is unavailable; layout preferences do not require a stopwatch data version migration.

## State and timing rules

- Keep one client-side source of truth and enforce that no more than one stopwatch is running.
- Represent accumulated time in milliseconds. For a running stopwatch, derive current elapsed time from its saved accumulated amount plus the time since `startedAtMs` multiplied by its active rate (`1` or `2`). Checkpoint elapsed time and reset the timestamp whenever the rate changes.
- Use timestamps rather than interval callback counts so delayed browser updates do not create timing drift. Intervals refresh the hundredths display every 10 milliseconds; they do not define elapsed time.
- Persist labels, accumulated elapsed time, status, start timestamp for the current rate segment, rate multiplier, completed double-time intervals, any open interval start reading, and the active stopwatch identifier in `localStorage`.
- Store the persisted format as version 3. Migrate valid version 2 stopwatch data to version 3 at `1×` with no interval history, preserving the existing labels, elapsed values, running state, timestamp, and active stopwatch.
- Version the persisted format. Reject and safely discard old countdown data rather than interpreting configured durations or remaining time as stopwatch elapsed time.
- Treat missing, malformed, unsupported, or structurally inconsistent saved data as an empty stopwatch list. Keep the in-memory app usable if browser storage is unavailable.

## User interface and accessibility

- Use semantic HTML and standard CSS. Keep the layout responsive for desktop and narrow screens.
- Provide visible keyboard focus, accessible action labels, and clear visual distinction for Ready, Running, and Paused states.
- Give the X delete button an accessible name that identifies which stopwatch it deletes.
- Make the current rate and double-time intervals visible and readable on each stopwatch card; advertise Space as a shortcut and keep a usable visible focus state.
- Keep the add form usable by keyboard and mouse. A stopwatch needs a label only; do not show a duration or minutes field.
- Do not use a completed state, countdown display, duration input, or restart action in the stopwatch interface.

## Technology stack

- **Language:** TypeScript for stopwatch state, keyboard handling, and persistence.
- **UI:** Semantic HTML and standard CSS; no UI framework is needed.
- **Development and build:** Vite with npm scripts for local development and static production output.
- **Persistence:** Browser `localStorage`; no backend or database. Persist double-time rate and interval history with the stopwatch state.
- **Runtime:** A current desktop browser. Use `KeyboardEvent.key` to recognize digit presses from either the number row or numpad.
- **Dependencies:** No runtime libraries; npm manages the development and build tooling.
