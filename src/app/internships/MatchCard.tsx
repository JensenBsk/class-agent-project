import { MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import type { RankedInternship } from "@/services/matching/match";
import type { Compensation, MissingQualificationSeverity } from "@/types";
import styles from "./internships.module.css";

const MODE_TEXT = { remote: "Remote", hybrid: "Hybrid", in_person: "In person" } as const;
const SEVERITY_TEXT: Record<MissingQualificationSeverity, string> = {
  critical: "Critical",
  trainable: "Trainable",
  nice_to_have: "Nice to have",
};

export function formatPay(c?: Compensation): string {
  if (!c || c.hourlyMax === undefined) return "Pay not listed";
  if (c.hourlyMax <= 0) return c.note || "Unpaid";
  return c.hourlyMin !== undefined && c.hourlyMin !== c.hourlyMax ? `$${c.hourlyMin}–$${c.hourlyMax}/hr` : `$${c.hourlyMax}/hr`;
}

interface MatchCardProps {
  item: RankedInternship;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function MatchCard({ item: { internship: i, match: m }, selected, onSelect }: MatchCardProps) {
  const headingId = `job-${i.id}`;
  const status = m.eligibility.status;
  return (
    <article className={`${styles.job} ${selected ? styles.selected : ""}`} aria-labelledby={headingId}>
      <div className={styles.jobHeader}>
        <div>
          <h2 id={headingId}>{i.title}</h2>
          <p className={styles.sub}>
            {i.company} · {i.location} · {MODE_TEXT[i.workMode]} · {formatPay(i.compensation)}
          </p>
          <p className={styles.sub}>
            {i.applicationDeadline ? `Deadline ${i.applicationDeadline}` : "No deadline listed"} · {i.industry} · Source: {i.source} · Checked{" "}
            {i.lastCheckedAt.slice(0, 10)}
          </p>
          <div className={styles.badges}>
            {i.isMock ? <MockDataLabel /> : null}
            {status !== "eligible" ? <span className={`${styles.tag} ${styles[status]}`}>{status === "blocked" ? "Eligibility issue" : "Expired"}</span> : null}
          </div>
        </div>
        <p className={styles.score} aria-label={`Match score ${m.score} out of 100, ${m.label}`}>
          <span className={styles.scoreNumber}>{m.score}/100</span>
          {m.label}
        </p>
      </div>

      <p>{i.description}</p>

      {m.eligibility.reasons.length ? (
        <div className={styles.alert}>
          <StateMessage variant="error" title={status === "expired" ? "This listing has expired" : "You may not be eligible"}>
            {m.eligibility.reasons.join(" ")}
          </StateMessage>
        </div>
      ) : null}

      <h3 className={styles.sectionTitle}>
        <span className={`${styles.tag} ${styles.fact}`}>Facts</span> Why it matches
      </h3>
      <ul className={styles.bullets}>
        {m.reasons.length ? m.reasons.map((r) => <li key={r}>{r}</li>) : <li>No strong match factors.</li>}
      </ul>

      <h3 className={styles.sectionTitle}>
        <span className={`${styles.tag} ${styles.rec}`}>Recommendation</span> What to do next
      </h3>
      <ul className={styles.bullets}>
        {m.nextSteps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <details className={styles.details}>
        <summary>Full score breakdown and qualifications</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>How the {m.score}-point score was calculated</caption>
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Points</th>
                <th scope="col">How it was calculated</th>
              </tr>
            </thead>
            <tbody>
              {m.factors.map((f) => (
                <tr key={f.key}>
                  <th scope="row">{f.label}</th>
                  <td className={styles.points}>
                    {f.points} / {f.weight}
                  </td>
                  <td>{f.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className={styles.sectionTitle}>Qualifications you meet</h4>
        <ul className={styles.quals}>
          {m.matchedQualifications.length ? (
            m.matchedQualifications.map((q) => (
              <li key={q.label}>
                <span aria-hidden="true">✓ </span>
                <strong>{q.label}</strong> ({q.required ? "required" : "preferred"})
                <span className={styles.qualNote}>{q.evidence}</span>
              </li>
            ))
          ) : (
            <li>None found in your profile yet.</li>
          )}
        </ul>

        <h4 className={styles.sectionTitle}>Qualifications missing</h4>
        <ul className={styles.quals}>
          {m.missingQualifications.length ? (
            m.missingQualifications.map((q) => (
              <li key={q.label}>
                <span aria-hidden="true">✗ </span>
                <strong>{q.label}</strong> <span className={`${styles.tag} ${styles[q.severity]}`}>{SEVERITY_TEXT[q.severity]}</span>
                <span className={styles.qualNote}>{q.suggestion}</span>
              </li>
            ))
          ) : (
            <li>None. You meet every listed qualification.</li>
          )}
        </ul>
      </details>

      <div className={styles.actions}>
        <button type="button" className={selected ? "button" : "button button--secondary"} aria-pressed={selected} onClick={() => onSelect(i.id)}>
          {selected ? "Selected" : "Select this internship"}
        </button>
        <a href={i.applicationUrl} target="_blank" rel="noopener noreferrer">
          View listing<span className={styles.srOnly}> for {i.title} (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
