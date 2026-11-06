// Job 4: approval before consequential actions, and the agent's activity record.
import { describe, expect, it, vi } from "vitest";
import { AgentActivityLog, ApprovalRequiredError } from "../../src/agents/tracker";
import { MAYA, OTHER_USER } from "./fixtures";

function setup() {
  const log = new AgentActivityLog();
  const task = log.startTask(MAYA, "recommend_next_action", "Drafted a follow-up email to Brightline", "app-1");
  const req = log.requestApproval(MAYA, task.id, "Send this follow-up email to Jane Lee at Brightline", {
    relatedId: "app-1",
  });
  return { log, task, req };
}

describe("approval requests", () => {
  it("start as pending and put the task in waiting_for_approval", () => {
    const { log, task, req } = setup();
    expect(req.status).toBe("pending");
    expect(log.getTask(MAYA, task.id)?.status).toBe("waiting_for_approval");
    expect(log.listPendingApprovals(MAYA)).toHaveLength(1);
  });

  it("require a plain-language description of the action", () => {
    const log = new AgentActivityLog();
    const task = log.startTask(MAYA, "draft_resume", "Drafted résumé");
    expect(() => log.requestApproval(MAYA, task.id, "  ")).toThrow();
  });

  it("do NOT run the action while pending", async () => {
    const { log, req } = setup();
    const send = vi.fn();
    await expect(log.runIfApproved(MAYA, req.id, send)).rejects.toThrow(ApprovalRequiredError);
    expect(send).not.toHaveBeenCalled();
  });

  it("do NOT run the action when rejected, and record that the student declined", async () => {
    const { log, task, req } = setup();
    log.reject(MAYA, req.id);
    const send = vi.fn();
    await expect(log.runIfApproved(MAYA, req.id, send)).rejects.toThrow(/rejected/);
    expect(send).not.toHaveBeenCalled();
    expect(log.getTask(MAYA, task.id)?.summary).toMatch(/You declined/);
  });

  it("do NOT run the action when there is no request at all", async () => {
    const log = new AgentActivityLog();
    const send = vi.fn();
    await expect(log.runIfApproved(MAYA, undefined, send)).rejects.toThrow(/no approval request/);
    await expect(log.runIfApproved(MAYA, "apr-made-up", send)).rejects.toThrow(ApprovalRequiredError);
    expect(send).not.toHaveBeenCalled();
  });

  it("run the action once approved, then mark the task completed", async () => {
    const { log, task, req } = setup();
    const approved = log.approve(MAYA, req.id);
    expect(approved.decidedAt).toBeDefined();
    const send = vi.fn().mockResolvedValue("sent");
    await expect(log.runIfApproved(MAYA, req.id, send)).resolves.toBe("sent");
    expect(send).toHaveBeenCalledOnce();
    expect(log.getTask(MAYA, task.id)?.status).toBe("completed");
  });

  it("can only be used once", async () => {
    const { log, req } = setup();
    log.approve(MAYA, req.id);
    await log.runIfApproved(MAYA, req.id, () => "ok");
    const again = vi.fn();
    await expect(log.runIfApproved(MAYA, req.id, again)).rejects.toThrow(/already used/);
    expect(again).not.toHaveBeenCalled();
  });

  it("can't be decided twice", () => {
    const { log, req } = setup();
    log.approve(MAYA, req.id);
    expect(() => log.reject(MAYA, req.id)).toThrow(/already approved/);
  });

  it("don't apply to a later version of the draft", async () => {
    const log = new AgentActivityLog();
    const task = log.startTask(MAYA, "draft_resume", "Drafted résumé v2", "draft-1");
    const req = log.requestApproval(MAYA, task.id, "Mark résumé draft v2 as final", { relatedId: "draft-1", relatedVersion: 2 });
    log.approve(MAYA, req.id);
    const finalize = vi.fn();
    await expect(log.runIfApproved(MAYA, req.id, finalize, { relatedVersion: 3 })).rejects.toThrow(/changed/);
    expect(finalize).not.toHaveBeenCalled();
    await log.runIfApproved(MAYA, req.id, finalize, { relatedVersion: 2 });
    expect(finalize).toHaveBeenCalledOnce();
  });

  it("can't be approved or used by another user", async () => {
    const { log, req } = setup();
    expect(() => log.approve(OTHER_USER, req.id)).toThrow();
    log.approve(MAYA, req.id);
    const send = vi.fn();
    await expect(log.runIfApproved(OTHER_USER, req.id, send)).rejects.toThrow(ApprovalRequiredError);
    expect(send).not.toHaveBeenCalled();
    expect(log.listPendingApprovals(OTHER_USER)).toEqual([]);
  });

  it("mark the task failed if the approved action throws", async () => {
    const { log, task, req } = setup();
    log.approve(MAYA, req.id);
    await expect(
      log.runIfApproved(MAYA, req.id, () => {
        throw new Error("Email service unavailable");
      }),
    ).rejects.toThrow("Email service unavailable");
    expect(log.getTask(MAYA, task.id)).toMatchObject({ status: "failed", error: "Email service unavailable" });
  });
});

describe("activity record", () => {
  it("lists a user's tasks, and reset deletes only that user's data", () => {
    const log = new AgentActivityLog();
    const t = log.startTask(MAYA, "rank_internships", "Ranked 4 internships");
    log.completeTask(MAYA, t.id);
    log.startTask(OTHER_USER, "find_internships", "Searched mock listings");
    expect(log.listTasks(MAYA)).toHaveLength(1);
    expect(log.listTasks(MAYA)[0].status).toBe("completed");
    log.reset(MAYA);
    expect(log.listTasks(MAYA)).toEqual([]);
    expect(log.listTasks(OTHER_USER)).toHaveLength(1);
  });

  it("does not let a finished task change status", () => {
    const log = new AgentActivityLog();
    const t = log.startTask(MAYA, "rank_internships", "Ranked");
    log.completeTask(MAYA, t.id);
    expect(() => log.failTask(MAYA, t.id, "oops")).toThrow();
  });
});
