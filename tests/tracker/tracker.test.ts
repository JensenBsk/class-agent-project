// Job 1: application tracker.
import { describe, expect, it } from "vitest";
import {
  ApplicationNotFoundError,
  ApplicationTracker,
  DuplicateApplicationError,
  createApplication,
} from "../../src/agents/tracker";
import { BRIGHTLINE, MAYA, NO_DEADLINE, OTHER_USER, TODAY, URGENT } from "./fixtures";

describe("createApplication", () => {
  it("copies company, position and deadline from the internship and starts as saved", () => {
    const app = createApplication(MAYA, BRIGHTLINE, { today: TODAY });
    expect(app).toMatchObject({
      userProfileId: MAYA,
      internshipId: "mock-int-001",
      company: "Brightline Analytics (fictional)",
      position: "Data Analyst Intern",
      status: "saved",
      dateSaved: TODAY,
      applicationDeadline: "2027-01-15",
    });
    expect(app.id).toMatch(/^app-/);
    expect(app.nextAction).not.toBe("");
  });

  it("accepts optional contact person and notes", () => {
    const app = createApplication(MAYA, BRIGHTLINE, { today: TODAY, contactPerson: "Jane Lee", notes: "Met at career fair" });
    expect(app.contactPerson).toBe("Jane Lee");
    expect(app.notes).toBe("Met at career fair");
  });

  it("rejects invalid dates", () => {
    expect(() => createApplication(MAYA, BRIGHTLINE, { followUpDate: "2026-13-40" })).toThrow(/YYYY-MM-DD/);
    expect(() => createApplication(MAYA, BRIGHTLINE, { interviewDate: "Nov 6" })).toThrow(/YYYY-MM-DD/);
  });

  it("requires a user and an internship with company and title", () => {
    expect(() => createApplication("", BRIGHTLINE)).toThrow();
    expect(() => createApplication(MAYA, { ...BRIGHTLINE, company: "" })).toThrow();
  });
});

describe("ApplicationTracker", () => {
  it("adds, gets and lists applications sorted by soonest deadline", () => {
    const t = new ApplicationTracker();
    t.add(MAYA, NO_DEADLINE, { today: TODAY });
    t.add(MAYA, BRIGHTLINE, { today: TODAY });
    const urgent = t.add(MAYA, URGENT, { today: TODAY });
    expect(t.get(MAYA, urgent.id)).toEqual(urgent);
    expect(t.list(MAYA).map((a) => a.internshipId)).toEqual(["mock-int-002", "mock-int-001", "mock-int-003"]);
  });

  it("does not allow the same internship twice for one user", () => {
    const t = new ApplicationTracker();
    t.add(MAYA, BRIGHTLINE);
    expect(() => t.add(MAYA, BRIGHTLINE)).toThrow(DuplicateApplicationError);
    // A different user can track the same internship.
    expect(() => t.add(OTHER_USER, BRIGHTLINE)).not.toThrow();
  });

  it("never shows one user's applications to another", () => {
    const t = new ApplicationTracker();
    const mayas = t.add(MAYA, BRIGHTLINE);
    expect(t.get(OTHER_USER, mayas.id)).toBeUndefined();
    expect(t.list(OTHER_USER)).toEqual([]);
    expect(() => t.edit(OTHER_USER, mayas.id, { notes: "x" })).toThrow(ApplicationNotFoundError);
    expect(t.remove(OTHER_USER, mayas.id)).toBe(false);
    expect(t.get(MAYA, mayas.id)).toBeDefined();
  });

  it("edits fields and refreshes the next action", () => {
    const t = new ApplicationTracker();
    const app = t.add(MAYA, BRIGHTLINE, { today: TODAY });
    const edited = t.edit(MAYA, app.id, { applicationDeadline: "2026-11-08", notes: "Ask about remote days" }, TODAY);
    expect(edited.notes).toBe("Ask about remote days");
    expect(edited.applicationDeadline).toBe("2026-11-08");
    expect(edited.nextAction).toBe(app.nextAction); // still "start preparing", now urgent
    expect(t.get(MAYA, app.id)?.notes).toBe("Ask about remote days");
  });

  it("filters by status", () => {
    const t = new ApplicationTracker();
    const a = t.add(MAYA, BRIGHTLINE);
    t.add(MAYA, URGENT);
    t.changeStatus(MAYA, a.id, "preparing", { today: TODAY });
    expect(t.list(MAYA, { status: "preparing" })).toHaveLength(1);
    expect(t.list(MAYA, { status: ["saved", "preparing"] })).toHaveLength(2);
  });

  it("removes one application, or resets all of a user's data", () => {
    const t = new ApplicationTracker();
    const a = t.add(MAYA, BRIGHTLINE);
    t.add(MAYA, URGENT);
    t.add(OTHER_USER, BRIGHTLINE);
    expect(t.remove(MAYA, a.id)).toBe(true);
    expect(t.list(MAYA)).toHaveLength(1);
    expect(t.reset(MAYA)).toBe(1);
    expect(t.list(MAYA)).toEqual([]);
    expect(t.list(OTHER_USER)).toHaveLength(1);
  });
});
