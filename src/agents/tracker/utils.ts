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
