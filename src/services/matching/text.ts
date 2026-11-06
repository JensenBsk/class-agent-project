/**
 * Text and date helpers for profile + matching (Member 2).
 *
 * Skill spellings come from Member 3's shared alias list so résumé keyword
 * analysis and internship matching agree on what "matched" means.
 */
import aliasFile from "@/data/resume-interview/skill-aliases.json";
import type { ISODate } from "@/types";

/** Lowercase, trim, collapse whitespace. */
export function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const SKILL_INDEX: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  const aliases = (aliasFile as { aliases: Record<string, string[]> }).aliases;
  for (const [canonical, variants] of Object.entries(aliases)) {
    map.set(normalize(canonical), canonical);
    for (const v of variants) map.set(normalize(v), canonical);
  }
  return map;
})();

/** All known spellings of a canonical skill, including itself. */
export function skillVariants(canonical: string): string[] {
  const aliases = (aliasFile as { aliases: Record<string, string[]> }).aliases;
  return [canonical, ...(aliases[canonical] ?? [])].map(normalize);
}

/** Map a skill spelling to its shared canonical name ("MS Excel" -> "excel"). */
export function canonicalSkill(value: unknown): string {
  const n = normalize(value);
  return SKILL_INDEX.get(n) ?? n;
}

/** Common major abbreviations. Expanded before comparing majors. */
const MAJOR_ALIASES: Record<string, string> = {
  cs: "computer science",
  "comp sci": "computer science",
  cis: "computer information systems",
  mis: "management information systems",
  is: "information systems",
  it: "information technology",
  ds: "data science",
  ee: "electrical engineering",
  ce: "computer engineering",
};

export function canonicalMajor(value: unknown): string {
  const n = normalize(value).replace(/^(b\.?s\.?|b\.?a\.?|bachelor'?s?)( of| in)? /, "");
  return MAJOR_ALIASES[n] ?? n;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True if `phrase` appears in `text` as whole words.
 * "information systems" is in "computer information systems";
 * "cs" is NOT in "statistics"; "java" is NOT in "javascript".
 */
export function containsPhrase(text: unknown, phrase: unknown): boolean {
  const t = normalize(text);
  const p = normalize(phrase);
  if (!t || !p) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}($|[^a-z0-9])`).test(t);
}

/** Two majors match if either fully contains the other as whole words. */
export function majorsMatch(a: unknown, b: unknown): boolean {
  const x = canonicalMajor(a);
  const y = canonicalMajor(b);
  return Boolean(x && y) && (x === y || containsPhrase(x, y) || containsPhrase(y, x));
}

/** Compare "San Diego, CA" vs "san diego" by city. "Remote (US)" never matches a city. */
export function sameCity(a: unknown, b: unknown): boolean {
  const city = (s: unknown) => normalize(s).split(",")[0].trim();
  return city(a) !== "" && city(a) === city(b);
}

/** Split "a, b; c" or an array into a clean, de-duplicated list (original casing kept). */
export function splitList(value: unknown): string[] {
  const parts = Array.isArray(value) ? value : String(value ?? "").split(/[,;\n]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const item = String(raw ?? "").trim();
    const key = normalize(item);
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

const toUtcDay = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(`${d.slice(0, 10)}T00:00:00Z`);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

/** Whole days from `from` to `to`. Negative if `to` is earlier. */
export function daysBetween(from: Date | string, to: Date | string): number {
  return Math.round((toUtcDay(to) - toUtcDay(from)) / 86_400_000);
}

/** "YYYY-MM-DD" for a date (UTC). */
export function isoDate(d: Date = new Date()): ISODate {
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" `days` after `from`. */
export function addDays(from: Date, days: number): ISODate {
  return isoDate(new Date(toUtcDay(from) + days * 86_400_000));
}
