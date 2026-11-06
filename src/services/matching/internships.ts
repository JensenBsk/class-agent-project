/**
 * Internship discovery: load, de-duplicate, search, filter (Member 2).
 *
 * Any source works if it has `listInternships()` returning Internship[].
 * Today that's the fictional mock dataset; a real job-board API can be
 * swapped in later without changing the pages.
 */
import { buildMockInternships } from "@/data/internships.mock";
import type { Internship, WorkMode } from "@/types";
import { daysBetween, normalize, sameCity } from "./text";

export interface InternshipSource {
  name: string;
  isMock: boolean;
  listInternships(): Promise<Internship[]>;
}

export function mockInternshipSource(today: Date = new Date()): InternshipSource {
  return {
    name: "Mock internship dataset",
    isMock: true,
    listInternships: async () => buildMockInternships(today),
  };
}

/** Same company + title + location = same opening. */
export function duplicateKey(i: Pick<Internship, "company" | "title" | "location">): string {
  return [i.company, i.title, i.location].map(normalize).join("|");
}

export interface DedupeResult {
  internships: Internship[];
  removed: { kept: string; removed: string }[];
}

/** Remove duplicate listings, keeping the most recently checked copy. */
export function dedupeInternships(list: Internship[]): DedupeResult {
  const byKey = new Map<string, Internship>();
  const removed: DedupeResult["removed"] = [];
  for (const item of list) {
    const key = duplicateKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
    } else if (item.lastCheckedAt > existing.lastCheckedAt) {
      removed.push({ kept: item.id, removed: existing.id });
      byKey.set(key, item);
    } else {
      removed.push({ kept: existing.id, removed: item.id });
    }
  }
  return { internships: [...byKey.values()], removed };
}

/** True if the deadline has passed. Listings without a deadline never expire. */
export function isExpired(i: Internship, today: Date = new Date()): boolean {
  return Boolean(i.applicationDeadline) && daysBetween(today, i.applicationDeadline as string) < 0;
}

export function isPaid(i: Internship): boolean {
  return (i.compensation?.hourlyMax ?? 0) > 0;
}

export interface InternshipFilters {
  query?: string;
  industry?: string;
  workMode?: WorkMode | "";
  /** City; remote roles always pass. */
  location?: string;
  paidOnly?: boolean;
  includeExpired?: boolean;
}

export function filterInternships(list: Internship[], filters: InternshipFilters = {}, today: Date = new Date()): Internship[] {
  const words = normalize(filters.query).split(" ").filter(Boolean);
  return list.filter((i) => {
    if (!filters.includeExpired && isExpired(i, today)) return false;
    if (filters.industry && normalize(i.industry) !== normalize(filters.industry)) return false;
    if (filters.workMode && i.workMode !== filters.workMode) return false;
    if (filters.location && !(i.workMode === "remote" || sameCity(i.location, filters.location))) return false;
    if (filters.paidOnly && !isPaid(i)) return false;
    if (words.length) {
      const haystack = normalize([i.company, i.title, i.industry, i.description, ...(i.careerTags ?? [])].join(" "));
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });
}

export function createInternshipService(source: InternshipSource = mockInternshipSource()) {
  let cache: Promise<DedupeResult> | null = null;

  const loadAll = () => {
    cache ??= source.listInternships().then((raw) => {
      if (!Array.isArray(raw)) throw new Error(`Internship source "${source.name}" returned invalid data.`);
      return dedupeInternships(raw);
    });
    // Don't cache failures, so "Try again" can work.
    cache.catch(() => {
      cache = null;
    });
    return cache;
  };

  return {
    sourceName: source.name,
    isMock: source.isMock,
    async search(filters: InternshipFilters = {}, today: Date = new Date()) {
      const { internships, removed } = await loadAll();
      return { internships: filterInternships(internships, filters, today), duplicatesRemoved: removed.length };
    },
    async getById(id: string): Promise<Internship | null> {
      const { internships } = await loadAll();
      return internships.find((i) => i.id === id) ?? null;
    },
    async listIndustries(): Promise<string[]> {
      const { internships } = await loadAll();
      return [...new Set(internships.map((i) => i.industry))].sort();
    },
  };
}

export type InternshipService = ReturnType<typeof createInternshipService>;
