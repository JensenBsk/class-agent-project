// Member 3: keyword analysis (spec tests T1, T2) and mock data loading.
import { describe, expect, it } from "vitest";
import {
  analyzeKeywords,
  containsTerm,
  getDemoProfile,
  getMockInternships,
  summarizeKeywords,
} from "@/services/resume-interview";

const TODAY = "2026-11-06";
const maya = getDemoProfile();
const [brightline, harborview, greenleaf] = getMockInternships(TODAY);
const byTerm = (results: ReturnType<typeof analyzeKeywords>, term: string) =>
  results.find((r) => r.term === term)!;

describe("analyzeKeywords", () => {
  it("T1: Java and Kubernetes are missing for Maya (she doesn't have them)", () => {
    const results = analyzeKeywords(maya, harborview);
    expect(byTerm(results, "java").action).toBe("missing_skill");
    expect(byTerm(results, "kubernetes").action).toBe("missing_skill");
    expect(byTerm(results, "java").evidence).toEqual([]);
  });

  it("T2: SQL and Tableau are can_add (in her profile, not her résumé), never missing", () => {
    const results = analyzeKeywords(maya, brightline);
    expect(byTerm(results, "sql").action).toBe("can_add");
    expect(byTerm(results, "tableau").action).toBe("can_add");
    expect(byTerm(results, "python").action).toBe("already_present");
    expect(byTerm(results, "sql").evidence.some((e) => e.sourceId === "skills[1]")).toBe(true);
  });

  it("matches whole words only, so 'java' doesn't match 'javascript'", () => {
    expect(containsTerm("I know JavaScript", "java")).toBe(false);
    expect(containsTerm("Java and Git", "java")).toBe(true);
    expect(containsTerm("Used PostgreSQL daily", "sql")).toBe(true);
  });

  it("doesn't count career goals as proof of a skill", () => {
    const wantsKubernetes = { ...maya, careerGoals: "Learn Kubernetes and Java." };
    const results = analyzeKeywords(wantsKubernetes, harborview);
    expect(byTerm(results, "kubernetes").action).toBe("missing_skill");
  });

  it("gives a plain-English summary", () => {
    expect(summarizeKeywords(analyzeKeywords(maya, greenleaf))).toMatch(/already shows \d of 4 required/);
  });
});

describe("mock data", () => {
  it("moves deadlines relative to today so listings don't expire before the demo", () => {
    expect(brightline.applicationDeadline).toBe("2026-12-21");
    expect(getMockInternships("2027-03-01")[0].applicationDeadline).toBe("2027-04-15");
  });

  it("uses the shared Qualification shape", () => {
    for (const i of getMockInternships(TODAY)) {
      expect(i.isMock).toBe(true);
      for (const q of [...i.requiredQualifications, ...i.preferredQualifications]) {
        expect(q).toEqual({
          label: expect.any(String),
          type: expect.any(String),
          keywords: expect.any(Array),
          trainable: expect.any(Boolean),
        });
        for (const k of q.keywords) expect(k).toBe(k.toLowerCase());
      }
    }
  });

  it("returns a fresh copy each time, so callers can't change the shared data", () => {
    const p = getDemoProfile();
    p.skills.push("Kubernetes");
    expect(getDemoProfile().skills).not.toContain("Kubernetes");
  });
});
