// Small helpers shared by the tracker modules. Dates are plain `YYYY-MM-DD`
// strings and all math is done in UTC so results don't shift by time zone.

import type { DateString, Timestamp } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function assertValidDate(value: string | undefined, field: string): void {
  if (value !== undefined && !isValidDate(value)) {
    throw new Error(`${field} must be a real date in YYYY-MM-DD format, got "${value}"`);
  }
}

/** Today's date as `YYYY-MM-DD` (UTC). */
export function todayString(now: Date = new Date()): DateString {
  return now.toISOString().slice(0, 10);
}

/** Today's date as `YYYY-MM-DD` in the user's own time zone. Use this in the UI. */
export function localTodayString(now: Date = new Date()): DateString {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2027-01-15" → "Jan 15, 2027" (no time-zone shift). */
export function formatDate(date: DateString | undefined): string {
  if (!date) return "Not set";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function addDays(date: DateString, days: number): DateString {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DateString, to: DateString): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function nowTimestamp(now: Date = new Date()): Timestamp {
  return now.toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}
