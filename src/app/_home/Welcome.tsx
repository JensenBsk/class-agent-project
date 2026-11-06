"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserStorage, createProfileStore, demoProfile } from "@/services/matching/profile";
import styles from "./welcome.module.css";

const POINTS = [
  {
    title: "Explained matches",
    text: "Every internship gets a score with the reasons behind it, and the skills you're missing.",
  },
  {
    title: "Honest applications",
    text: "Résumé and cover-letter drafts never invent experience. Anything unproven is flagged for you.",
  },
  {
    title: "You stay in control",
    text: "Nothing is submitted, sent, or changed until you approve it.",
  },
];

/** Starting section of the home page: what CareerLaunch does and how to begin. */
export function Welcome() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  function tryDemo() {
    // Loads the fictional demo student "Maya" so the whole workflow can be shown in one click.
    const ok = createProfileStore(browserStorage()).save(demoProfile());
    if (!ok) {
      setFailed(true);
      return;
    }
    router.push("/internships");
  }

  return (
    <section className={styles.hero} aria-labelledby="welcome-heading">
      <p className={styles.eyebrow}>CareerLaunch for college students</p>
      <h1 id="welcome-heading" className={styles.title}>
        Find internships that fit you, and apply with confidence.
      </h1>
      <p className={styles.lead}>
        Tell us about your major, skills, and goals. CareerLaunch ranks real-fit internships, explains every match,
        helps you tailor your résumé truthfully, tracks your deadlines, and prepares you for interviews.
      </p>
      <div className={styles.actions}>
        <Link className="button" href="/profile">
          Get started
        </Link>
        <button type="button" className="button button--secondary" onClick={tryDemo}>
          Try the Maya demo
        </button>
      </div>
      {failed ? (
        <p className={styles.note} role="alert">
          Your browser blocked saving the demo profile. Use Get started instead.
        </p>
      ) : null}
      <ul className={styles.points}>
        {POINTS.map((p) => (
          <li key={p.title} className={styles.point}>
            <span className={styles.pointTitle}>{p.title}</span>
            <span className={styles.pointText}>{p.text}</span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>The demo uses a fictional student and fictional internship listings.</p>
    </section>
  );
}
