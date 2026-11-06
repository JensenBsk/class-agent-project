"use client";

import { draftFollowUpEmail, type Application, type ApprovalRequest } from "@/agents/tracker";
import styles from "./tracker.module.css";

interface ApprovalsPanelProps {
  pending: ApprovalRequest[];
  findApplication: (id: string | undefined) => Application | undefined;
  studentName: string;
  onApprove: (request: ApprovalRequest, text: string) => void;
  onReject: (request: ApprovalRequest) => void;
}

/** Everything the agent wants to do that needs a yes from the student first. */
export function ApprovalsPanel({ pending, findApplication, studentName, onApprove, onReject }: ApprovalsPanelProps) {
  return (
    <section className="card" aria-labelledby="approvals-heading">
      <h2 id="approvals-heading">Waiting for your approval ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className={styles.muted}>Nothing needs your approval right now.</p>
      ) : (
        <ul className={styles.list}>
          {pending.map((req) => {
            const app = findApplication(req.relatedId);
            const draft = app ? draftFollowUpEmail(app, studentName) : undefined;
            const text = draft ? `Subject: ${draft.subject}\n\n${draft.body}` : "";
            return (
              <li key={req.id} className={styles.approval}>
                <p className={styles.approvalAction}>{req.action}</p>
                {draft ? (
                  <>
                    <p className={styles.muted}>
                      Template draft built only from your tracker details. Review and edit it before you send it.
                    </p>
                    <pre className={styles.draft} aria-label="Follow-up email draft">
                      {text}
                    </pre>
                  </>
                ) : (
                  <p className={styles.muted}>The application this was for has been removed.</p>
                )}
                <div className={styles.buttonRow}>
                  {draft ? (
                    <button type="button" className="button" onClick={() => onApprove(req, text)}>
                      Approve and copy
                    </button>
                  ) : null}
                  <button type="button" className="button button--secondary" onClick={() => onReject(req)}>
                    {draft ? "Reject" : "Dismiss"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
