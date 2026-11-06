// Member 4 (BadoGoat1): types for the objects this workstream owns.
// Field names follow docs/data-definitions.md exactly. If the shared types
// file from Member 5's app skeleton lands, swap these for imports from it.

/** `YYYY-MM-DD` */
export type DateString = string;
/** Full ISO 8601 timestamp */
export type Timestamp = string;

export interface BaseRecord {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------- Application (job 1 + 2) ----------

export const APPLICATION_STATUSES = [
  "saved",
  "preparing",
  "ready_for_review",
  "applied",
  "interview_requested",
  "interview_completed",
  "offer_received",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** No further action expected from the tracker. */
export const CLOSED_STATUSES: readonly ApplicationStatus[] = ["offer_received", "rejected", "withdrawn"];
/** The student hasn't applied yet, so the deadline still matters. */
export const NOT_YET_APPLIED_STATUSES: readonly ApplicationStatus[] = ["saved", "preparing", "ready_for_review"];

export interface Application extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  /** Copied from the Internship so it survives if the listing changes. */
  company: string;
  /** Copied from Internship.title. */
  position: string;
  status: ApplicationStatus;
  dateSaved: DateString;
  dateApplied?: DateString;
  applicationDeadline?: DateString;
  interviewDate?: DateString;
  followUpDate?: DateString;
  contactPerson?: string;
  notes?: string;
  nextAction: string;
}

/**
 * The few Internship fields the tracker needs. Member 2 owns the full
 * `Internship` type; any full Internship object satisfies this.
 */
export interface InternshipRef {
  id: string;
  company: string;
  title: string;
  applicationDeadline?: DateString;
}

// ---------- AgentTask (job 4) ----------

export type AgentTaskType =
  | "find_internships"
  | "rank_internships"
  | "draft_resume"
  | "draft_cover_letter"
  | "prepare_interview"
  | "recommend_next_action";

export type AgentTaskStatus =
  | "pending"
  | "in_progress"
  | "waiting_for_approval"
  | "completed"
  | "failed";

export interface AgentTask extends BaseRecord {
  userProfileId: string;
  type: AgentTaskType;
  status: AgentTaskStatus;
  /** Plain-language description of what happened. */
  summary: string;
  relatedId?: string;
  error?: string;
}

// ---------- ApprovalRequest (job 4) ----------

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest extends BaseRecord {
  userProfileId: string;
  agentTaskId: string;
  /** Exactly what will happen, in plain language. */
  action: string;
  relatedId?: string;
  /**
   * [PROPOSED by Member 3, optional] Version of the draft being approved, so
   * an approval can't silently apply to a later edit of the same draft.
   */
  relatedVersion?: number;
  status: ApprovalStatus;
  decidedAt?: Timestamp;
}

// ---------- Notification (job 3) ----------

export type NotificationType =
  | "deadline"
  | "interview"
  | "follow_up"
  | "resume_review"
  | "missing_material"
  | "expiring_listing";

export interface Notification extends BaseRecord {
  userProfileId: string;
  type: NotificationType;
  message: string;
  dueDate?: DateString;
  /** Only `in_app` for now. Other channels need the user to opt in. */
  channel: "in_app";
  isRead: boolean;
}
