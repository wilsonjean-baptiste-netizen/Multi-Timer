import "./style.css";
import { stopwatchState, type Stopwatch } from "./state";

const stopwatchCount = document.querySelector<HTMLElement>("#timer-count");
const totalTime = document.querySelector<HTMLElement>("#total-time");
const stopwatchList = document.querySelector<HTMLElement>("#timer-list");
const emptyState = document.querySelector<HTMLElement>("#empty-state");
const clearAllButton = document.querySelector<HTMLButtonElement>("#clear-all");
const resetAllButton = document.querySelector<HTMLButtonElement>("#reset-all");
const stopwatchForm = document.querySelector<HTMLFormElement>("#timer-form");
const labelInput = stopwatchForm?.querySelector<HTMLInputElement>("[name='label']");
const formError = document.querySelector<HTMLElement>("#form-error");
const layoutButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-layout-choice]"));

type TimerLayout = "numpad" | "inline";
const TIMER_LAYOUT_STORAGE_KEY = "multi-timer-layout";

function loadTimerLayout(): TimerLayout {
  try {
    return window.localStorage.getItem(TIMER_LAYOUT_STORAGE_KEY) === "inline" ? "inline" : "numpad";
  } catch {
    return "numpad";
  }
}

function saveTimerLayout(layout: TimerLayout): void {
  try {
    window.localStorage.setItem(TIMER_LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Keep the selected layout usable for this session when storage is unavailable.
  }
}

let timerLayout = loadTimerLayout();

function formatElapsed(elapsedMs: number): string {
  const totalHundredths = Math.floor(Math.max(0, elapsedMs) / 10);
  const totalSeconds = Math.floor(totalHundredths / 100);
  const hundredths = totalHundredths % 100;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function createStopwatchCard(): HTMLElement {
  const card = document.createElement("article");
  card.className = "timer-card stopwatch-card";
  card.innerHTML = `
    <div class="timer-card-heading">
      <div class="timer-card-title">
        <h3 data-label></h3>
        <span class="timer-status" data-status-label></span>
      </div>
      <kbd class="timer-key" data-key></kbd>
    </div>
    <p class="timer-time stopwatch-time" data-time role="timer"></p>
    <div class="timer-details">
      <span class="timer-rate" data-rate hidden></span>
      <div class="double-time-history" data-intervals hidden>
        <span class="double-time-label">Double-time intervals</span>
        <ul data-interval-list></ul>
      </div>
    </div>
    <div class="timer-card-actions">
      <button class="timer-action primary-action" type="button" data-action="start"></button>
      <button class="timer-action reset-action" type="button" data-action="reset">Reset</button>
      <button class="timer-action clear-action" type="button" data-action="clear"></button>
    </div>`;
  return card;
}

function sameStopwatchOrder(cards: HTMLElement[], stopwatches: Stopwatch[]): boolean {
  return cards.length === stopwatches.length && cards.every((card, index) => card.dataset.stopwatchId === stopwatches[index].id);
}

function updateCard(card: HTMLElement, stopwatch: Stopwatch, index: number, activeStopwatchId: string | null): void {
  card.dataset.shortcutNumber = index < 9 ? String(index + 1) : "extra";
  const isActive = stopwatch.id === activeStopwatchId;
  card.dataset.status = stopwatch.status;
  card.classList.toggle("is-active", isActive);
  card.querySelector<HTMLElement>("[data-label]")!.textContent = stopwatch.label;

  const status = card.querySelector<HTMLElement>("[data-status-label]")!;
  status.textContent = isActive ? "Running" : stopwatch.status[0].toUpperCase() + stopwatch.status.slice(1);

  const time = card.querySelector<HTMLElement>("[data-time]")!;
  const elapsed = formatElapsed(stopwatch.elapsedMs);
  time.textContent = elapsed;
  time.setAttribute("aria-label", `${stopwatch.label}: ${status.textContent}, elapsed time ${elapsed}`);

  const rate = card.querySelector<HTMLElement>("[data-rate]")!;
  rate.hidden = stopwatch.status !== "running";
  rate.textContent = `${stopwatch.rateMultiplier}×`;
  rate.setAttribute("aria-label", `Running at ${stopwatch.rateMultiplier} times normal speed`);

  const intervalPanel = card.querySelector<HTMLElement>("[data-intervals]")!;
  const intervalList = card.querySelector<HTMLUListElement>("[data-interval-list]")!;
  const intervals = stopwatch.doubleTimeIntervals.map((interval) =>
    `${formatElapsed(interval.startElapsedMs)}–${formatElapsed(interval.endElapsedMs)}`,
  );
  if (stopwatch.rateMultiplier === 2 && stopwatch.activeDoubleTimeStartMs !== null) {
    intervals.push(`${formatElapsed(stopwatch.activeDoubleTimeStartMs)}–${formatElapsed(stopwatch.elapsedMs)} (ongoing)`);
  }
  intervalPanel.hidden = intervals.length === 0;
  intervalList.replaceChildren(...intervals.map((interval) => {
    const item = document.createElement("li");
    item.textContent = interval;
    return item;
  }));

  const key = card.querySelector<HTMLElement>("[data-key]")!;
  key.textContent = index < 9 ? String(index + 1) : "MOUSE";
  key.setAttribute("aria-label", index < 9 ? `Press ${index + 1} to start, pause, or resume` : "Use the mouse to start this stopwatch");
  key.title = index < 9 ? `Press ${index + 1} to start, pause, or resume` : "Use the mouse to start this stopwatch";

  const startButton = card.querySelector<HTMLButtonElement>(".primary-action")!;
  startButton.textContent = isActive ? "Pause" : stopwatch.status === "paused" ? "Resume" : "Start";
  startButton.dataset.action = isActive ? "pause" : "start";
  startButton.setAttribute("aria-label", `${startButton.textContent} ${stopwatch.label}`);

  const resetButton = card.querySelector<HTMLButtonElement>(".reset-action")!;
  resetButton.setAttribute("aria-label", `Reset ${stopwatch.label} stopwatch`);

  const clearButton = card.querySelector<HTMLButtonElement>(".clear-action")!;
  clearButton.textContent = "×";
  clearButton.setAttribute("aria-label", `Delete ${stopwatch.label} stopwatch`);
  clearButton.title = `Delete ${stopwatch.label} stopwatch`;
}

function render(): void {
  if (!stopwatchList || !emptyState) return;
  if (stopwatchList.dataset.layout !== timerLayout) stopwatchList.dataset.layout = timerLayout;
  for (const button of layoutButtons) {
    const isSelected = button.dataset.layoutChoice === timerLayout;
    if (button.getAttribute("aria-pressed") !== String(isSelected)) {
      button.setAttribute("aria-pressed", String(isSelected));
    }
  }
  const state = stopwatchState.getState();
  const { stopwatches, activeStopwatchId } = state;
  const cards = Array.from(stopwatchList.querySelectorAll<HTMLElement>(".stopwatch-card"));

  if (!sameStopwatchOrder(cards, stopwatches)) {
    const fragment = document.createDocumentFragment();
    for (const stopwatch of stopwatches) {
      const card = createStopwatchCard();
      card.dataset.stopwatchId = stopwatch.id;
      fragment.append(card);
    }
    stopwatchList.replaceChildren(fragment);
  }

  const currentCards = Array.from(stopwatchList.querySelectorAll<HTMLElement>(".stopwatch-card"));
  stopwatches.forEach((stopwatch, index) => updateCard(currentCards[index], stopwatch, index, activeStopwatchId));

  const hasStopwatches = stopwatches.length > 0;
  stopwatchList.hidden = !hasStopwatches;
  emptyState.hidden = hasStopwatches;
  if (stopwatchCount) stopwatchCount.textContent = String(stopwatches.length);
  if (totalTime) totalTime.textContent = formatElapsed(stopwatchState.getTotalElapsedMs(state));
  if (clearAllButton) clearAllButton.disabled = !hasStopwatches;
  if (resetAllButton) resetAllButton.disabled = !hasStopwatches || stopwatches.every(
    (stopwatch) => stopwatch.status === "ready" && stopwatch.elapsedMs === 0,
  );
}

stopwatchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!labelInput) return;

  const label = labelInput.value.trim();
  if (!label) {
    if (formError) {
      formError.textContent = "Enter a name for this stopwatch.";
      formError.hidden = false;
    }
    labelInput.focus();
    return;
  }

  try {
    stopwatchState.addStopwatch(label);
    stopwatchForm.reset();
    if (formError) formError.hidden = true;
    labelInput.focus();
  } catch {
    if (formError) {
      formError.textContent = "This stopwatch could not be added. Please try again.";
      formError.hidden = false;
    }
  }
});

stopwatchForm?.addEventListener("input", () => {
  if (formError) formError.hidden = true;
});

stopwatchList?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  const card = target.closest<HTMLElement>(".stopwatch-card");
  const stopwatchId = card?.dataset.stopwatchId;
  if (!button || !stopwatchId) return;

  if (button.dataset.action === "pause") stopwatchState.pauseStopwatch(stopwatchId);
  else if (button.dataset.action === "reset") stopwatchState.resetStopwatch(stopwatchId);
  else if (button.dataset.action === "clear") stopwatchState.clearStopwatch(stopwatchId);
  else stopwatchState.startStopwatch(stopwatchId);
});

clearAllButton?.addEventListener("click", () => stopwatchState.clearAll());
resetAllButton?.addEventListener("click", () => stopwatchState.resetAll());

document.querySelector(".layout-picker")?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>("button[data-layout-choice]");
  const selectedLayout = button?.dataset.layoutChoice;
  if (selectedLayout !== "numpad" && selectedLayout !== "inline") return;
  if (selectedLayout === timerLayout) return;

  timerLayout = selectedLayout;
  saveTimerLayout(timerLayout);
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof Element && (
      (target instanceof HTMLElement && target.isContentEditable) ||
      target.closest("input, textarea, select, button, a[href], [role='button'], summary, [contenteditable]:not([contenteditable='false'])")
    )) return;

    if (stopwatchState.toggleDoubleTime() !== null) event.preventDefault();
    return;
  }

  if (!/^[1-9]$/.test(event.key) || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"))) return;

  const index = Number(event.key) - 1;
  const stopwatch = stopwatchState.getState().stopwatches[index];
  if (!stopwatch) return;
  event.preventDefault();
  stopwatchState.toggleStopwatch(stopwatch.id);
});

stopwatchState.subscribe(render);
render();
window.setInterval(() => {
  stopwatchState.refresh();
}, 10);
