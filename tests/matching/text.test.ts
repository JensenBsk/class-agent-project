import { describe, expect, it } from "vitest";
import { canonicalMajor, canonicalSkill, containsPhrase, daysBetween, majorsMatch, sameCity, splitList } from "@/services/matching/text";

describe("majors (Jensen's review item 5)", () => {
  it('"CS" does not match "statistics"', () => {
    expect(majorsMatch("CS", "statistics")).toBe(false);
    expect(majorsMatch("Statistics", "cs")).toBe(false);
  });
  it('"CS" expands to computer science', () => {
    expect(canonicalMajor("CS")).toBe("computer science");
    expect(majorsMatch("CS", "computer science")).toBe(true);
  });
  it("matches whole phrases inside longer majors", () => {
    expect(majorsMatch("Management Information Systems", "information systems")).toBe(true);
    expect(majorsMatch("B.S. Computer Science", "computer science")).toBe(true);
    expect(majorsMatch("Mathematics", "math")).toBe(false);
  });
});

describe("skills use Member 3's shared alias list", () => {
  it("maps spellings to one canonical name", () => {
    expect(canonicalSkill("MS Excel")).toBe("excel");
    expect(canonicalSkill("PostgreSQL")).toBe("sql");
    expect(canonicalSkill("Team communication")).toBe("communication");
  });
  it('"java" does not match "javascript"', () => {
    expect(containsPhrase("javascript developer", "java")).toBe(false);
    expect(containsPhrase("java developer", "java")).toBe(true);
  });
});

describe("helpers", () => {
  it("splitList cleans and de-duplicates", () => {
    expect(splitList("Python, SQL,  , python; Excel")).toEqual(["Python", "SQL", "Excel"]);
  });
  it("sameCity compares by city", () => {
    expect(sameCity("San Diego, CA", "san diego")).toBe(true);
    expect(sameCity("Remote (US)", "San Diego, CA")).toBe(false);
  });
  it("daysBetween counts whole days", () => {
    expect(daysBetween("2026-11-06", "2026-11-20")).toBe(14);
    expect(daysBetween(new Date("2026-11-06T23:00:00Z"), "2026-11-05")).toBe(-1);
  });
});
