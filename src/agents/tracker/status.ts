// Job 2: application statuses and which moves between them are allowed.
//
// Normal path:
//   saved → preparing → ready_for_review → applied → interview_requested
//         → interview_completed → offer_received
// Can end early:   rejected (after applying), withdrawn (any time)
//
// Moving to `applied` only RECORDS that the student applied themselves.
// The app never submits an application on its own.

import { FOLLOW_UP_AFTER_APPLYING_DAYS, FOLLOW_UP_AFTER_INTERVIEW_DAYS, recommendNextAction } from "./nextActions";
import type { Application, ApplicationStatus, DateString } from "./types";
import { addDays, assertValidDate, nowTimestamp, todayString } from "./utils";

export const ALLOWED_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  saved: ["preparing", "withdrawn"],
  preparing: ["saved", "ready_for_review", "withdrawn"],
  // Back to preparing if the student wants changes to the drafts.
  ready_for_review: ["preparing", "applied", "withdrawn"],
  applied: ["interview_requested", "rejected", "withdrawn"],
  interview_requested: ["interview_completed", "rejected", "withdrawn"],
  // Back to interview_requested for another interview round.
  interview_completed: ["interview_requested", "offer_received", "rejected", "withdrawn"],
  // Withdrawing after an offer = declining it.
  offer_received: ["withdrawn"],
  rejected: [],
  // The student withdrew it themselves, so they can reopen it.
  withdrawn: ["saved"],
};

export const STATUS_LABELS: Readonly<Record<ApplicationStatus, string>> = {
  saved: "Saved",
  preparing: "Preparing",
  ready_for_review: "Ready for review",
  applied: "Applied",
  interview_requested: "Interview requested",
  interview_completed: "Interview completed",
  offer_received: "Offer received",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};


export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: ApplicationStatus,
    public readonly to: ApplicationStatus,
  ) {
    const allowed = ALLOWED_TRANSITIONS[from].map((s) => STATUS_LABELS[s]).join(", ") || "none";
    super(
      `Can't move an application from "${STATUS_LABELS[from]}" to "${STATUS_LABELS[to]}". Allowed next statuses: ${allowed}.`,
    );
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface TransitionOptions {
  /** Override "today" (for tests and demos). */
  today?: DateString;
  /** The date the event happened, e.g. the day the student applied. Defaults to today. */
  date?: DateString;
  /** For `interview_requested`: the interview date, if known. */
  interviewDate?: DateString;
}

/** Return a copy of `app` in the new status, with dates and next action updated. Throws InvalidTransitionError if not allowed. */
export function transitionApplication(
  app: Application,
  to: ApplicationStatus,
  options: TransitionOptions = {},
): Application {
  const today = options.today ?? todayString();
  const date = options.date ?? today;
  assertValidDate(date, "date");
  assertValidDate(options.interviewDate, "interviewDate");

  if (!canTransition(app.status, to)) throw new InvalidTransitionError(app.status, to);

  const updated: Application = { ...app, status: to, updatedAt: nowTimestamp() };

  switch (to) {
    case "applied":
      updated.dateApplied = date;
      updated.followUpDate = addDays(date, FOLLOW_UP_AFTER_APPLYING_DAYS);
      break;
    case "interview_requested":
      // A new round replaces the old interview date.
      updated.interviewDate = options.interviewDate;
      updated.followUpDate = undefined;
      break;
    case "interview_completed":
      updated.followUpDate = addDays(app.interviewDate ?? date, FOLLOW_UP_AFTER_INTERVIEW_DAYS);
      break;
    case "offer_received":
    case "rejected":
    case "withdrawn":
      updated.followUpDate = undefined;
      break;
  }

  updated.nextAction = recommendNextAction(updated, today).action;
  return updated;
}
