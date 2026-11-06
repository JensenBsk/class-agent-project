"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { listNextActions, localTodayString } from "@/agents/tracker";
import { useTracker } from "@/agents/tracker/useTracker";
import { StateMessage } from "@/components/StateMessage";
import { DEMO_USER_ID } from "./demoData";
import styles from "./tracker.module.css";

/**
 * The home page "Next action" card body. Shows the tracker's top
 * recommendation, or `fallback` when nothing is being tracked yet.
 */
export function HomeNextAction({ fallback }: { fallback: ReactNode }) {
  const { state } = useTracker();

  if (state.status === "loading") return <StateMessage variant="loading" title="Checking your next step…" />;
  if (state.status === "error") return <>{fallback}</>;

  const { tracker, log } = state.data;
  const open = tracker
    .list(DEMO_USER_ID)
    .filter((a) => a.status !== "rejected" && a.status !== "withdrawn");
  const pending = log.listPendingApprovals(DEMO_USER_ID).length;
  const [top] = listNextActions(open, localTodayString());

  if (!top && pending === 0) return <>{fallback}</>;

  return (
    <div className={styles.approval}>
      {pending > 0 ? (
        <p className={styles.actionTitle}>
          {pending === 1 ? "1 item is" : `${pending} items are`} waiting for your approval.
        </p>
      ) : null}
      {top ? (
        <div className={styles.actionItem} data-priority={top.priority}>
          <p className={styles.actionTitle}>{top.action}</p>
          <p className={styles.muted}>
            {top.position} at {top.company}. {top.reason}
          </p>
        </div>
      ) : null}
      <div>
        <Link className="button" href="/tracker">
          Open tracker
        </Link>
      </div>
    </div>
  );
}
