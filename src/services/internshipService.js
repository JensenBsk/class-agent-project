/**
 * Internship discovery: load, de-duplicate, search, and filter (Member 2).
 *
 * Any data source works as long as it has `async listInternships()` that
 * returns Internship objects (see src/models/schemas.js). Today that is the
 * mock source; a real job-board API can be swapped in later without changing
 * callers.
 */
import { mockInternshipSource } from '../data/internships.mock.js';
import { daysBetween, normalize, sameCity, todayIso } from '../utils/text.js';

/** Key used to detect the same listing posted more than once. */
export function duplicateKey(internship) {
  return [internship.company, internship.title, internship.location].map(normalize).join('|');
}

/**
 * Remove duplicate listings, keeping the most recently checked copy.
 * @returns {{internships: object[], removed: {kept: string, removed: string}[]}}
 */
export function dedupeInternships(internships) {
  const byKey = new Map();
  const removed = [];
  for (const item of internships) {
    const key = duplicateKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
    } else if (item.lastChecked > existing.lastChecked) {
      removed.push({ kept: item.id, removed: existing.id });
      byKey.set(key, item);
    } else {
      removed.push({ kept: existing.id, removed: item.id });
    }
  }
  return { internships: [...byKey.values()], removed };
}

/** True if the listing's deadline has passed. */
export function isExpired(internship, today = todayIso()) {
  return daysBetween(today, internship.deadline) < 0;
}

/**
 * Filter internships. Every filter is optional.
 * @param {object[]} internships
 * @param {{query?: string, industry?: string, workMode?: string, location?: string, paidOnly?: boolean, includeExpired?: boolean, today?: string}} filters
 */
export function filterInternships(internships, filters = {}) {
  const today = filters.today ?? todayIso();
  const query = normalize(filters.query);
  return internships.filter((i) => {
    if (!filters.includeExpired && isExpired(i, today)) return false;
    if (filters.industry && normalize(i.industry) !== normalize(filters.industry)) return false;
    if (filters.workMode && i.workMode !== filters.workMode) return false;
    if (filters.location && !(i.workMode === 'remote' || sameCity(i.location, filters.location))) return false;
    if (filters.paidOnly && !(i.compensation && (i.compensation.hourlyMax ?? 0) > 0)) return false;
    if (query) {
      const haystack = normalize([i.company, i.title, i.industry, i.description, ...(i.careerTags ?? [])].join(' '));
      if (!query.split(' ').every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
}

/** Create the internship service around a data source (mock by default). */
export function createInternshipService(source = mockInternshipSource) {
  let cache = null;

  async function loadAll() {
    if (!cache) {
      const raw = await source.listInternships();
      if (!Array.isArray(raw)) throw new Error(`Internship source "${source.name}" returned invalid data.`);
      cache = dedupeInternships(raw);
    }
    return cache;
  }

  return {
    sourceName: source.name,
    isMock: Boolean(source.isMock),
    /** Search with filters. Returns {internships, duplicatesRemoved}. */
    async search(filters = {}) {
      const { internships, removed } = await loadAll();
      return { internships: filterInternships(internships, filters), duplicatesRemoved: removed.length };
    },
    async getById(id) {
      const { internships } = await loadAll();
      return internships.find((i) => i.id === id) ?? null;
    },
    async listIndustries() {
      const { internships } = await loadAll();
      return [...new Set(internships.map((i) => i.industry))].sort();
    },
    /** Drop cached data so the next call reloads from the source. */
    refresh() {
      cache = null;
    },
  };
}
