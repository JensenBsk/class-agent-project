// Job 3: next actions and reminders.
import { describe, expect, it } from "vitest";
import {
  buildReminders,
  createApplication,
  listNextActions,
  recommendNextAction,
  type Application,
  type ApplicationStatus,
} from "../../src/agents/tracker";
import { BRIGHTLINE, MAYA, NO_DEADLINE, TODAY, URGENT } from "./fixtures";

function at(status: ApplicationStatus, extra: Partial<Application> = {}, internship = BRIGHTLINE): Application {
  return { ...createApplication(MAYA, internship, { today: TODAY }), status, ...extra };
}

describe("recommendNextAction", () => {
  it("tells a saved application to start preparing, urgent when the deadline is close", () => {
    expect(recommendNextAction(at("saved"), TODAY)).toMatchObject({ priority: "low", action: expect.stringMatching(/Start preparing/) });
    const urgent = recommendNextAction(at("saved", {}, URGENT), TODAY);
    expect(urgent.priority).toBe("high");
    expect(urgent.reason).toMatch(/in 3 days \(2026-11-09\)/);
  });

  it("handles a missing deadline", () => {
    expect(recommendNextAction(at("saved", {}, NO_DEADLINE), TODAY).reason).toMatch(/No deadline/);
  });

  it("warns when the deadline passed before applying", () => {
    const next = recommendNextAction(at("preparing", { applicationDeadline: "2026-11-01" }), TODAY);
    expect(next.priority).toBe("high");
    expect(next.action).toMatch(/still open/);
  });

  it("reminds the student that they submit the application themselves", () => {
    expect(recommendNextAction(at("ready_for_review"), TODAY).action).toMatch(/submit the application yourself/);
  });

  it("waits after applying, then suggests a follow-up on the follow-up date", () => {
    const app = at("applied", { dateApplied: "2026-11-06", followUpDate: "2026-11-20" });
    expect(recommendNextAction(app, "2026-11-10")).toMatchObject({ priority: "low", action: expect.stringMatching(/Wait/) });
    const due = recommendNextAction({ ...app, contactPerson: "Jane Lee" }, "2026-11-20");
    expect(due.priority).toBe("high");
    expect(due.action).toBe("Follow up with Jane Lee to check on your application.");
  });

  it("asks for the interview date when missing, then points to interview prep", () => {
    expect(recommendNextAction(at("interview_requested"), TODAY).action).toMatch(/add the date/);
    const soon = recommendNextAction(at("interview_requested", { interviewDate: "2026-11-08" }), TODAY);
    expect(soon).toMatchObject({ priority: "high", action: expect.stringMatching(/interview prep/) });
    const past = recommendNextAction(at("interview_requested", { interviewDate: "2026-11-01" }), TODAY);
    expect(past.action).toMatch(/Mark the interview as completed/);
  });

  it("suggests a thank-you note right after the interview, which the student sends", () => {
    const next = recommendNextAction(at("interview_completed", { interviewDate: "2026-11-05", followUpDate: "2026-11-12" }), TODAY);
    expect(next.action).toMatch(/thank-you note.*send it yourself/);
  });

  it("has a recommendation for every status", () => {
    const statuses: ApplicationStatus[] = [
      "saved", "preparing", "ready_for_review", "applied", "interview_requested",
      "interview_completed", "offer_received", "rejected", "withdrawn",
    ];
    for (const s of statuses) expect(recommendNextAction(at(s), TODAY).action.length).toBeGreaterThan(0);
  });

  it("never promises a job", () => {
    for (const s of ["applied", "interview_completed", "offer_received"] as const) {
      const { action, reason } = recommendNextAction(at(s), TODAY);
      expect(`${action} ${reason}`).not.toMatch(/guarantee|you will get|you'll get the job/i);
    }
  });
});

describe("listNextActions", () => {
  it("sorts the most important actions first", () => {
    const list = listNextActions([at("saved"), at("rejected"), at("saved", {}, URGENT)], TODAY);
    expect(list.map((a) => a.priority)).toEqual(["high", "low", "low"]);
    expect(list[0].company).toBe("Harbor Health (fictional)");
  });
});

describe("buildReminders", () => {
  it("creates in-app reminders only, unread", () => {
    const reminders = buildReminders([at("preparing", {}, URGENT)], { today: TODAY });
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({ type: "deadline", channel: "in_app", isRead: false, userProfileId: MAYA, dueDate: "2026-11-09" });
  });

  it("flags a saved-but-not-started listing that is about to close", () => {
    const [r] = buildReminders([at("saved", {}, URGENT)], { today: TODAY });
    expect(r.type).toBe("expiring_listing");
  });

  it("skips deadlines outside the window", () => {
    expect(buildReminders([at("preparing")], { today: TODAY })).toEqual([]);
    expect(buildReminders([at("preparing")], { today: TODAY, windowDays: 90 })).toHaveLength(1);
  });

  it("creates interview, missing-date, review and follow-up reminders", () => {
    const types = buildReminders(
      [
        at("interview_requested", { interviewDate: "2026-11-10" }),
        at("interview_requested"),
        at("ready_for_review", { applicationDeadline: "2027-03-01" }),
        at("applied", { followUpDate: "2026-11-01" }), // overdue
      ],
      { today: TODAY },
    ).map((r) => r.type);
    expect(types.sort()).toEqual(["follow_up", "interview", "missing_material", "resume_review"]);
  });

  it("ignores closed applications", () => {
    expect(
      buildReminders([at("rejected", { followUpDate: TODAY }), at("withdrawn", {}, URGENT)], { today: TODAY }),
    ).toEqual([]);
  });
});
