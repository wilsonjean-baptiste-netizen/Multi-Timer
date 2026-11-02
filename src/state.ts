export type StopwatchStatus = "ready" | "running" | "paused";

export interface Stopwatch {
  id: string;
  label: string;
  /** Accumulated elapsed milliseconds before the current run, or total elapsed time when stopped. */
  elapsedMs: number;
  status: StopwatchStatus;
  /** Timestamp for the current run; null when stopped. */
  startedAtMs: number | null;
}

export interface StopwatchAppState {
  stopwatches: Stopwatch[];
  activeStopwatchId: string | null;
}

type StateListener = (state: Readonly<StopwatchAppState>) => void;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedState {
  version: 2;
  state: StopwatchAppState;
}

export const STOPWATCH_STORAGE_KEY = "multi-timer-state";

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Access to localStorage can throw in restricted browser contexts.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStopwatch(value: unknown): value is Stopwatch {
  if (!isRecord(value)) return false;
  const status = value.status;
  return (
    typeof value.id === "string" && value.id.length > 0 &&
    typeof value.label === "string" && value.label.trim().length > 0 &&
    Number.isSafeInteger(value.elapsedMs) && (value.elapsedMs as number) >= 0 &&
    (status === "ready" || status === "running" || status === "paused") &&
    (value.startedAtMs === null || (typeof value.startedAtMs === "number" && Number.isFinite(value.startedAtMs))) &&
    (status === "running" ? value.startedAtMs !== null : value.startedAtMs === null) &&
    (status !== "ready" || value.elapsedMs === 0)
  );
}

function parsePersistedState(raw: string | null): StopwatchAppState | null {
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 2 || !isRecord(parsed.state)) return null;
    const { stopwatches, activeStopwatchId } = parsed.state;
    if (!Array.isArray(stopwatches) || !stopwatches.every(isStopwatch)) return null;
    if (activeStopwatchId !== null && typeof activeStopwatchId !== "string") return null;

    const ids = new Set(stopwatches.map((stopwatch) => stopwatch.id));
    if (ids.size !== stopwatches.length) return null;
    const running = stopwatches.filter((stopwatch) => stopwatch.status === "running");
    if (running.length > 1) return null;
    if (running.length === 0 && activeStopwatchId !== null) return null;
    if (running.length === 1 && running[0].id !== activeStopwatchId) return null;

    return {
      stopwatches: stopwatches.map((stopwatch) => ({ ...stopwatch })),
      activeStopwatchId,
    };
  } catch {
    return null;
  }
}

/** Owns stopwatch lifecycle, timestamp-based elapsed time, and local persistence. */
export class StopwatchStateStore {
  private state: StopwatchAppState = { stopwatches: [], activeStopwatchId: null };
  private listeners = new Set<StateListener>();
  private storage: StorageLike | null;

  constructor(
    storage: StorageLike | null = browserStorage(),
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = () => globalThis.crypto.randomUUID(),
  ) {
    this.storage = storage;
    if (!storage) return;

    try {
      const saved = storage.getItem(STOPWATCH_STORAGE_KEY);
      const restored = parsePersistedState(saved);
      if (restored) {
        this.state = restored;
        return;
      }

      if (saved !== null) {
        // Version 1 contained countdown durations and remaining time; never reinterpret it.
        storage.removeItem(STOPWATCH_STORAGE_KEY);
      }
    } catch {
      this.storage = null;
    }
  }

  getState(): Readonly<StopwatchAppState> {
    const now = this.now();
    return {
      activeStopwatchId: this.state.activeStopwatchId,
      stopwatches: this.state.stopwatches.map((stopwatch) => ({
        ...stopwatch,
        elapsedMs: this.elapsedAt(stopwatch, now),
      })),
    };
  }

  /** Sum elapsed time from a timestamp-based snapshot, or take a fresh snapshot if omitted. */
  getTotalElapsedMs(state: Readonly<StopwatchAppState> = this.getState()): number {
    return state.stopwatches.reduce((total, stopwatch) => total + stopwatch.elapsedMs, 0);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addStopwatch(label: string): Stopwatch {
    const cleanLabel = label.trim();
    if (!cleanLabel) throw new Error("A stopwatch label is required.");

    const stopwatch: Stopwatch = {
      id: this.createId(),
      label: cleanLabel,
      elapsedMs: 0,
      status: "ready",
      startedAtMs: null,
    };
    this.state.stopwatches = [...this.state.stopwatches, stopwatch];
    this.commit();
    return { ...stopwatch };
  }

  /** Starts or resumes a stopwatch, pausing the currently running one first. */
  startStopwatch(id: string): void {
    const now = this.now();
    const target = this.findStopwatch(id);
    if (this.state.activeStopwatchId === id && target.status === "running") return;

    this.pauseActiveStopwatch(now);
    this.state.stopwatches = this.state.stopwatches.map((stopwatch) => stopwatch.id === id
      ? { ...stopwatch, status: "running", startedAtMs: now }
      : stopwatch);
    this.state.activeStopwatchId = id;
    this.commit();
  }

  /** Toggle the selected stopwatch, while selecting another one starts or resumes it. */
  toggleStopwatch(id: string): void {
    if (this.state.activeStopwatchId === id) {
      this.pauseStopwatch(id);
      return;
    }
    this.startStopwatch(id);
  }

  pauseStopwatch(id: string): void {
    if (this.state.activeStopwatchId !== id) return;
    this.pauseActiveStopwatch(this.now());
    this.commit();
  }

  clearStopwatch(id: string): void {
    if (!this.state.stopwatches.some((stopwatch) => stopwatch.id === id)) return;
    this.state.stopwatches = this.state.stopwatches.filter((stopwatch) => stopwatch.id !== id);
    if (this.state.activeStopwatchId === id) this.state.activeStopwatchId = null;
    this.commit();
  }

  resetStopwatch(id: string): void {
    const target = this.state.stopwatches.find((stopwatch) => stopwatch.id === id);
    if (!target || (target.status === "ready" && target.elapsedMs === 0)) return;
    this.state.stopwatches = this.state.stopwatches.map((stopwatch) => stopwatch.id === id
      ? { ...stopwatch, elapsedMs: 0, status: "ready", startedAtMs: null }
      : stopwatch);
    if (this.state.activeStopwatchId === id) this.state.activeStopwatchId = null;
    this.commit();
  }

  resetAll(): void {
    if (this.state.stopwatches.length === 0 || this.state.stopwatches.every(
      (stopwatch) => stopwatch.status === "ready" && stopwatch.elapsedMs === 0,
    )) return;

    this.state.stopwatches = this.state.stopwatches.map((stopwatch) => ({
      ...stopwatch,
      elapsedMs: 0,
      status: "ready",
      startedAtMs: null,
    }));
    this.state.activeStopwatchId = null;
    this.commit();
  }

  clearAll(): void {
    if (this.state.stopwatches.length === 0) return;
    this.state = { stopwatches: [], activeStopwatchId: null };
    this.commit();
  }

  /** Notify views to refresh their display; elapsed time remains derived from timestamps. */
  refresh(): void {
    this.notify();
  }

  private findStopwatch(id: string): Stopwatch {
    const stopwatch = this.state.stopwatches.find((candidate) => candidate.id === id);
    if (!stopwatch) throw new Error(`Stopwatch not found: ${id}`);
    return stopwatch;
  }

  private elapsedAt(stopwatch: Stopwatch, now: number): number {
    if (stopwatch.status !== "running" || stopwatch.startedAtMs === null) return stopwatch.elapsedMs;
    return stopwatch.elapsedMs + Math.max(0, now - stopwatch.startedAtMs);
  }

  private pauseActiveStopwatch(now: number): void {
    const activeId = this.state.activeStopwatchId;
    if (activeId === null) return;
    this.state.stopwatches = this.state.stopwatches.map((stopwatch) => stopwatch.id === activeId
      ? {
          ...stopwatch,
          elapsedMs: this.elapsedAt(stopwatch, now),
          status: "paused",
          startedAtMs: null,
        }
      : stopwatch);
    this.state.activeStopwatchId = null;
  }

  private commit(): void {
    this.persist();
    this.notify();
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      const payload: PersistedState = { version: 2, state: this.state };
      this.storage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Keep the in-memory app usable when storage is full or unavailable.
      this.storage = null;
    }
  }

  private notify(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const stopwatchState = new StopwatchStateStore();
