/** Small text/date helpers shared by profile and matching code. */

/** Common spellings that should count as the same skill. */
const SKILL_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  'ms excel': 'excel',
  'microsoft excel': 'excel',
  'google sheet': 'google sheets',
  powerbi: 'power bi',
  'postgres': 'sql',
  'postgresql': 'sql',
  'mysql': 'sql',
  'py': 'python',
  'customer support': 'customer service',
};

/** Lowercase, trim, and collapse whitespace. */
export function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Normalize a skill and resolve common aliases. */
export function normalizeSkill(value) {
  const n = normalize(value);
  return SKILL_ALIASES[n] ?? n;
}

/** Split "a, b; c" into a clean, de-duplicated list (original casing kept). */
export function splitList(value) {
  if (Array.isArray(value)) return dedupeStrings(value);
  return dedupeStrings(String(value ?? '').split(/[,;\n]/));
}

function dedupeStrings(items) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const item = String(raw ?? '').trim();
    const key = normalize(item);
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

/** Compare "Chicago, IL" vs "chicago" by city name. */
export function sameCity(a, b) {
  const city = (s) => normalize(s).split(',')[0].trim();
  return city(a) !== '' && city(a) === city(b);
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD" or Date). Negative if `to` is earlier. */
export function daysBetween(from, to) {
  const toUtc = (d) => {
    const date = d instanceof Date ? d : new Date(`${d}T00:00:00Z`);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** Today's date as "YYYY-MM-DD" (UTC). */
export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Escape text before inserting into HTML. Use for ALL user/data strings in the UI. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
