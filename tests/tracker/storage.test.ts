// Saving/loading the tracker, and the follow-up email draft.
import { describe, expect, it } from "vitest";
import {
  AgentActivityLog,
  ApplicationTracker,
  CorruptTrackerDataError,
  TRACKER_STORAGE_KEY,
  createApplication,
  draftFollowUpEmail,
  canDraftFollowUp,
  loadTracker,
  saveTracker,
  clearSavedTracker,
} from "@/agents/tracker";
import { BRIGHTLINE, MAYA, TODAY } from "./fixtures";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe("tracker storage", () => {
  it("starts empty when nothing is saved", () => {
    const { tracker, log } = loadTracker(memoryStorage());
    expect(tracker.list(MAYA)).toEqual([]);
    expect(log.listTasks(MAYA)).toEqual([]);
  });

  it("saves and loads applications, tasks, approvals and used approvals", async () => {
    const storage = memoryStorage();
    const tracker = new ApplicationTracker();
    const log = new AgentActivityLog();
    const app = tracker.add(MAYA, BRIGHTLINE, { today: TODAY, notes: "hi" });
    const task = log.startTask(MAYA, "recommend_next_action", "Drafted follow-up", app.id);
    const req = log.requestApproval(MAYA, task.id, "Copy follow-up email");
    log.approve(MAYA, req.id);
    await log.runIfApproved(MAYA, req.id, () => undefined);
    expect(saveTracker({ tracker, log }, storage)).toBe(true);

    const loaded = loadTracker(storage);
    expect(loaded.tracker.get(MAYA, app.id)?.notes).toBe("hi");
    expect(loaded.log.getTask(MAYA, task.id)?.status).toBe("completed");
    // A used approval stays used after reloading.
    expect(loaded.log.isApproved(MAYA, req.id)).toBe(false);
  });

  it("reports unreadable data instead of silently wiping it", () => {
    const storage = memoryStorage();
    storage.setItem(TRACKER_STORAGE_KEY, "{not json");
    expect(() => loadTracker(storage)).toThrow(CorruptTrackerDataError);
    storage.setItem(TRACKER_STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(() => loadTracker(storage)).toThrow(CorruptTrackerDataError);
  });

  it("returns false when the browser blocks saving, and clear removes data", () => {
    const blocked = { ...memoryStorage(), setItem: () => { throw new Error("QuotaExceeded"); } } as Storage;
    expect(saveTracker({ tracker: new ApplicationTracker(), log: new AgentActivityLog() }, blocked)).toBe(false);
    const storage = memoryStorage();
    saveTracker({ tracker: new ApplicationTracker(), log: new AgentActivityLog() }, storage);
    clearSavedTracker(storage);
    expect(storage.getItem(TRACKER_STORAGE_KEY)).toBeNull();
  });
});

describe("draftFollowUpEmail", () => {
  const base = createApplication(MAYA, BRIGHTLINE, { today: TODAY });

  it("is only offered after applying or after an interview", () => {
    expect(canDraftFollowUp(base)).toBe(false);
    expect(canDraftFollowUp({ ...base, status: "applied" })).toBe(true);
    expect(canDraftFollowUp({ ...base, status: "interview_completed" })).toBe(true);
  });

  it("uses only tracker details and the student's name", () => {
    const draft = draftFollowUpEmail(
      { ...base, status: "applied", dateApplied: "2026-11-01", contactPerson: "Jane Lee" },
      "Maya Rivera",
    );
    expect(draft.subject).toBe("Following up: Data Analyst Intern application");
    expect(draft.body).toContain("Hi Jane Lee,");
    expect(draft.body).toContain("on Nov 1, 2026");
    expect(draft.body).toContain("Maya Rivera");
    // No made-up qualifications or promises.
    expect(draft.body).not.toMatch(/experience in|skilled|guarantee/i);
  });

  it("thanks the interviewer after an interview", () => {
    const draft = draftFollowUpEmail({ ...base, status: "interview_completed", interviewDate: "2026-11-05" });
    expect(draft.body).toMatch(/Thank you again for speaking with me on Nov 5, 2026/);
    expect(draft.body).toContain("Hello,");
  });
});
