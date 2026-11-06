"use client";

// Member 3 (kcarrsdsu): pieces shared by /documents and /interview.
// The "_" folder name keeps this out of the app's routes.

import { useEffect, useMemo, useState } from "react";
import { MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import { getDemoProfile, getMockInternships } from "@/services/resume-interview";
import type { Internship, UserProfile } from "@/types";
import styles from "./resume-interview.module.css";

/** Member 2's interface: the internship the student picked on the Internships page. */
export const SELECTED_INTERNSHIP_KEY = "careerlaunch.selectedInternshipId";

function readSelected(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_INTERNSHIP_KEY);
  } catch {
    return null;
  }
}

function writeSelected(id: string) {
  try {
    window.localStorage.setItem(SELECTED_INTERNSHIP_KEY, id);
  } catch {
    // Storage can be blocked (private mode). Selection still works for this visit.
  }
}

/**
 * Pick the internship to show. If the saved id isn't in this list (for example
 * a Member 2 listing Member 3 doesn't have yet), say so instead of silently
 * switching to another role.
 */
export function resolveSelection(
  savedId: string | null,
  internships: Internship[],
): { internship: Internship; unavailableId: string | null } {
  const found = savedId ? internships.find((i) => i.id === savedId) : undefined;
  return {
    internship: found ?? internships[0],
    unavailableId: savedId && !found ? savedId : null,
  };
}

export interface DemoContext {
  profile: UserProfile;
  internships: Internship[];
  internship: Internship;
  /** The saved internship id when it isn't available on this page; null otherwise. */
  unavailableId: string | null;
  selectInternship: (id: string) => void;
  /** False until the browser has loaded, so server and browser render the same thing. */
  ready: boolean;
}

/**
 * Demo profile (Maya) + mock internships, and the selected internship.
 * Until Member 2's profile and internships pages are in the app, this uses
 * the shared demo user and Member 3's fictional mock listings.
 */
export function useDemoContext(): DemoContext {
  const profile = useMemo(() => getDemoProfile(), []);
  const internships = useMemo(() => getMockInternships(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelectedId(readSelected());
    setReady(true);
  }, []);

  const { internship, unavailableId } = resolveSelection(selectedId, internships);
  return {
    profile,
    internships,
    internship,
    unavailableId,
    ready,
    selectInternship: (id: string) => {
      setSelectedId(id);
      writeSelected(id);
    },
  };
}

export function InternshipPicker({ ctx, id }: { ctx: DemoContext; id: string }) {
  const { internship } = ctx;
  return (
    <section className="card" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Internship and profile</h2>
      {ctx.unavailableId ? (
        <StateMessage variant="error" title="The internship you selected isn't available here yet">
          You picked a listing ({ctx.unavailableId}) that isn&apos;t loaded on this page yet, so it&apos;s showing{" "}
          <strong>
            {internship.title} at {internship.company}
          </strong>{" "}
          instead. Choose an internship below.
        </StateMessage>
      ) : null}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={id}>Internship</label>
          <select
            id={id}
            className={styles.select}
            value={internship.id}
            onChange={(e) => ctx.selectInternship(e.target.value)}
          >
            {ctx.internships.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} — {i.company}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className={styles.small}>
        {internship.isMock ? <MockDataLabel /> : null} {internship.location} ·{" "}
        {internship.workMode.replace("_", " ")}
        {internship.applicationDeadline ? ` · Apply by ${internship.applicationDeadline}` : ""}
      </p>
      <p className={`${styles.small} ${styles.muted}`}>
        Using the demo profile for <strong>{ctx.profile.name}</strong> (fictional). Once the Profile page is
        connected, your own profile is used here instead.
      </p>
    </section>
  );
}

/** "Approve this?" box. Nothing happens until the student clicks Approve. */
export function ApprovalPrompt({
  action,
  onApprove,
  onDecline,
}: {
  action: string;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div className={styles.prompt} role="region" aria-label="Approval needed" aria-live="polite">
      <h3>Your approval is needed</h3>
      <p>{action}</p>
      <p className={`${styles.small} ${styles.muted}`}>Nothing happens unless you approve.</p>
      <div className={styles.actions}>
        <button type="button" className="button" onClick={onApprove}>
          Approve
        </button>
        <button type="button" className="button button--secondary" onClick={onDecline}>
          Don&apos;t approve
        </button>
      </div>
    </div>
  );
}

export { styles };
