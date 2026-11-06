// Job 4: approval before anything consequential, plus the agent's activity record.
//
// The rule (docs/data-definitions.md → ApprovalRequest): an action runs ONLY
// when its ApprovalRequest is `approved`. Pending, rejected, missing, already
// used, or approved for a different draft version all mean it does not run.
//
// Typical flow:
//   const task = log.startTask(userId, "recommend_next_action", "Drafted a follow-up email to Brightline");
//   const req  = log.requestApproval(userId, task.id, "Send this follow-up email to jane@brightline.example");
//   // UI shows req.action with Approve / Reject buttons
//   log.approve(userId, req.id);
//   await log.runIfApproved(userId, req.id, () => sendEmail(...));

import type {
  AgentTask,
  AgentTaskStatus,
  AgentTaskType,
  ApprovalRequest,
} from "./types";
import { newId, nowTimestamp } from "./utils";

export class ApprovalRequiredError extends Error {
  constructor(reason: string) {
    super(`This action needs your approval first: ${reason}`);
    this.name = "ApprovalRequiredError";
  }
}

export interface ActivitySnapshot {
  tasks: AgentTask[];
  approvals: ApprovalRequest[];
  usedApprovalIds: string[];
}

const TASK_TRANSITIONS: Readonly<Record<AgentTaskStatus, readonly AgentTaskStatus[]>> = {
  pending: ["in_progress", "failed"],
  in_progress: ["waiting_for_approval", "completed", "failed"],
  waiting_for_approval: ["in_progress", "completed", "failed"],
  completed: [],
  failed: [],
};

/**
 * In-memory record of what the agent did and what it's waiting on.
 * Every method is scoped to one user.
 */
export class AgentActivityLog {
  private readonly tasks = new Map<string, AgentTask>();
  private readonly approvals = new Map<string, ApprovalRequest>();
  /** Approval ids that have already been used to run their action. */
  private readonly used = new Set<string>();

  // ---------- Agent tasks ----------

  startTask(userProfileId: string, type: AgentTaskType, summary: string, relatedId?: string): AgentTask {
    const timestamp = nowTimestamp();
    const task: AgentTask = {
      id: newId("task"),
      createdAt: timestamp,
      updatedAt: timestamp,
      userProfileId,
      type,
      status: "in_progress",
      summary,
      relatedId,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  completeTask(userProfileId: string, taskId: string, summary?: string): AgentTask {
    return this.setTaskStatus(userProfileId, taskId, "completed", { summary });
  }

  failTask(userProfileId: string, taskId: string, error: string): AgentTask {
    return this.setTaskStatus(userProfileId, taskId, "failed", { error });
  }

  getTask(userProfileId: string, taskId: string): AgentTask | undefined {
    const task = this.tasks.get(taskId);
    return task && task.userProfileId === userProfileId ? task : undefined;
  }

  /** The user's activity record, newest first. */
  listTasks(userProfileId: string): AgentTask[] {
    return [...this.tasks.values()]
      .filter((t) => t.userProfileId === userProfileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ---------- Approvals ----------

  /** Ask the student before doing something consequential. Puts the task in `waiting_for_approval`. */
  requestApproval(
    userProfileId: string,
    agentTaskId: string,
    action: string,
    options: { relatedId?: string; relatedVersion?: number } = {},
  ): ApprovalRequest {
    if (!action.trim()) throw new Error("Describe exactly what will happen, in plain language");
    this.setTaskStatus(userProfileId, agentTaskId, "waiting_for_approval");
    const timestamp = nowTimestamp();
    const request: ApprovalRequest = {
      id: newId("apr"),
      createdAt: timestamp,
      updatedAt: timestamp,
      userProfileId,
      agentTaskId,
      action,
      relatedId: options.relatedId,
      relatedVersion: options.relatedVersion,
      status: "pending",
    };
    this.approvals.set(request.id, request);
    return request;
  }

  approve(userProfileId: string, requestId: string): ApprovalRequest {
    return this.decide(userProfileId, requestId, "approved");
  }

  /** The student said no. The task is closed and the action never runs. */
  reject(userProfileId: string, requestId: string): ApprovalRequest {
    const request = this.decide(userProfileId, requestId, "rejected");
    const task = this.getTask(userProfileId, request.agentTaskId);
    if (task) {
      this.setTaskStatus(userProfileId, task.id, "completed", {
        summary: `${task.summary} (You declined: ${request.action})`,
      });
    }
    return request;
  }

  getApproval(userProfileId: string, requestId: string): ApprovalRequest | undefined {
    const req = this.approvals.get(requestId);
    return req && req.userProfileId === userProfileId ? req : undefined;
  }

  listPendingApprovals(userProfileId: string): ApprovalRequest[] {
    return [...this.approvals.values()].filter(
      (r) => r.userProfileId === userProfileId && r.status === "pending",
    );
  }

  /** True only if the request exists for this user, is approved, unused, and matches the version (if given). */
  isApproved(userProfileId: string, requestId: string | undefined, relatedVersion?: number): boolean {
    if (!requestId) return false;
    const req = this.getApproval(userProfileId, requestId);
    if (!req || req.status !== "approved" || this.used.has(requestId)) return false;
    if (relatedVersion !== undefined && req.relatedVersion !== relatedVersion) return false;
    return true;
  }

  /**
   * Run `action` only if the request is approved. Each approval can be used once.
   * Throws ApprovalRequiredError otherwise, without calling `action`.
   */
  async runIfApproved<T>(
    userProfileId: string,
    requestId: string | undefined,
    action: () => T | Promise<T>,
    options: { relatedVersion?: number } = {},
  ): Promise<T> {
    if (!this.isApproved(userProfileId, requestId, options.relatedVersion)) {
      const req = requestId ? this.getApproval(userProfileId, requestId) : undefined;
      const reason = !req
        ? "no approval request was found"
        : this.used.has(req.id)
          ? "this approval was already used"
          : req.status !== "approved"
            ? `the request is ${req.status}`
            : "the draft changed after it was approved";
      throw new ApprovalRequiredError(reason);
    }
    const req = this.getApproval(userProfileId, requestId!)!;
    this.used.add(req.id);
    try {
      const result = await action();
      this.setTaskStatus(userProfileId, req.agentTaskId, "completed");
      return result;
    } catch (err) {
      this.setTaskStatus(userProfileId, req.agentTaskId, "failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /** Delete everything for this user (the brief's "reset my data"). */
  reset(userProfileId: string): void {
    for (const [id, t] of this.tasks) if (t.userProfileId === userProfileId) this.tasks.delete(id);
    for (const [id, r] of this.approvals) {
      if (r.userProfileId === userProfileId) {
        this.approvals.delete(id);
        this.used.delete(id);
      }
    }
  }

  /** Everything in the log, for saving (see storage.ts). */
  toJSON(): ActivitySnapshot {
    return {
      tasks: [...this.tasks.values()],
      approvals: [...this.approvals.values()],
      usedApprovalIds: [...this.used],
    };
  }

  /** Rebuild a log from `toJSON()` output. */
  static fromJSON(snapshot: ActivitySnapshot): AgentActivityLog {
    const log = new AgentActivityLog();
    for (const t of snapshot.tasks) log.tasks.set(t.id, t);
    for (const r of snapshot.approvals) log.approvals.set(r.id, r);
    for (const id of snapshot.usedApprovalIds) log.used.add(id);
    return log;
  }

  // ---------- internals ----------

  private decide(userProfileId: string, requestId: string, status: "approved" | "rejected"): ApprovalRequest {
    const req = this.getApproval(userProfileId, requestId);
    if (!req) throw new Error(`No approval request with id "${requestId}" was found for this user.`);
    if (req.status !== "pending") throw new Error(`This request was already ${req.status}.`);
    const timestamp = nowTimestamp();
    const updated: ApprovalRequest = { ...req, status, decidedAt: timestamp, updatedAt: timestamp };
    this.approvals.set(requestId, updated);
    return updated;
  }

  private setTaskStatus(
    userProfileId: string,
    taskId: string,
    status: AgentTaskStatus,
    extra: { summary?: string; error?: string } = {},
  ): AgentTask {
    const task = this.getTask(userProfileId, taskId);
    if (!task) throw new Error(`No agent task with id "${taskId}" was found for this user.`);
    if (!TASK_TRANSITIONS[task.status].includes(status)) {
      throw new Error(`Agent task can't go from ${task.status} to ${status}.`);
    }
    const updated: AgentTask = {
      ...task,
      status,
      summary: extra.summary ?? task.summary,
      error: extra.error ?? task.error,
      updatedAt: nowTimestamp(),
    };
    this.tasks.set(taskId, updated);
    return updated;
  }
}
