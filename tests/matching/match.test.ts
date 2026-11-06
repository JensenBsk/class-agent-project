import { describe, expect, it } from "vitest";
import { buildMockInternships } from "@/data/internships.mock";
import { demoProfile } from "@/services/matching/profile";
import { MATCHING_PROFILE_FIELDS, WEIGHTS, labelFor, pickMatchingFields, rankInternships, scoreInternship } from "@/services/matching/match";
import { MATCH_FACTOR_KEYS, type UserProfile } from "@/types";

const TODAY = new Date("2026-11-06T12:00:00Z");
const DATA = buildMockInternships(TODAY);
const MAYA = demoProfile(TODAY);
const byId = (id: string) => DATA.find((i) => i.id === id)!;
const score = (p: UserProfile, id: string) => scoreInternship(p, byId(id), TODAY);

describe("scoring is explainable", () => {
  it("weights add up to 100 and cover every shared factor key", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    expect(Object.keys(WEIGHTS).sort()).toEqual([...MATCH_FACTOR_KEYS].sort());
  });

  it("score is 0–100 and equals the sum of explained factor points", () => {
    for (const i of DATA) {
      const m = scoreInternship(MAYA, i, TODAY);
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
      expect(m.score).toBe(Math.round(m.factors.reduce((s, f) => s + f.points, 0)));
      for (const f of m.factors) {
        expect(f.points).toBeLessThanOrEqual(f.weight);
        expect(f.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns a full shared MatchScore with userProfileId (Jensen's review item 2)", () => {
    const m = score(MAYA, "mock-int-001");
    expect(m).toMatchObject({
      id: "match-mock-profile-maya-mock-int-001",
      userProfileId: "mock-profile-maya",
      internshipId: "mock-int-001",
      createdAt: TODAY.toISOString(),
    });
    expect(m.factors.map((f) => f.key)).toEqual([...MATCH_FACTOR_KEYS]);
    expect(m.reasons.length).toBeGreaterThan(0);
    expect(m.nextSteps.length).toBeGreaterThan(0);
    expect(m.matchedQualifications.every((q) => q.evidence)).toBe(true);
  });

  it("quotes the user's own wording as evidence", () => {
    const m = score(MAYA, "mock-int-001");
    expect(m.matchedQualifications.find((q) => q.label === "Strong written communication")?.evidence).toBe('You listed "Team communication" as a skill.');
  });
});

describe("Maya's ranking (matches Member 3's expectations)", () => {
  const ranked = rankInternships(MAYA, DATA, TODAY);

  it("ranks Brightline Data Analyst first as a strong match", () => {
    expect(ranked[0].internship.id).toBe("mock-int-001");
    expect(ranked[0].match.label).toBe("Strong match");
    const missing = ranked[0].match.missingQualifications.map((q) => q.label);
    expect(missing).toEqual(["Exposure to dbt", "Understanding of A/B testing"]);
  });

  it("flags Java and Kubernetes as missing on the cloud role, never as met", () => {
    const m = score(MAYA, "mock-int-002");
    const missing = Object.fromEntries(m.missingQualifications.map((q) => [q.label, q.severity]));
    expect(missing["Proficiency in Java"]).toBe("trainable");
    expect(missing["Kubernetes or container orchestration"]).toBe("trainable");
    expect(missing["Data structures and algorithms"]).toBe("critical");
    expect(m.nextSteps.some((s) => s.includes("stretch application"))).toBe(true);
  });

  it("ranks the marketing role as a weak match", () => {
    expect(score(MAYA, "mock-int-004").label).toBe("Weak match");
  });

  it("puts expired listings last", () => {
    expect(ranked.at(-1)?.internship.id).toBe("mock-int-010");
    expect(ranked.at(-1)?.match.eligibility.status).toBe("expired");
  });
});

describe("rules", () => {
  it("needing sponsorship blocks roles without it, with a reason, and ranks them after eligible roles", () => {
    const needsVisa: UserProfile = { ...MAYA, workAuthorization: { authorizedToWork: false, needsSponsorship: true } };
    const blocked = score(needsVisa, "mock-int-001");
    expect(blocked.eligibility.status).toBe("blocked");
    expect(blocked.eligibility.reasons[0]).toMatch(/sponsorship/);
    expect(score(needsVisa, "mock-int-002").eligibility.status).toBe("eligible");
    expect(rankInternships(needsVisa, DATA, TODAY)[0].match.eligibility.status).toBe("eligible");
  });

  it("gives remote-only users zero location points for on-site roles", () => {
    const remote: UserProfile = { ...MAYA, remotePreference: "remote", preferredLocations: [] };
    const loc = (id: string) => score(remote, id).factors.find((f) => f.key === "location")!.points;
    expect(loc("mock-int-003")).toBe(0);
    expect(loc("mock-int-006")).toBe(WEIGHTS.location);
  });

  it("lowers the score for pay below the minimum and flags unpaid or unlisted pay", () => {
    const comp = (p: UserProfile, id: string) => score(p, id).factors.find((f) => f.key === "compensation")!.points;
    expect(comp({ ...MAYA, salaryExpectation: 30 }, "mock-int-003")).toBeLessThan(comp(MAYA, "mock-int-003"));
    expect(comp(MAYA, "mock-int-004")).toBe(0);
    expect(score(MAYA, "mock-int-008").nextSteps.some((s) => s.includes("Pay isn't listed"))).toBe(true);
  });

  it("never tells the user to claim a skill they lack", () => {
    for (const i of DATA) {
      for (const q of scoreInternship(MAYA, i, TODAY).missingQualifications) {
        expect(q.suggestion).not.toMatch(/\b(just add|claim|pretend|say you have)\b/i);
        if (q.severity === "trainable") expect(q.suggestion).toMatch(/only add it to your résumé after you've actually done it/i);
      }
    }
  });

  it("a short major like CS doesn't earn credit for statistics-only roles", () => {
    const cs: UserProfile = { ...MAYA, major: "CS" };
    const acad = (id: string) => score(cs, id).factors.find((f) => f.key === "academics")!.points;
    expect(acad("mock-int-002")).toBe(WEIGHTS.academics); // lists computer science
    const statsOnly = { ...byId("mock-int-001"), relevantMajors: ["statistics"] };
    expect(scoreInternship(cs, statsOnly, TODAY).factors.find((f) => f.key === "academics")!.points).toBeLessThan(WEIGHTS.academics);
  });

  it("a nearly empty profile still scores without crashing", () => {
    const m = scoreInternship({ ...MAYA, skills: [], experience: [], major: "", preferredIndustries: [], careerGoals: "" }, byId("mock-int-001"), TODAY);
    expect(m.score).toBeGreaterThanOrEqual(0);
    expect(m.missingQualifications.length).toBeGreaterThan(0);
  });

  it("labelFor thresholds", () => {
    expect([labelFor(80), labelFor(65), labelFor(45), labelFor(10)]).toEqual(["Strong match", "Good match", "Possible match", "Weak match"]);
  });
});

describe("fairness", () => {
  it("name, school, GPA, and unrelated personal fields never change any score", () => {
    const base = rankInternships(MAYA, DATA, TODAY).map((r) => [r.internship.id, r.match.score]);
    const altered = { ...MAYA, name: "Someone Else", school: "Different University", gpa: 2.1, gender: "x", age: 45, ethnicity: "x" } as UserProfile;
    expect(rankInternships(altered, DATA, TODAY).map((r) => [r.internship.id, r.match.score])).toEqual(base);
  });

  it("pickMatchingFields exposes only the allow-listed fields", () => {
    const safe = pickMatchingFields({ ...MAYA, gender: "x" } as UserProfile);
    expect(Object.keys(safe).sort()).toEqual([...MATCHING_PROFILE_FIELDS].sort());
  });
});
