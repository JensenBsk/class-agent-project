/**
 * Checks that Member 3's demo data still fits the shared types, so a change on
 * either side shows up as a failing test instead of a runtime bug.
 */
import { describe, expect, it } from "vitest";
import maya from "@/data/resume-interview/mock-profile-maya.json";
import internships from "@/data/resume-interview/mock-internships.json";
import { QUALIFICATION_TYPES, WORK_MODES } from "@/types";

describe("mock data matches shared types", () => {
  it("Maya has the required UserProfile fields", () => {
    expect(maya.userProfile).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      school: expect.any(String),
      major: expect.any(String),
      skills: expect.any(Array),
    });
    expect(maya.userProfile).not.toHaveProperty("gpa");
  });

  it("every mock internship is labeled mock and uses valid enums", () => {
    const list = internships.internships as unknown as Record<string, any>[];
    expect(list.length).toBeGreaterThan(0);
    for (const i of list) {
      expect(i.isMock).toBe(true);
      expect(WORK_MODES).toContain(i.workMode);
      // Member 3 is moving qualifications from strings to Qualification objects;
      // check the type only once they are objects.
      for (const q of [...i.requiredQualifications, ...i.preferredQualifications]) {
        if (typeof q === "object") expect(QUALIFICATION_TYPES).toContain(q.type);
      }
    }
  });
});
