"use client";

import { useState, type ReactNode } from "react";
import styles from "./tracker.module.css";

interface ConfirmButtonProps {
  /** Text on the first button, e.g. "Remove". */
  label: string;
  /** What will happen, shown before the student confirms. */
  question: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

/** Two-step button for actions that can't be undone: click, then confirm. */
export function ConfirmButton({ label, question, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" className={`button button--secondary ${styles.danger}`} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className={styles.confirm} role="group" aria-label={label}>
      <p className={styles.confirmQuestion}>{question}</p>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={`button ${styles.dangerSolid}`}
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="button button--secondary" onClick={() => setAsking(false)} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  );
}
