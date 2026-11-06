// Saves the tracker and activity log in the browser's localStorage.
// Data stays on this device only. Every read and write is wrapped so a
// private window or blocked storage just means "nothing saved", not a crash.

import { AgentActivityLog, type ActivitySnapshot } from "./approvals";
import { ApplicationTracker } from "./tracker";
import type { Application } from "./types";

export const TRACKER_STORAGE_KEY = "careerlaunch.tracker.v1";

export interface TrackerSnapshot {
  version: 1;
  applications: Application[];
  activity: ActivitySnapshot;
}

export interface LoadedTracker {
  tracker: ApplicationTracker;
  log: AgentActivityLog;
}

export class CorruptTrackerDataError extends Error {
  constructor() {
    super("Your saved tracker data couldn't be read.");
    this.name = "CorruptTrackerDataError";
  }
}

function getStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isSnapshot(value: unknown): value is TrackerSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<TrackerSnapshot>;
  return (
    v.version === 1 &&
    Array.isArray(v.applications) &&
    !!v.activity &&
    Array.isArray(v.activity.tasks) &&
    Array.isArray(v.activity.approvals) &&
    Array.isArray(v.activity.usedApprovalIds)
  );
}

/**
 * Load saved data, or empty objects if nothing is saved.
 * Throws CorruptTrackerDataError if something is saved but unreadable.
 */
export function loadTracker(storage: Storage | undefined = getStorage()): LoadedTracker {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(TRACKER_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (!raw) return { tracker: new ApplicationTracker(), log: new AgentActivityLog() };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CorruptTrackerDataError();
  }
  if (!isSnapshot(parsed)) throw new CorruptTrackerDataError();
  return {
    tracker: ApplicationTracker.fromJSON(parsed.applications),
    log: AgentActivityLog.fromJSON(parsed.activity),
  };
}

/** Returns false if the browser wouldn't let us save. */
export function saveTracker(
  { tracker, log }: LoadedTracker,
  storage: Storage | undefined = getStorage(),
): boolean {
  const snapshot: TrackerSnapshot = { version: 1, applications: tracker.toJSON(), activity: log.toJSON() };
  try {
    storage?.setItem(TRACKER_STORAGE_KEY, JSON.stringify(snapshot));
    return !!storage;
  } catch {
    return false;
  }
}

export function clearSavedTracker(storage: Storage | undefined = getStorage()): void {
  try {
    storage?.removeItem(TRACKER_STORAGE_KEY);
  } catch {
    // Nothing to do: storage is blocked, so nothing was saved.
  }
}
