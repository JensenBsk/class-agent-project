// A follow-up email draft built only from what's already in the tracker.
// It never adds claims about the student. The student reviews it, approves
// copying it, and sends it from their own email. CareerLaunch never sends it.

import type { Application } from "./types";
import { formatDate } from "./utils";

export interface FollowUpDraft {
  subject: string;
  body: string;
}

/** Statuses where a follow-up email makes sense. */
export function canDraftFollowUp(app: Application): boolean {
  return app.status === "applied" || app.status === "interview_completed";
}

export function draftFollowUpEmail(app: Application, studentName = "[Your name]"): FollowUpDraft {
  const greeting = app.contactPerson ? `Hi ${app.contactPerson},` : "Hello,";
  const afterInterview = app.status === "interview_completed";

  const opening = afterInterview
    ? `Thank you again for speaking with me${app.interviewDate ? ` on ${formatDate(app.interviewDate)}` : ""} about the ${app.position} role at ${app.company}.`
    : `I applied for the ${app.position} role at ${app.company}${app.dateApplied ? ` on ${formatDate(app.dateApplied)}` : ""}.`;

  const ask = afterInterview
    ? "I wanted to check in on the timeline for next steps. I'm still very interested in the position."
    : "I wanted to check on the status of my application and confirm my continued interest in the position.";

  return {
    subject: `Following up: ${app.position} application`,
    body: [
      greeting,
      "",
      opening,
      ask,
      "",
      "Thank you for your time.",
      "",
      "Best regards,",
      studentName,
    ].join("\n"),
  };
}
