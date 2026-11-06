"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import {
  STATUS_LABELS,
  buildReminders,
  formatDate,
  listNextActions,
  localTodayString,
  type Application,
  type ApprovalRequest,
} from "@/agents/tracker";
import { useTracker } from "@/agents/tracker/useTracker";
import { MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import { ApplicationCard } from "./ApplicationCard";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { ConfirmButton } from "./ConfirmButton";
import { NextActionsList } from "./NextActionsList";
import { DEMO_USER_ID, DEMO_USER_NAME, TRACKABLE_INTERNSHIPS } from "./demoData";
import styles from "./tracker.module.css";

type Notice = { variant: "success" | "error"; text: string };

const USER = DEMO_USER_ID;
const REMINDER_LABELS = {
  deadline: "Deadline",
  interview: "Interview",
  follow_up: "Follow up",
  resume_review: "Review drafts",
  missing_material: "Missing info",
  expiring_listing: "Closing soon",
} as const;

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

export function TrackerView() {
  const { state, update, updateAsync, startFresh } = useTracker();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const addId = useId();

  if (state.status === "loading") {
    return <StateMessage variant="loading" title="Loading your tracker…" />;
  }

  if (state.status === "error") {
    return (
      <StateMessage
        variant="error"
        title={state.message}
        action={
          <ConfirmButton
            label="Start fresh"
            question="This deletes the saved tracker data on this device."
            confirmLabel="Yes, start fresh"
            onConfirm={startFresh}
          />
        }
      >
        The saved data may be from an older version. You can start with an empty tracker.
      </StateMessage>
    );
  }

  const { tracker, log } = state.data;
  const today = localTodayString();
  const apps = tracker.list(USER);
  const openApps = apps.filter((a) => a.status !== "rejected" && a.status !== "withdrawn");
  const nextActions = listNextActions(openApps, today);
  const reminders = buildReminders(apps, { today });
  const pending = log.listPendingApprovals(USER);
  const tasks = log.listTasks(USER);
  const untracked = TRACKABLE_INTERNSHIPS.filter((i) => !tracker.findByInternship(USER, i.id));

  /** Run a change, then show a success or error message. */
  function run(change: Parameters<typeof update>[0], success: string) {
    try {
      update(change);
      setNotice({ variant: "success", text: success });
    } catch (err) {
      setNotice({ variant: "error", text: errorText(err) });
    }
  }

  function addInternship(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const internshipId = new FormData(e.currentTarget).get("internship");
    const internship = TRACKABLE_INTERNSHIPS.find((i) => i.id === internshipId);
    if (!internship) {
      setNotice({ variant: "error", text: "Choose an internship to add." });
      return;
    }
    run(({ tracker }) => tracker.add(USER, internship, { today }), `Added ${internship.title} at ${internship.company}.`);
  }

  function draftFollowUp(app: Application) {
    run(({ log }) => {
      const task = log.startTask(
        USER,
        "recommend_next_action",
        `Drafted a follow-up email for ${app.position} at ${app.company}`,
        app.id,
      );
      log.requestApproval(
        USER,
        task.id,
        `Copy this follow-up email for ${app.company} to your clipboard so you can send it yourself. CareerLaunch will not send it.`,
        { relatedId: app.id },
      );
    }, "Drafted a follow-up email. Review it under “Waiting for your approval”.");
  }

  async function approve(req: ApprovalRequest, text: string) {
    setCopyFallback(null);
    try {
      await updateAsync(async ({ log }) => {
        log.approve(USER, req.id);
        await log.runIfApproved(USER, req.id, async () => {
          if (!navigator.clipboard) throw new Error("Copying isn't available in this browser.");
          await navigator.clipboard.writeText(text);
        });
      });
      setNotice({ variant: "success", text: "Approved and copied. Paste it into your own email and send it when you're ready." });
    } catch (err) {
      setCopyFallback(text);
      setNotice({ variant: "error", text: `${errorText(err)} Select the text below and copy it yourself.` });
    }
  }

  function reject(req: ApprovalRequest) {
    run(({ log }) => log.reject(USER, req.id), "Rejected. Nothing was copied or sent.");
  }

  function remove(app: Application) {
    run(({ tracker, log }) => {
      // Close any approval still waiting for this application.
      for (const req of log.listPendingApprovals(USER)) {
        if (req.relatedId === app.id) log.reject(USER, req.id);
      }
      tracker.remove(USER, app.id);
    }, `Removed ${app.position} at ${app.company}.`);
  }

  return (
    <>
      {notice ? (
        <div className={styles.notice}>
          <StateMessage
            variant={notice.variant}
            title={notice.text}
            action={
              <button type="button" className="button button--secondary" onClick={() => setNotice(null)}>
                Dismiss
              </button>
            }
          />
        </div>
      ) : null}

      {copyFallback ? (
        <section className="card" aria-labelledby="copy-heading">
          <h2 id="copy-heading">Your approved follow-up email</h2>
          <pre className={styles.draft}>{copyFallback}</pre>
          <button type="button" className="button button--secondary" onClick={() => setCopyFallback(null)}>
            Done
          </button>
        </section>
      ) : null}

      {!state.savedOk ? (
        <div className={styles.notice}>
          <StateMessage variant="error" title="Changes aren't being saved on this device">
            Your browser blocked storage (for example, in a private window). Your tracker will reset when you leave.
          </StateMessage>
        </div>
      ) : null}

      <div className={styles.grid}>
        <section className="card" aria-labelledby="next-heading">
          <h2 id="next-heading">What to do next</h2>
          {nextActions.length === 0 ? (
            <p className={styles.muted}>Add an internship below to get recommendations.</p>
          ) : (
            <NextActionsList items={nextActions} />
          )}
        </section>

        <section className="card" aria-labelledby="reminders-heading">
          <h2 id="reminders-heading">Reminders (next 7 days)</h2>
          {reminders.length === 0 ? (
            <p className={styles.muted}>No deadlines, interviews or follow-ups this week.</p>
          ) : (
            <ul className={styles.list}>
              {reminders.map((r) => (
                <li key={r.id} className={styles.actionItem}>
                  <p className={styles.actionTitle}>
                    <span className={styles.badge}>{REMINDER_LABELS[r.type]}</span> {r.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.muted}>Reminders only appear here. CareerLaunch doesn&apos;t email or text you.</p>
        </section>
      </div>

      <ApprovalsPanel
        pending={pending}
        findApplication={(id) => (id ? tracker.get(USER, id) : undefined)}
        studentName={DEMO_USER_NAME}
        onApprove={approve}
        onReject={reject}
      />

      <section aria-labelledby="apps-heading">
        <h2 id="apps-heading">Your applications ({apps.length})</h2>
        {apps.length === 0 ? (
          <StateMessage
            variant="empty"
            title="No applications yet"
            action={
              <Link className="button button--secondary" href="/internships">
                Browse internships
              </Link>
            }
          >
            Add an internship below to start tracking its deadline and next steps.
          </StateMessage>
        ) : (
          <ul className={styles.list}>
            {apps.map((app) => (
              <li key={app.id}>
                <ApplicationCard
                  app={app}
                  today={today}
                  hasPendingFollowUp={pending.some((r) => r.relatedId === app.id)}
                  onChangeStatus={(to, options) =>
                    run(({ tracker }) => tracker.changeStatus(USER, app.id, to, options), `Moved to “${STATUS_LABELS[to]}”.`)
                  }
                  onEdit={(changes) => run(({ tracker }) => tracker.edit(USER, app.id, changes, today), "Details saved.")}
                  onDraftFollowUp={() => draftFollowUp(app)}
                  onRemove={() => remove(app)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="add-heading" style={{ marginTop: "var(--space-6)" }}>
        <h2 id="add-heading">Add an internship</h2>
        {untracked.length === 0 ? (
          <p className={styles.muted}>Every available internship is already in your tracker.</p>
        ) : (
          <form className={styles.form} onSubmit={addInternship}>
            <div className={styles.field}>
              <label htmlFor={`${addId}-internship`}>Internship</label>
              <select id={`${addId}-internship`} name="internship" required defaultValue="">
                <option value="" disabled>
                  Choose an internship…
                </option>
                {untracked.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} at {i.company}
                    {i.applicationDeadline ? ` (due ${formatDate(i.applicationDeadline)})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="button">
              Add to tracker
            </button>
          </form>
        )}
        <p className={styles.muted}>
          <MockDataLabel /> These listings are sample data until the Internships page is connected.
        </p>
      </section>

      <section className="card" aria-labelledby="activity-heading">
        <h2 id="activity-heading">What the agent did</h2>
        {tasks.length === 0 ? (
          <p className={styles.muted}>Nothing yet. Drafts and approvals will be listed here.</p>
        ) : (
          <ul className={`${styles.list} ${styles.activity}`}>
            {tasks.map((t) => (
              <li key={t.id}>
                <span className={styles.badge}>{t.status.replaceAll("_", " ")}</span>
                <span>{t.summary}</span>
                {t.error ? <span className={styles.muted}>({t.error})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="reset-heading">
        <h2 id="reset-heading">Your data</h2>
        <p className={styles.muted}>Your tracker is saved only in this browser.</p>
        <ConfirmButton
          label="Delete all tracker data"
          question="This deletes every application, approval and activity record on this device. It can't be undone."
          confirmLabel="Yes, delete everything"
          onConfirm={() =>
            run(({ tracker, log }) => {
              tracker.reset(USER);
              log.reset(USER);
            }, "All tracker data deleted.")
          }
        />
      </section>
    </>
  );
}
