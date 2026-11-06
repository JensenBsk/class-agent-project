// Job 3: next-action recommendations, follow-up dates, and reminders.
// Everything here is a suggestion shown to the student. Nothing is sent
// anywhere: reminders are `in_app` only, and emails need approval (job 4).

import {
  CLOSED_STATUSES,
  NOT_YET_APPLIED_STATUSES,
  type Application,
  type DateString,
  type Notification,
  type NotificationType,
} from "./types";
import { daysBetween, newId, nowTimestamp, todayString } from "./utils";

/** Suggest a follow-up this many days after applying. */
export const FOLLOW_UP_AFTER_APPLYING_DAYS = 14;
/** Suggest a follow-up this many days after an interview. */
export const FOLLOW_UP_AFTER_INTERVIEW_DAYS = 7;
/** Deadlines closer than this are urgent. */
export const URGENT_DEADLINE_DAYS = 7;
/** How far ahead reminders look by default. */
export const DEFAULT_REMINDER_WINDOW_DAYS = 7;

export type Priority = "high" | "medium" | "low";

export interface NextAction {
  /** What to do, in plain language. Stored in `Application.nextAction`. */
  action: string;
  /** Why the agent is recommending it. */
  reason: string;
  priority: Priority;
  dueDate?: DateString;
}

function inDays(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return `in ${n} days`;
}

function deadlineNote(app: Application, today: DateString): { text: string; priority: Priority } {
  if (!app.applicationDeadline) return { text: "No deadline is listed.", priority: "low" };
  const days = daysBetween(today, app.applicationDeadline);
  const priority: Priority = days <= URGENT_DEADLINE_DAYS ? "high" : days <= 21 ? "medium" : "low";
  return { text: `The deadline is ${inDays(days)} (${app.applicationDeadline}).`, priority };
}

/** The single most useful next step for one application. */
export function recommendNextAction(app: Application, today: DateString = todayString()): NextAction {
  const who = app.contactPerson ?? "the recruiter";

  // Not applied yet, but the deadline has passed.
  if (
    NOT_YET_APPLIED_STATUSES.includes(app.status) &&
    app.applicationDeadline &&
    daysBetween(today, app.applicationDeadline) < 0
  ) {
    return {
      action: "Check whether the listing is still open. If it's closed, withdraw this application.",
      reason: `The deadline (${app.applicationDeadline}) has passed and you haven't applied yet.`,
      priority: "high",
      dueDate: app.applicationDeadline,
    };
  }

  switch (app.status) {
    case "saved": {
      const d = deadlineNote(app, today);
      return {
        action: "Start preparing: review why this internship matches you, then draft your résumé and cover letter.",
        reason: `You saved this but haven't started. ${d.text}`,
        priority: d.priority,
        dueDate: app.applicationDeadline,
      };
    }
    case "preparing": {
      const d = deadlineNote(app, today);
      return {
        action: "Finish your résumé and cover-letter drafts, then mark them ready for review.",
        reason: `Your materials are in progress. ${d.text}`,
        priority: d.priority,
        dueDate: app.applicationDeadline,
      };
    }
    case "ready_for_review": {
      const d = deadlineNote(app, today);
      return {
        action: "Review and approve your drafts, then submit the application yourself on the company's site.",
        reason: `Your drafts are ready. CareerLaunch never submits for you. ${d.text}`,
        priority: d.priority === "low" ? "medium" : d.priority,
        dueDate: app.applicationDeadline,
      };
    }
    case "applied": {
      if (app.followUpDate && daysBetween(today, app.followUpDate) <= 0) {
        return {
          action: `Follow up with ${who} to check on your application.`,
          reason: `You applied on ${app.dateApplied ?? "an earlier date"} and haven't heard back.`,
          priority: "high",
          dueDate: app.followUpDate,
        };
      }
      return {
        action: app.followUpDate
          ? `Wait to hear back. If there's no reply, follow up on ${app.followUpDate}.`
          : "Wait to hear back, and keep applying to other matches.",
        reason: "Companies usually take a few weeks to respond.",
        priority: "low",
        dueDate: app.followUpDate,
      };
    }
    case "interview_requested": {
      if (!app.interviewDate) {
        return {
          action: "Confirm the interview time with the company and add the date to your tracker.",
          reason: "An interview was requested but no date is saved.",
          priority: "high",
        };
      }
      const days = daysBetween(today, app.interviewDate);
      if (days < 0) {
        return {
          action: "Mark the interview as completed and add notes on how it went.",
          reason: `Your interview date (${app.interviewDate}) has passed.`,
          priority: "medium",
          dueDate: app.interviewDate,
        };
      }
      return {
        action: "Open interview prep and practice your answers.",
        reason: `Your interview is ${inDays(days)} (${app.interviewDate}).`,
        priority: days <= 3 ? "high" : "medium",
        dueDate: app.interviewDate,
      };
    }
    case "interview_completed": {
      const since = app.interviewDate ? daysBetween(app.interviewDate, today) : undefined;
      if (since !== undefined && since <= 1) {
        return {
          action: `Write a short thank-you note to ${who}. You review it and send it yourself.`,
          reason: "Thank-you notes are best sent within a day of the interview.",
          priority: "high",
          dueDate: app.interviewDate,
        };
      }
      if (app.followUpDate && daysBetween(today, app.followUpDate) <= 0) {
        return {
          action: `Follow up with ${who} to ask about next steps.`,
          reason: "It's been about a week since your interview.",
          priority: "high",
          dueDate: app.followUpDate,
        };
      }
      return {
        action: app.followUpDate
          ? `Wait to hear back. If there's no reply, follow up on ${app.followUpDate}.`
          : "Wait to hear back.",
        reason: "You've finished the interview.",
        priority: "low",
        dueDate: app.followUpDate,
      };
    }
    case "offer_received":
      return {
        action: "Review the offer and reply by the company's deadline. Your career center can help you decide.",
        reason: "You received an offer.",
        priority: "high",
      };
    case "rejected":
      return {
        action: "No action needed. You can ask for feedback and keep applying to your other matches.",
        reason: "This application was not successful.",
        priority: "low",
      };
    case "withdrawn":
      return {
        action: "No action needed.",
        reason: "You withdrew this application.",
        priority: "low",
      };
  }
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Next actions for all applications, most important first (the "What should I do next?" list). */
export function listNextActions(
  apps: readonly Application[],
  today: DateString = todayString(),
): Array<NextAction & { applicationId: string; company: string; position: string }> {
  return apps
    .map((app) => ({
      ...recommendNextAction(app, today),
      applicationId: app.id,
      company: app.company,
      position: app.position,
    }))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"),
    );
}

export interface ReminderOptions {
  today?: DateString;
  /** Look this many days ahead. Overdue follow-ups are always included. */
  windowDays?: number;
}

/**
 * Build in-app reminders for upcoming deadlines, interviews and follow-ups.
 * Returns new Notification objects; the caller decides whether to store them.
 */
export function buildReminders(apps: readonly Application[], options: ReminderOptions = {}): Notification[] {
  const today = options.today ?? todayString();
  const windowDays = options.windowDays ?? DEFAULT_REMINDER_WINDOW_DAYS;
  const out: Notification[] = [];
  const timestamp = nowTimestamp();

  const add = (app: Application, type: NotificationType, message: string, dueDate?: DateString) =>
    out.push({
      id: newId("ntf"),
      createdAt: timestamp,
      updatedAt: timestamp,
      userProfileId: app.userProfileId,
      type,
      message,
      dueDate,
      channel: "in_app",
      isRead: false,
    });

  for (const app of apps) {
    if (CLOSED_STATUSES.includes(app.status)) continue;
    const label = `${app.position} at ${app.company}`;

    if (NOT_YET_APPLIED_STATUSES.includes(app.status) && app.applicationDeadline) {
      const days = daysBetween(today, app.applicationDeadline);
      if (days >= 0 && days <= windowDays) {
        if (app.status === "saved") {
          add(app, "expiring_listing", `You saved ${label} but haven't started. It closes ${inDays(days)}.`, app.applicationDeadline);
        } else {
          add(app, "deadline", `${label} is due ${inDays(days)} (${app.applicationDeadline}).`, app.applicationDeadline);
        }
      }
    }

    if (app.status === "ready_for_review") {
      add(app, "resume_review", `Your drafts for ${label} are waiting for your review.`, app.applicationDeadline);
    }

    if (app.status === "interview_requested") {
      if (!app.interviewDate) {
        add(app, "missing_material", `Add the interview date for ${label}.`);
      } else {
        const days = daysBetween(today, app.interviewDate);
        if (days >= 0 && days <= windowDays) {
          add(app, "interview", `Interview for ${label} is ${inDays(days)} (${app.interviewDate}).`, app.interviewDate);
        }
      }
    }

    if ((app.status === "applied" || app.status === "interview_completed") && app.followUpDate) {
      const days = daysBetween(today, app.followUpDate);
      if (days <= windowDays) {
        const message =
          days <= 0
            ? `Time to follow up on ${label}.`
            : `Follow up on ${label} ${inDays(days)} (${app.followUpDate}).`;
        add(app, "follow_up", message, app.followUpDate);
      }
    }
  }

  return out.sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"));
}
