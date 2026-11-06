// Text helpers for keyword matching. Matching is whole-word and case-insensitive,
// so "java" never matches "javascript".

import aliasData from "@/data/resume-interview/skill-aliases.json";

const ALIASES: Record<string, string[]> = aliasData.aliases;

export function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termRegExp(term: string, flags = "i"): RegExp {
  return new RegExp(`(?<![a-z0-9])${escapeRegExp(normalize(term))}(?![a-z0-9])`, flags);
}

/**
 * The spellings that count as the same skill. A keyword expands to its alias
 * group only when it IS the group's name ("sql", or "customer service" for
 * "customer-service"); otherwise it matches literally. This keeps loose groups
 * like "dashboards" from making "power bi" match any dashboard.
 */
export function termVariants(term: string): string[] {
  const n = normalize(term);
  const group = ALIASES[n] ?? ALIASES[n.replace(/\s+/g, "-")] ?? [];
  return [...new Set([n, ...group.map(normalize)])];
}

/** True if `text` contains `term` or one of its variants as a whole word or phrase. */
export function containsTerm(text: string, term: string): boolean {
  return termVariants(term).some((v) => termRegExp(v).test(text));
}

/** The exact substring of `text` that matched `term` (original casing), if any. */
export function findTermMatch(text: string, term: string): string | undefined {
  for (const v of termVariants(term)) {
    const m = termRegExp(v).exec(text);
    if (m) return m[0];
  }
  return undefined;
}

/** Split text into sentences ("A. B." -> ["A.", "B."]). */
export function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]?/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

/** All number tokens in a text, e.g. "team of 4, 25%" -> ["4", "25"]. */
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

/** Bracketed placeholders like "[X students]". */
export function placeholdersIn(text: string): string[] {
  return text.match(/\[[^\]\n]*\]/g) ?? [];
}

export function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length;
}

export function lowerFirst(text: string): string {
  return text ? text[0].toLowerCase() + text.slice(1) : text;
}

export function stripEndPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/, "");
}

export function slug(text: string): string {
  return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** "2028-05-15" -> "May 2028" */
export function monthYear(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

let counter = 0;
export function makeId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  counter += 1;
  return `${prefix}-${uuid ?? `${Date.now()}-${counter}`}`;
}
