"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StateMessage } from "@/components/StateMessage";
import { createInternshipService, type InternshipFilters, type InternshipService } from "@/services/matching/internships";
import { rankInternships, type RankedInternship } from "@/services/matching/match";
import {
  INTERNSHIP_SELECTED_EVENT,
  STORAGE_KEYS,
  browserStorage,
  createProfileStore,
  reviewProfile,
  type KeyValueStorage,
} from "@/services/matching/profile";
import { WORK_MODES, type UserProfile, type WorkMode } from "@/types";
import { MatchCard } from "./MatchCard";
import styles from "./internships.module.css";

type Phase =
  | { kind: "loading" }
  | { kind: "no-profile" }
  | { kind: "incomplete"; questions: number }
  | { kind: "error" }
  | { kind: "ready"; ranked: RankedInternship[]; duplicatesRemoved: number };

const MODE_TEXT: Record<WorkMode, string> = { remote: "Remote", hybrid: "Hybrid", in_person: "In person" };
const EMPTY_FILTERS: Required<Omit<InternshipFilters, "location">> = { query: "", industry: "", workMode: "", paidOnly: false, includeExpired: false };

interface InternshipsViewProps {
  /** Injected in tests; defaults to the mock data service. */
  service?: InternshipService;
}

export function InternshipsView({ service: injected }: InternshipsViewProps) {
  const service = useMemo(() => injected ?? createInternshipService(), [injected]);
  const storageRef = useRef<KeyValueStorage | null>(null);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // Load the saved profile and selection once, in the browser.
  useEffect(() => {
    const storage = browserStorage();
    storageRef.current = storage;
    const p = createProfileStore(storage).load();
    setProfile(p);
    try {
      setSelectedId(storage.getItem(STORAGE_KEYS.selectedInternshipId));
    } catch {
      /* ignore */
    }
    if (!p) setPhase({ kind: "no-profile" });
  }, []);

  useEffect(() => {
    service.listIndustries().then(setIndustries, () => setIndustries([]));
  }, [service, retry]);

  // Search and rank whenever the profile or filters change.
  useEffect(() => {
    if (!profile) return;
    const review = reviewProfile(profile);
    if (!review.ready) {
      setPhase({ kind: "incomplete", questions: review.missing.length + review.errors.length });
      return;
    }
    let cancelled = false;
    setPhase((prev) => (prev.kind === "ready" ? prev : { kind: "loading" }));
    service
      .search(filters)
      .then(({ internships, duplicatesRemoved }) => {
        if (!cancelled) setPhase({ kind: "ready", ranked: rankInternships(profile, internships), duplicatesRemoved });
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setPhase({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [profile, filters, service, retry]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    try {
      storageRef.current?.setItem(STORAGE_KEYS.selectedInternshipId, id);
    } catch {
      /* selection still works for this page view */
    }
    window.dispatchEvent(new CustomEvent(INTERNSHIP_SELECTED_EVENT, { detail: { internshipId: id } }));
  }, []);

  const set = <K extends keyof typeof EMPTY_FILTERS>(key: K, value: (typeof EMPTY_FILTERS)[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  if (phase.kind === "loading" && profile === undefined) {
    return <StateMessage variant="loading" title="Loading internships…" />;
  }
  if (phase.kind === "no-profile") {
    return (
      <StateMessage variant="empty" title="Create your profile first" action={<Link className="button" href="/profile">Create profile</Link>}>
        We rank internships using your major, skills, experience, and preferences.
      </StateMessage>
    );
  }
  if (phase.kind === "incomplete") {
    return (
      <StateMessage variant="empty" title="Your profile needs a few more answers" action={<Link className="button" href="/profile">Finish profile</Link>}>
        Answer {phase.questions} more question(s) on your profile so we can rank internships for you.
      </StateMessage>
    );
  }

  const ranked = phase.kind === "ready" ? phase.ranked : [];
  const selected = ranked.find((r) => r.internship.id === selectedId) ?? null;
  const top = ranked.find((r) => r.match.eligibility.status === "eligible") ?? null;

  return (
    <>
      <section className="card" aria-labelledby="next-action-heading">
        <h2 id="next-action-heading">Next action</h2>
        {selected ? (
          <StateMessage
            variant="success"
            title={`You selected ${selected.internship.title} at ${selected.internship.company}`}
            action={
              <Link className="button" href="/documents">
                Tailor résumé and cover letter
              </Link>
            }
          >
            {selected.match.nextSteps[0]} Selecting doesn't apply anywhere. It only picks this role for the next steps, and you can save it in the{" "}
            <Link href="/tracker">tracker</Link> when you're ready.
          </StateMessage>
        ) : top ? (
          <StateMessage variant="empty" title={`Start with your top match: ${top.internship.title} (${top.match.score}/100)`}>
            Read why each role matches, then select one internship to continue.
          </StateMessage>
        ) : phase.kind === "ready" ? (
          <StateMessage variant="empty" title="No eligible matches with these filters">
            Try clearing filters or widening your preferences on your profile.
          </StateMessage>
        ) : null}
      </section>

      <section className="card" aria-labelledby="filters-heading">
        <h2 id="filters-heading">Filter</h2>
        <div className={styles.filters} role="search">
          <label className={styles.field}>
            Search
            <input className={styles.input} type="search" value={filters.query} placeholder="e.g. data, dashboards" onChange={(e) => set("query", e.target.value)} />
          </label>
          <label className={styles.field}>
            Industry
            <select className={styles.input} value={filters.industry} onChange={(e) => set("industry", e.target.value)}>
              <option value="">All industries</option>
              {industries.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Work mode
            <select className={styles.input} value={filters.workMode} onChange={(e) => set("workMode", e.target.value as WorkMode | "")}>
              <option value="">All work modes</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_TEXT[m]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={filters.paidOnly} onChange={(e) => set("paidOnly", e.target.checked)} /> Paid only
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={filters.includeExpired} onChange={(e) => set("includeExpired", e.target.checked)} /> Show expired
          </label>
        </div>
        <p className={styles.meta} role="status">
          {phase.kind === "ready"
            ? `${ranked.length} listing(s) from the ${service.isMock ? "mock (fictional) " : ""}dataset, ranked for ${profile?.name || "you"}.${phase.duplicatesRemoved ? ` ${phase.duplicatesRemoved} duplicate listing(s) hidden.` : ""}`
            : ""}
        </p>
      </section>

      {phase.kind === "loading" ? <StateMessage variant="loading" title="Ranking internships…" /> : null}

      {phase.kind === "error" ? (
        <StateMessage
          variant="error"
          title="We couldn't load internships right now."
          action={
            <button type="button" className="button" onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
          }
        >
          Your profile is safe. Please try again in a moment.
        </StateMessage>
      ) : null}

      {phase.kind === "ready" && ranked.length === 0 ? (
        <StateMessage
          variant="empty"
          title="No internships match these filters"
          action={
            filtersActive ? (
              <button type="button" className="button button--secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
            ) : undefined
          }
        >
          Try a different search or turn off &quot;Paid only&quot;.
        </StateMessage>
      ) : null}

      {ranked.length ? (
        <ol className={styles.list} aria-label="Ranked internships, best match first">
          {ranked.map((item) => (
            <li key={item.internship.id}>
              <MatchCard item={item} selected={item.internship.id === selectedId} onSelect={select} />
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
