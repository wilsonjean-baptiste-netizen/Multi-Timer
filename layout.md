# Stopwatch Layout Selector Plan

## Goal

Add a clickable, accessible layout selector that switches the stopwatch cards between a physical numpad-style 3x3 arrangement and an inline arrangement in number-row order. Changing the layout affects only presentation; stopwatch state and keyboard shortcuts continue to work as they do now.

## Product rules

- Provide two selectable layouts: **Numpad** and **Inline**.
- In Numpad layout, the first nine stopwatches occupy positions matching a physical numeric keypad:

  ```text
  7 8 9
  4 5 6
  1 2 3
  ```

- In Inline layout, arrange every stopwatch in one unwrapped horizontal row, left to right in shortcut order. Shrink cards and their contents as needed to keep the full row within the available screen width.
- Stopwatches beyond number 9 appear after the first nine, in their existing order, in either layout.
- Layout selection changes only card placement. It does not reorder stopwatch state, change shortcut assignments, start or pause a stopwatch, or alter elapsed time and interval history.
- Persist the selected layout across reloads using a separate local-storage preference key. Do not change the stopwatch persistence schema or version for this UI preference.
- Keep both layouts readable and usable at desktop and narrow viewport sizes, with visible keyboard focus and a clear selected state on the layout control.

## Implementation phases

### Phase 1 - Specify layout behavior and selector semantics [complete]

- Add the layout rules and responsive behavior to `archive/spec.md`.
- Confirm the card ordering rules: shortcut numbers determine the first nine positions; later stopwatches follow in creation/display order.
- Define the control as a two-option segmented selector styled like tabs. Use accessible pressed/selected semantics and keyboard focus behavior rather than changing stopwatch controls.
- Store the preference separately from stopwatch state, defaulting to Numpad when no valid preference is saved.
- Added these product rules to `archive/spec.md`.

### Phase 2 - Implement the selector, layouts, and preference [complete]

- Add a layout preference type and small persistence helper in the UI layer, independent of `StopwatchStateStore`.
- Add the **Numpad** and **Inline** selector above the stopwatch list, with accessible names, selected state, and visible focus styling.
- Apply a layout marker to the timer list and use CSS to arrange the first nine cards by their existing shortcut number.
- In Numpad layout, place shortcut 7 at top-left through shortcut 9 at top-right; place 1–3 along the bottom row. Keep additional stopwatches after the keypad positions.
- In Inline layout, use one horizontal row in left-to-right shortcut order at every viewport width. Let cards and their contents shrink to fit instead of wrapping to another row.
- Ensure changing the selector updates only the layout, preserves current card state, and saves the preference. Handle invalid or unavailable local storage by using the default in memory.
- Implemented in `index.html`, `src/main.ts`, and `src/style.css`. The selected layout uses the separate `multi-timer-layout` key and defaults to Numpad.

### Phase 3 - Verify, document, and hand off [complete]

- Build the app and verify the selector with zero, one, nine, and more than nine stopwatches.
- Confirm Numpad card positions match the shortcut keycaps and Inline order matches `1` through `9` from left to right.
- Confirm layout changes do not alter stopwatch order, rate, elapsed time, intervals, or number-key behavior.
- Reload in both layouts and confirm the chosen preference is restored. Confirm a missing or invalid preference defaults to Numpad.
- Review the selector and cards at desktop and narrow widths for visible focus, usable controls, a single Inline row, and no horizontal overflow.
- Update `README.md` and `project-notes.md` with the layout options and preference behavior. Record a concise manual acceptance checklist.
- The selector and Numpad behavior were verified with `npm run build` and desktop/390px Chrome checks for layout positions, counts 0/1/9/10, preference restoration/fallback, state preservation, shortcuts, and overflow. A follow-up changed Inline from wrapping rows to a single shrinking row; its production build passed.

## Acceptance criteria

- The user can switch layouts with the visible selector.
- Numpad layout matches the physical keypad arrangement for stopwatches 1–9.
- Inline layout keeps every stopwatch in one row in shortcut order; cards shrink to fit rather than wrapping.
- Additional stopwatches remain visible after the first nine and retain their existing shortcut/mouse behavior.
- Switching layouts preserves stopwatch state and keyboard shortcut assignments.
- The selected layout persists across reloads without changing stopwatch data versioning.
- Both layouts remain usable with keyboard navigation and at narrow viewport sizes.
