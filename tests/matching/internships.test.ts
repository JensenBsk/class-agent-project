import { describe, expect, it } from "vitest";
import rawMember3 from "@/data/resume-interview/mock-internships.json";
import { buildMockInternships } from "@/data/internships.mock";
import { createInternshipService, dedupeInternships, filterInternships, isExpired } from "@/services/matching/internships";
import { QUALIFICATION_TYPES, WORK_MODES, type Internship } from "@/types";

const TODAY = new Date("2026-11-06T12:00:00Z");
const DATA = buildMockInternships(TODAY);
const ids = (list: Internship[]) => list.map((i) => i.id);

describe("mock internship data", () => {
  it("has every field the brief requires, valid enums, and is labeled fictional", () => {
    for (const i of DATA) {
      expect(i).toMatchObject({ isMock: true, company: expect.stringContaining("(fictional)") });
      expect(i.source).toMatch(/mock/);
      expect(i.applicationUrl).toMatch(/^https:\/\/example\.com\//);
      expect(WORK_MODES).toContain(i.workMode);
      for (const q of [...i.requiredQualifications, ...i.preferredQualifications]) {
        expect(QUALIFICATION_TYPES).toContain(q.type);
        expect(q.keywords.length).toBeGreaterThan(0);
      }
      for (const f of ["title", "location", "industry", "description", "lastCheckedAt", "createdAt", "updatedAt"] as const) {
        expect(i[f]).toBeTruthy();
      }
    }
  });

  it("sets deadlines relative to today (Jensen's review item 4)", () => {
    const later = buildMockInternships(new Date("2027-06-01T00:00:00Z"));
    const live = (list: Internship[], d: Date) => list.filter((i) => !isExpired(i, d)).length;
    expect(live(later, new Date("2027-06-01T00:00:00Z"))).toBe(live(DATA, TODAY));
    expect(DATA.find((i) => i.id === "mock-int-005")?.applicationDeadline).toBe("2026-11-18");
  });

  it("keeps Member 3's ids and companies so résumé/interview data lines up", () => {
    for (const m3 of rawMember3.internships) {
      const ours = DATA.find((i) => i.id === m3.id);
      expect(ours?.company).toBe(m3.company);
      expect(ours?.title.startsWith(m3.title.split(" — ")[0])).toBe(true);
    }
  });
});

describe("dedupe and filters", () => {
  it("removes the duplicate, keeping the most recently checked copy", () => {
    const { internships, removed } = dedupeInternships(DATA);
    expect(internships).toHaveLength(DATA.length - 1);
    expect(removed).toEqual([{ kept: "mock-int-005", removed: "mock-int-011" }]);
  });

  it("hides expired listings unless asked", () => {
    expect(ids(filterInternships(DATA, {}, TODAY))).not.toContain("mock-int-010");
    expect(ids(filterInternships(DATA, { includeExpired: true }, TODAY))).toContain("mock-int-010");
  });

  it("filters by query, industry, work mode, location, and pay", () => {
    const f = (filters: Parameters<typeof filterInternships>[1]) => ids(filterInternships(DATA, filters, TODAY));
    expect(f({ query: "dashboards" })).toContain("mock-int-001");
    expect(f({ industry: "healthcare" }).sort()).toEqual(["mock-int-003", "mock-int-006"]);
    expect(f({ workMode: "remote" }).sort()).toEqual(["mock-int-002", "mock-int-006"]);
    const sd = f({ location: "San Diego" });
    expect(sd).toContain("mock-int-001");
    expect(sd).toContain("mock-int-002"); // remote roles count anywhere
    expect(sd).not.toContain("mock-int-009");
    const paid = f({ paidOnly: true });
    expect(paid).not.toContain("mock-int-004"); // unpaid
    expect(paid).not.toContain("mock-int-008"); // pay not listed
    expect(f({ query: "zzz-no-match" })).toEqual([]);
  });
});

describe("createInternshipService", () => {
  it("returns de-duplicated results and the duplicate count", async () => {
    const service = createInternshipService();
    const { internships, duplicatesRemoved } = await service.search({ includeExpired: true }, TODAY);
    expect(duplicatesRemoved).toBe(1);
    expect(new Set(ids(internships)).size).toBe(internships.length);
    expect(service.isMock).toBe(true);
    expect((await service.getById("mock-int-003"))?.title).toBe("Operations Intern");
    expect(await service.getById("nope")).toBeNull();
    expect(await service.listIndustries()).toContain("Healthcare");
  });

  it("surfaces a clear error for a broken source, and can retry", async () => {
    let calls = 0;
    const service = createInternshipService({
      name: "Flaky",
      isMock: true,
      listInternships: async () => {
        calls += 1;
        if (calls === 1) return "oops" as unknown as Internship[];
        return DATA;
      },
    });
    await expect(service.search()).rejects.toThrow(/invalid data/);
    await expect(service.search({}, TODAY)).resolves.toMatchObject({ duplicatesRemoved: 1 });
  });

  it("accepts a replacement data source", async () => {
    const service = createInternshipService({ name: "Fake API", isMock: false, listInternships: async () => [{ ...DATA[0], id: "api-1" }] });
    expect(ids((await service.search({}, TODAY)).internships)).toEqual(["api-1"]);
  });
});
