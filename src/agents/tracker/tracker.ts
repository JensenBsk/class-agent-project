// Job 1: the application tracker.
// Keeps one Application per (user, internship). Storage is in memory for now;
// the class is the only place that touches storage, so it can be swapped for
// localStorage or a database later without changing callers.

import { recommendNextAction } from "./nextActions";
import { transitionApplication, type TransitionOptions } from "./status";
import type {
  Application,
  ApplicationStatus,
  DateString,
  InternshipRef,
} from "./types";
import { assertValidDate, newId, nowTimestamp, todayString } from "./utils";

/** Fields the user can edit directly. Status changes go through `changeStatus`. */
export type EditableApplicationFields = Pick<
  Application,
  "applicationDeadline" | "interviewDate" | "followUpDate" | "contactPerson" | "notes"
>;

export interface NewApplicationOptions extends Partial<EditableApplicationFields> {
  /** Override "today" (for tests and demos). */
  today?: DateString;
}

export class DuplicateApplicationError extends Error {
  constructor(public readonly existing: Application) {
    super(
      `"${existing.position}" at ${existing.company} is already in your tracker (status: ${existing.status}).`,
    );
    this.name = "DuplicateApplicationError";
  }
}

export class ApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`No application with id "${id}" was found for this user.`);
    this.name = "ApplicationNotFoundError";
  }
}

function validateEditableFields(fields: Partial<EditableApplicationFields>): void {
  assertValidDate(fields.applicationDeadline, "applicationDeadline");
  assertValidDate(fields.interviewDate, "interviewDate");
  assertValidDate(fields.followUpDate, "followUpDate");
}

/** Build a new Application in the `saved` status from an internship listing. */
export function createApplication(
  userProfileId: string,
  internship: InternshipRef,
  options: NewApplicationOptions = {},
): Application {
  const { today = todayString(), ...fields } = options;
  if (!userProfileId) throw new Error("userProfileId is required");
  if (!internship.company || !internship.title) {
    throw new Error("The internship must have a company and a title");
  }
  validateEditableFields(fields);

  const timestamp = nowTimestamp();
  const app: Application = {
    id: newId("app"),
    createdAt: timestamp,
    updatedAt: timestamp,
    userProfileId,
    internshipId: internship.id,
    company: internship.company,
    position: internship.title,
    status: "saved",
    dateSaved: today,
    applicationDeadline: internship.applicationDeadline,
    ...fields,
    nextAction: "",
  };
  app.nextAction = recommendNextAction(app, today).action;
  return app;
}

/** Return a copy of `app` with the edited fields and a refreshed next action. */
export function editApplication(
  app: Application,
  changes: Partial<EditableApplicationFields>,
  today: DateString = todayString(),
): Application {
  validateEditableFields(changes);
  const updated: Application = { ...app, ...changes, updatedAt: nowTimestamp() };
  updated.nextAction = recommendNextAction(updated, today).action;
  return updated;
}

export interface ListOptions {
  status?: ApplicationStatus | ApplicationStatus[];
}

/** In-memory tracker. Every method is scoped to one user, so one user can never see another's data. */
export class ApplicationTracker {
  private readonly apps = new Map<string, Application>();

  add(userProfileId: string, internship: InternshipRef, options?: NewApplicationOptions): Application {
    const existing = this.findByInternship(userProfileId, internship.id);
    if (existing) throw new DuplicateApplicationError(existing);
    const app = createApplication(userProfileId, internship, options);
    this.apps.set(app.id, app);
    return app;
  }

  get(userProfileId: string, id: string): Application | undefined {
    const app = this.apps.get(id);
    return app && app.userProfileId === userProfileId ? app : undefined;
  }

  findByInternship(userProfileId: string, internshipId: string): Application | undefined {
    for (const app of this.apps.values()) {
      if (app.userProfileId === userProfileId && app.internshipId === internshipId) return app;
    }
    return undefined;
  }

  /** The user's applications, soonest deadline first (no deadline last). */
  list(userProfileId: string, options: ListOptions = {}): Application[] {
    const statuses =
      options.status === undefined
        ? undefined
        : Array.isArray(options.status)
          ? options.status
          : [options.status];
    return [...this.apps.values()]
      .filter((a) => a.userProfileId === userProfileId)
      .filter((a) => !statuses || statuses.includes(a.status))
      .sort((a, b) =>
        (a.applicationDeadline ?? "9999-12-31").localeCompare(b.applicationDeadline ?? "9999-12-31"),
      );
  }

  edit(
    userProfileId: string,
    id: string,
    changes: Partial<EditableApplicationFields>,
    today?: DateString,
  ): Application {
    const updated = editApplication(this.require(userProfileId, id), changes, today);
    this.apps.set(id, updated);
    return updated;
  }

  changeStatus(
    userProfileId: string,
    id: string,
    to: ApplicationStatus,
    options?: TransitionOptions,
  ): Application {
    const updated = transitionApplication(this.require(userProfileId, id), to, options);
    this.apps.set(id, updated);
    return updated;
  }

  remove(userProfileId: string, id: string): boolean {
    if (!this.get(userProfileId, id)) return false;
    return this.apps.delete(id);
  }

  /** Delete every application for this user (the brief's "reset my data"). Returns how many were removed. */
  reset(userProfileId: string): number {
    let removed = 0;
    for (const [id, app] of this.apps) {
      if (app.userProfileId === userProfileId) {
        this.apps.delete(id);
        removed++;
      }
    }
    return removed;
  }

  private require(userProfileId: string, id: string): Application {
    const app = this.get(userProfileId, id);
    if (!app) throw new ApplicationNotFoundError(id);
    return app;
  }
}
