// Job 2: status transitions.
import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  APPLICATION_STATUSES,
  InvalidTransitionError,
  canTransition,
  createApplication,
  transitionApplication,
  type Application,
  type ApplicationStatus,
} from "../../src/agents/tracker";
import { BRIGHTLINE, MAYA, TODAY } from "./fixtures";

function at(status: ApplicationStatus, extra: Partial<Application> = {}): Application {
  return { ...createApplication(MAYA, BRIGHTLINE, { today: TODAY }), status, ...extra };
}

describe("status transitions", () => {
  it("covers all 9 statuses", () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual([...APPLICATION_STATUSES].sort());
  });

  it("allows the full happy path from saved to offer", () => {
    let app = at("saved");
    const path: ApplicationStatus[] = [
      "preparing",
      "ready_for_review",
      "applied",
      "interview_requested",
      "interview_completed",
      "offer_received",
    ];
    for (const next of path) app = transitionApplication(app, next, { today: TODAY });
    expect(app.status).toBe("offer_received");
  });

  it.each<[ApplicationStatus, ApplicationStatus]>([
    ["saved", "applied"], // can't skip preparing and review
    ["saved", "offer_received"],
    ["preparing", "applied"], // drafts must be ready for review first
    ["saved", "rejected"], // can't be rejected before applying
    ["applied", "saved"],
    ["rejected", "applied"], // rejected is final
    ["offer_received", "rejected"],
    ["withdrawn", "applied"],
  ])("blocks %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
    expect(() => transitionApplication(at(from), to, { today: TODAY })).toThrow(InvalidTransitionError);
  });

  it("explains which statuses are allowed in the error", () => {
    expect(() => transitionApplication(at("saved"), "applied")).toThrow(/Allowed next statuses: Preparing, Withdrawn/);
  });

  it("allows withdrawing from every open status", () => {
    for (const s of APPLICATION_STATUSES) {
      if (s === "rejected" || s === "withdrawn") continue;
      expect(canTransition(s, "withdrawn")).toBe(true);
    }
  });

  it("allows going back to preparing from review, and reopening a withdrawn application", () => {
    expect(canTransition("ready_for_review", "preparing")).toBe(true);
    expect(canTransition("withdrawn", "saved")).toBe(true);
    expect(canTransition("interview_completed", "interview_requested")).toBe(true); // another round
  });

  it("sets dateApplied and a follow-up date 14 days later when applied", () => {
    const app = transitionApplication(at("ready_for_review"), "applied", { today: TODAY });
    expect(app.dateApplied).toBe(TODAY);
    expect(app.followUpDate).toBe("2026-11-20");
  });

  it("uses the given date when the student applied on an earlier day", () => {
    const app = transitionApplication(at("ready_for_review"), "applied", { today: TODAY, date: "2026-11-01" });
    expect(app.dateApplied).toBe("2026-11-01");
    expect(app.followUpDate).toBe("2026-11-15");
  });

  it("stores the interview date and sets a follow-up 7 days after the interview", () => {
    let app = transitionApplication(at("applied", { followUpDate: "2026-11-20" }), "interview_requested", {
      today: TODAY,
      interviewDate: "2026-11-12",
    });
    expect(app.interviewDate).toBe("2026-11-12");
    expect(app.followUpDate).toBeUndefined();
    app = transitionApplication(app, "interview_completed", { today: "2026-11-12" });
    expect(app.followUpDate).toBe("2026-11-19");
  });

  it("clears the follow-up date when the application closes", () => {
    const app = transitionApplication(at("applied", { followUpDate: "2026-11-20" }), "rejected", { today: TODAY });
    expect(app.followUpDate).toBeUndefined();
  });

  it("updates nextAction and does not change the original object", () => {
    const before = at("saved");
    const after = transitionApplication(before, "preparing", { today: TODAY });
    expect(before.status).toBe("saved");
    expect(after.nextAction).toMatch(/Finish your résumé/);
  });

  it("rejects invalid dates", () => {
    expect(() => transitionApplication(at("ready_for_review"), "applied", { date: "tomorrow" })).toThrow();
  });
});
