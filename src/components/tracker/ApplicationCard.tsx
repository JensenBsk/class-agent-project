"use client";

import { useId, useState, type FormEvent } from "react";
import {
  ALLOWED_TRANSITIONS,
  STATUS_LABELS,
  canDraftFollowUp,
  formatDate,
  recommendNextAction,
  type Application,
  type ApplicationStatus,
  type EditableApplicationFields,
  type TransitionOptions,
} from "@/agents/tracker";
import { ConfirmButton } from "./ConfirmButton";
import styles from "./tracker.module.css";

interface ApplicationCardProps {
  app: Application;
  today: string;
  hasPendingFollowUp: boolean;
  onChangeStatus: (to: ApplicationStatus, options: TransitionOptions) => void;
  onEdit: (changes: Partial<EditableApplicationFields>) => void;
  onDraftFollowUp: () => void;
  onRemove: () => void;
}

/** Empty input → undefined, so clearing a field removes it. */
function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? undefined : text;
}

export function ApplicationCard({
  app,
  today,
  hasPendingFollowUp,
  onChangeStatus,
  onEdit,
  onDraftFollowUp,
  onRemove,
}: ApplicationCardProps) {
  const id = useId();
  const allowed = ALLOWED_TRANSITIONS[app.status];
  const [target, setTarget] = useState<ApplicationStatus | "">("");
  const next = recommendNextAction(app, today);

  function submitStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) return;
    const data = new FormData(e.currentTarget);
    onChangeStatus(target, {
      today,
      date: optional(data.get("date")),
      interviewDate: optional(data.get("interviewDate")),
    });
    setTarget("");
  }

  function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onEdit({
      applicationDeadline: optional(data.get("applicationDeadline")),
      interviewDate: optional(data.get("interviewDate")),
      followUpDate: optional(data.get("followUpDate")),
      contactPerson: optional(data.get("contactPerson")),
      notes: optional(data.get("notes")),
    });
  }

  return (
    <article className={styles.appCard} aria-labelledby={`${id}-title`}>
      <div className={styles.appHeader}>
        <div>
          <h3 id={`${id}-title`}>{app.position}</h3>
          <p>{app.company}</p>
        </div>
        <span className={styles.badge} data-status={app.status}>
          {STATUS_LABELS[app.status]}
        </span>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Deadline</dt>
          <dd>{formatDate(app.applicationDeadline)}</dd>
        </div>
        <div>
          <dt>Saved</dt>
          <dd>{formatDate(app.dateSaved)}</dd>
        </div>
        <div>
          <dt>Applied</dt>
          <dd>{formatDate(app.dateApplied)}</dd>
        </div>
        <div>
          <dt>Interview</dt>
          <dd>{formatDate(app.interviewDate)}</dd>
        </div>
        <div>
          <dt>Follow up</dt>
          <dd>{formatDate(app.followUpDate)}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{app.contactPerson ?? "Not set"}</dd>
        </div>
      </dl>
      {app.notes ? <p className={styles.muted}>Notes: {app.notes}</p> : null}

      <div className={styles.nextBox}>
        <p className={styles.actionTitle}>Next: {next.action}</p>
        <p className={styles.muted}>{next.reason}</p>
      </div>

      {allowed.length > 0 ? (
        <form className={styles.form} onSubmit={submitStatus} aria-label={`Change status of ${app.position}`}>
          <div className={styles.field}>
            <label htmlFor={`${id}-status`}>Move to</label>
            <select
              id={`${id}-status`}
              value={target}
              onChange={(e) => setTarget(e.target.value as ApplicationStatus | "")}
            >
              <option value="">Choose a status…</option>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {target === "applied" ? (
            <div className={styles.field}>
              <label htmlFor={`${id}-date`}>Date you applied</label>
              <input id={`${id}-date`} name="date" type="date" defaultValue={today} max={today} required />
            </div>
          ) : null}
          {target === "interview_requested" ? (
            <div className={styles.field}>
              <label htmlFor={`${id}-iv`}>Interview date (if you know it)</label>
              <input id={`${id}-iv`} name="interviewDate" type="date" />
            </div>
          ) : null}
          <button type="submit" className="button" disabled={!target}>
            Update status
          </button>
        </form>
      ) : (
        <p className={styles.muted}>This application is closed. No more status changes.</p>
      )}
      {target === "applied" ? (
        <p className={styles.muted}>
          This only records that you applied yourself. CareerLaunch never submits applications.
        </p>
      ) : null}

      {canDraftFollowUp(app) ? (
        <div className={styles.section}>
          <button type="button" className="button button--secondary" onClick={onDraftFollowUp} disabled={hasPendingFollowUp}>
            {hasPendingFollowUp ? "Follow-up draft is waiting for your approval" : "Draft a follow-up email"}
          </button>
        </div>
      ) : null}

      <details className={styles.section}>
        <summary>Edit details</summary>
        <form key={app.updatedAt} className={styles.form} onSubmit={submitEdit} aria-label={`Edit details of ${app.position}`}>
          <div className={styles.field}>
            <label htmlFor={`${id}-deadline`}>Deadline</label>
            <input id={`${id}-deadline`} name="applicationDeadline" type="date" defaultValue={app.applicationDeadline} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-interview`}>Interview date</label>
            <input id={`${id}-interview`} name="interviewDate" type="date" defaultValue={app.interviewDate} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-followup`}>Follow-up date</label>
            <input id={`${id}-followup`} name="followUpDate" type="date" defaultValue={app.followUpDate} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-contact`}>Contact person</label>
            <input id={`${id}-contact`} name="contactPerson" type="text" defaultValue={app.contactPerson} maxLength={100} />
          </div>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor={`${id}-notes`}>Notes</label>
            <textarea id={`${id}-notes`} name="notes" defaultValue={app.notes} maxLength={2000} />
          </div>
          <button type="submit" className="button">
            Save details
          </button>
        </form>
      </details>

      <div className={styles.section}>
        <ConfirmButton
          label="Remove from tracker"
          question={`Remove "${app.position}" at ${app.company}? This deletes its dates and notes and can't be undone.`}
          confirmLabel="Yes, remove it"
          onConfirm={onRemove}
        />
      </div>
    </article>
  );
}
