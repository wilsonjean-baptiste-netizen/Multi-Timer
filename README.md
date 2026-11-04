# Multi-Stopwatch

A local desktop-browser app for displaying multiple named stopwatches while allowing only one to run at a time.

> **Implementation status:** Stopwatch state, version 3 persistence, double-time controls, interval display, selectable Numpad/Inline layouts, and the derived total elapsed time are implemented. Production builds and headless desktop/narrow viewport checks passed; hands-on keyboard and mouse acceptance remains.

## Requirements

- Node.js and npm
- A current desktop browser

## Install and run locally

From this project folder, install the development dependencies and start Vite:

```sh
npm install
npm run dev
```

Open the local address printed by Vite (usually `http://localhost:5173/`). Keep the terminal running while you use the app. Press `Ctrl+C` in that terminal to stop the server.

To check the TypeScript and create a production build, run:

```sh
npm run build
```

To serve the production build locally for review:

```sh
npm run preview
```

## Stopwatch controls

1. Enter a label and select **Add stopwatch**. A new stopwatch begins at zero.
2. Select **Start** to count upward. Select **Pause** to stop it temporarily; **Resume** continues from the accumulated elapsed time.
3. Start another stopwatch to pause the current one and switch to the other stopwatch.
4. Select **Reset** to stop a stopwatch and return it to zero while keeping its label in the list.
5. Select the **×** button to delete that stopwatch. Use **Reset all** to zero every stopwatch while preserving the list, or **Clear all** to delete the full list.

The first nine stopwatches can also be controlled with number keys **1–9** from either the main number row or a numpad. Press another stopwatch's number to switch to it; press the active stopwatch's number again to pause it, then again to resume. Shortcuts are ignored while an editable field has focus, so you can type digits in a name. Click or tab out of the field to re-enable shortcuts. Additional stopwatches remain available by mouse.

Use the **Numpad** and **Inline** selector above the stopwatch cards to change their layout. Numpad places stopwatches 7–9 on the top row, 4–6 in the middle, and 1–3 on the bottom, matching a physical keypad. Inline keeps all stopwatches in one left-to-right row in number order; cards and their contents shrink as needed to fit the screen. Stopwatches after number 9 follow the first nine in either layout. Changing the layout does not change stopwatch state or keyboard assignments. Your layout choice is saved separately in this browser and defaults to Numpad when no valid choice is saved.

While a stopwatch is running, press **Space** to switch it between normal speed (1x) and double speed (2x). Space does not start or pause the stopwatch. Its card shows the current rate and lists each double-time interval using stopwatch readings, including an ongoing interval while 2x is active. The double-time shortcut is ignored while typing, when a control has focus, for repeated key events, and when a modifier key is held; focused controls keep their normal Space behavior.

Stopwatch and total elapsed times display hundredths of a second (`MM:SS.hh`, or `H:MM:SS.hh` after an hour). They use timestamp-based elapsed time and refresh the display every 10 milliseconds. The **Total elapsed time** summary adds the elapsed time of every stopwatch, including paused and running stopwatches. It advances while one stopwatch is running, returns to zero when all entries are cleared, and updates when a stopwatch is reset or deleted. It is calculated from stopwatch state and is not stored separately.

Use **Reset all** to stop and zero every stopwatch while keeping their labels and entries. **Clear all** deletes every stopwatch.

## Saved data behavior

Stopwatch labels, elapsed state, current rate, and double-time intervals are stored in version 3 of this browser's local storage for the app origin. Valid version 2 stopwatch data migrates automatically; older version 2 records start at 1x with no interval history. A paused stopwatch stays paused across reloads. A running stopwatch continues to count against elapsed wall-clock time after a reload or while the app is closed, preserving an active double-time interval. Data is kept in the current browser profile and is not synced to another browser or computer.

Older countdown data may be present under the `multi-timer-state` key. The stopwatch store rejects that old format rather than reusing duration or remaining-time values.
