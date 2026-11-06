// Member 4 (BadoGoat1): the shared types this workstream uses.
// They come from `@/types` (src/types/index.ts) so there's one definition.
// The one addition is Member 3's optional `relatedVersion` on ApprovalRequest.

import type {
  ApplicationStatus,
  ApprovalRequest as SharedApprovalRequest,
  ISODate,
  ISOTimestamp,
} from "@/types";

export {
  APPLICATION_STATUSES,
  type AgentTask,
  type AgentTaskStatus,
  type AgentTaskType,
  type Application,
  type ApplicationStatus,
  type ApprovalStatus,
  type BaseRecord,
  type Notification,
  type NotificationType,
} from "@/types";

/** `YYYY-MM-DD` */
export type DateString = ISODate;
/** Full ISO 8601 timestamp */
export type Timestamp = ISOTimestamp;

export interface ApprovalRequest extends SharedApprovalRequest {
  /**
   * [PROPOSED by Member 3, optional] Version of the draft being approved, so
   * an approval can't silently apply to a later edit of the same draft.
   */
  relatedVersion?: number;
}

/** No further action expected from the tracker. */
export const CLOSED_STATUSES: readonly ApplicationStatus[] = ["offer_received", "rejected", "withdrawn"];
/** The student hasn't applied yet, so the deadline still matters. */
export const NOT_YET_APPLIED_STATUSES: readonly ApplicationStatus[] = ["saved", "preparing", "ready_for_review"];

/**
 * The few Internship fields the tracker needs. Any full `Internship` from
 * `@/types` satisfies this.
 */
export interface InternshipRef {
  id: string;
  company: string;
  title: string;
  applicationDeadline?: DateString;
}
