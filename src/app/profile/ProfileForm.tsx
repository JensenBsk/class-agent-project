"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import {
  browserStorage,
  createProfileStore,
  demoProfile,
  normalizeProfile,
  reviewProfile,
  type ProfileReview,
  type ProfileStore,
} from "@/services/matching/profile";
import { EXPERIENCE_TYPES, type ExperienceType, type RemotePreference, type UserProfile } from "@/types";
import { ConfirmDialog } from "./ConfirmDialog";
import styles from "./profile.module.css";

interface ExperienceRow {
  key: number;
  type: ExperienceType;
  title: string;
  organization: string;
  description: string;
  skills: string;
}

interface FormState {
  name: string;
  school: string;
  major: string;
  graduationDate: string;
  gpa: string;
  skills: string;
  preferredIndustries: string;
  preferredLocations: string;
  remotePreference: RemotePreference;
  availability: string;
  salaryExpectation: string;
  needsSponsorship: "" | "true" | "false";
  authorizedToWork: "" | "true" | "false";
  careerGoals: string;
  resumeText: string;
  portfolioUrl: string;
  experience: ExperienceRow[];
}

const EMPTY: FormState = {
  name: "",
  school: "",
  major: "",
  graduationDate: "",
  gpa: "",
  skills: "",
  preferredIndustries: "",
  preferredLocations: "",
  remotePreference: "no_preference",
  availability: "",
  salaryExpectation: "",
  needsSponsorship: "",
  authorizedToWork: "",
  careerGoals: "",
  resumeText: "",
  portfolioUrl: "",
  experience: [],
};

const REMOTE_LABELS: Record<RemotePreference, string> = {
  no_preference: "No preference",
  remote: "Remote only",
  hybrid: "Hybrid",
  in_person: "In person",
};

let rowKey = 0;
const boolText = (v: boolean | null): "" | "true" | "false" => (v === null ? "" : v ? "true" : "false");

function toForm(p: UserProfile): FormState {
  return {
    name: p.name,
    school: p.school,
    major: p.major,
    graduationDate: p.graduationDate,
    gpa: p.gpa?.toString() ?? "",
    skills: p.skills.join(", "),
    preferredIndustries: p.preferredIndustries.join(", "),
    preferredLocations: p.preferredLocations.join("; "),
    remotePreference: p.remotePreference,
    availability: p.availability,
    salaryExpectation: p.salaryExpectation?.toString() ?? "",
    needsSponsorship: boolText(p.workAuthorization.needsSponsorship),
    authorizedToWork: boolText(p.workAuthorization.authorizedToWork),
    careerGoals: p.careerGoals,
    resumeText: p.resumeText ?? "",
    portfolioUrl: p.portfolioUrl ?? "",
    experience: p.experience.map((e) => ({
      key: ++rowKey,
      type: e.type,
      title: e.title,
      organization: e.organization,
      description: e.description ?? "",
      skills: (e.skills ?? []).join(", "),
    })),
  };
}

function toProfile(f: FormState, existing: UserProfile | null): UserProfile {
  return normalizeProfile({
    ...f,
    id: existing?.id,
    createdAt: existing?.createdAt,
    // Locations are separated by ";" because city names contain commas.
    preferredLocations: f.preferredLocations.split(";"),
    workAuthorization: { needsSponsorship: f.needsSponsorship, authorizedToWork: f.authorizedToWork },
    experience: f.experience,
  });
}

type Pending = "demo" | "delete" | null;
type Status = { kind: "saved" | "restored" | "deleted" | "loaded-demo" | "storage-failed" } | null;

export function ProfileForm() {
  const storeRef = useRef<ProfileStore | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [review, setReview] = useState<ProfileReview | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const store = createProfileStore(browserStorage());
    storeRef.current = store;
    const existing = store.load();
    if (existing) {
      setSaved(existing);
      setForm(toForm(existing));
      setReview(reviewProfile(existing));
    }
    setCanUndo(store.canUndo());
    setHydrated(true);
  }, []);

  const invalid = useMemo(() => new Set(review?.errors.map((e) => e.field)), [review]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (key: number, patch: Partial<ExperienceRow>) =>
    setForm((f) => ({ ...f, experience: f.experience.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  function persist(profile: UserProfile, kind: NonNullable<Status>["kind"]) {
    const store = storeRef.current!;
    const ok = store.save(profile);
    setSaved(profile);
    setReview(reviewProfile(profile));
    setStatus({ kind: ok ? kind : "storage-failed" });
    setCanUndo(store.canUndo());
    requestAnimationFrame(() => messagesRef.current?.scrollIntoView?.({ block: "nearest" }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const profile = toProfile(form, saved);
    const r = reviewProfile(profile);
    if (r.errors.length) {
      setReview(r);
      setStatus(null);
      messagesRef.current?.scrollIntoView?.({ block: "nearest" });
      return;
    }
    persist(profile, "saved");
  }

  function loadDemo() {
    const maya = demoProfile();
    setForm(toForm(maya));
    persist(maya, "loaded-demo");
    setPending(null);
  }

  function undo() {
    const prev = storeRef.current?.undo();
    if (!prev) return;
    setSaved(prev);
    setForm(toForm(prev));
    setReview(reviewProfile(prev));
    setStatus({ kind: "restored" });
    setCanUndo(false);
  }

  function deleteAll() {
    storeRef.current?.reset();
    setSaved(null);
    setForm(EMPTY);
    setReview(null);
    setStatus({ kind: "deleted" });
    setCanUndo(false);
    setPending(null);
  }

  if (!hydrated) {
    return <StateMessage variant="loading" title="Loading your profile…" />;
  }

  const ready = review?.ready && saved;
  const field = (id: keyof FormState, label: string, opts: { required?: boolean; hint?: string; type?: string; placeholder?: string; inputMode?: "decimal" | "text"; autoComplete?: string } = {}) => (
    <div className={styles.field}>
      <label htmlFor={`f-${id}`}>
        {label}
        {opts.required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
      </label>
      {opts.hint ? <p className={styles.hint} id={`f-${id}-hint`}>{opts.hint}</p> : null}
      <input
        id={`f-${id}`}
        className={styles.input}
        type={opts.type ?? "text"}
        value={form[id] as string}
        onChange={(e) => set(id, e.target.value as never)}
        placeholder={opts.placeholder}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete ?? "off"}
        required={opts.required}
        aria-invalid={invalid.has(id as never) || undefined}
        aria-describedby={opts.hint ? `f-${id}-hint` : undefined}
      />
    </div>
  );

  return (
    <>
      <div ref={messagesRef} className={styles.messages} aria-live="polite">
        {status?.kind === "deleted" ? (
          <StateMessage variant="success" title="Your data was deleted from this device." />
        ) : null}
        {status?.kind === "storage-failed" ? (
          <StateMessage variant="error" title="We couldn't save to this browser.">
            Your changes are kept only until you close this page. Private browsing can block saving.
          </StateMessage>
        ) : null}
        {review?.errors.length ? (
          <StateMessage variant="error" title="Please fix these before saving">
            <ul className={styles.list}>{review.errors.map((e) => <li key={e.field}>{e.message}</li>)}</ul>
          </StateMessage>
        ) : null}
        {review && !review.errors.length && review.missing.length ? (
          <StateMessage variant="empty" title="A few questions before we can match you">
            <ul className={styles.list}>{review.missing.map((m) => <li key={m.field}>{m.message}</li>)}</ul>
          </StateMessage>
        ) : null}
        {review?.conflicts.length ? (
          <StateMessage variant="empty" title="Please double-check">
            <ul className={styles.list}>{review.conflicts.map((c) => <li key={c.field}>{c.message}</li>)}</ul>
          </StateMessage>
        ) : null}
        {ready && status && status.kind !== "storage-failed" && status.kind !== "deleted" ? (
          <StateMessage
            variant="success"
            title={status.kind === "loaded-demo" ? "Maya's demo profile is loaded and saved." : status.kind === "restored" ? "Previous version restored." : "Profile saved on this device."}
            action={<Link className="button" href="/internships">See ranked internships</Link>}
          >
            {saved?.id === "mock-profile-maya" ? <MockDataLabel /> : null} Next, we'll rank internships and explain each match.
          </StateMessage>
        ) : null}
      </div>

      <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Your profile">
        <p className={styles.hint}>
          Fields marked <span className={styles.required}>*</span> are needed to find matches. Everything else is optional. Your profile is saved only in this browser.
        </p>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>About you</legend>
          <div className={styles.grid}>
            {field("name", "Name", { required: true, autoComplete: "name" })}
            {field("school", "School")}
            {field("major", "Major", { required: true, placeholder: "e.g. Management Information Systems" })}
            {field("graduationDate", "Expected graduation", { type: "date" })}
            {field("gpa", "GPA (optional)", { inputMode: "decimal", hint: "Never used to rank internships." })}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Skills and experience</legend>
          {field("skills", "Skills", { required: true, hint: "Separate with commas.", placeholder: "Python, SQL, Excel, customer service" })}

          {form.experience.map((row, idx) => (
            <div key={row.key} className={styles.experience} role="group" aria-labelledby={`exp-${row.key}`}>
              <div className={styles.experienceHeader}>
                <h3 id={`exp-${row.key}`}>Experience {idx + 1}</h3>
                <button
                  type="button"
                  className={`button ${styles.danger}`}
                  onClick={() => setForm((f) => ({ ...f, experience: f.experience.filter((r) => r.key !== row.key) }))}
                  aria-label={`Remove experience ${idx + 1}`}
                >
                  Remove
                </button>
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor={`exp-${row.key}-title`}>Title</label>
                  <input id={`exp-${row.key}-title`} className={styles.input} value={row.title} onChange={(e) => setRow(row.key, { title: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label htmlFor={`exp-${row.key}-org`}>Organization</label>
                  <input id={`exp-${row.key}-org`} className={styles.input} value={row.organization} onChange={(e) => setRow(row.key, { organization: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label htmlFor={`exp-${row.key}-type`}>Type</label>
                  <select id={`exp-${row.key}-type`} className={styles.input} value={row.type} onChange={(e) => setRow(row.key, { type: e.target.value as ExperienceType })}>
                    {EXPERIENCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor={`exp-${row.key}-skills`}>Skills used</label>
                  <input id={`exp-${row.key}-skills`} className={styles.input} value={row.skills} onChange={(e) => setRow(row.key, { skills: e.target.value })} />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor={`exp-${row.key}-desc`}>What you did</label>
                <textarea id={`exp-${row.key}-desc`} className={styles.input} value={row.description} onChange={(e) => setRow(row.key, { description: e.target.value })} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              setForm((f) => ({ ...f, experience: [...f.experience, { key: ++rowKey, type: "work", title: "", organization: "", description: "", skills: "" }] }))
            }
          >
            + Add work, volunteer, or project experience
          </button>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Preferences</legend>
          <div className={styles.grid}>
            {field("preferredIndustries", "Preferred industries", { placeholder: "Technology, Healthcare" })}
            {field("preferredLocations", "Preferred cities", { hint: "Separate cities with semicolons.", placeholder: "San Diego, CA; Los Angeles, CA" })}
            <div className={styles.field}>
              <label htmlFor="f-remotePreference">
                Work style<span className={styles.required} aria-hidden="true"> *</span>
              </label>
              <select id="f-remotePreference" className={styles.input} value={form.remotePreference} onChange={(e) => set("remotePreference", e.target.value as RemotePreference)}>
                {(Object.keys(REMOTE_LABELS) as RemotePreference[]).map((k) => (
                  <option key={k} value={k}>
                    {REMOTE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            {field("salaryExpectation", "Minimum pay ($/hour)", { inputMode: "decimal" })}
            {field("availability", "Availability", { placeholder: "Summer 2027, full-time" })}
            <div className={styles.field}>
              <label htmlFor="f-needsSponsorship">
                Need visa sponsorship?<span className={styles.required} aria-hidden="true"> *</span>
              </label>
              <p className={styles.hint} id="f-needsSponsorship-hint">Used only to flag listings you may not be eligible for.</p>
              <select
                id="f-needsSponsorship"
                className={styles.input}
                value={form.needsSponsorship}
                onChange={(e) => set("needsSponsorship", e.target.value as FormState["needsSponsorship"])}
                aria-describedby="f-needsSponsorship-hint"
              >
                <option value="">Choose…</option>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="f-authorizedToWork">Authorized to work in the US?</label>
              <select id="f-authorizedToWork" className={styles.input} value={form.authorizedToWork} onChange={(e) => set("authorizedToWork", e.target.value as FormState["authorizedToWork"])}>
                <option value="">Prefer not to say</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="f-careerGoals">Career goals</label>
            <textarea id="f-careerGoals" className={styles.input} value={form.careerGoals} onChange={(e) => set("careerGoals", e.target.value)} />
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Résumé (optional)</legend>
          <div className={styles.field}>
            <label htmlFor="f-resumeText">Paste your résumé</label>
            <p className={styles.hint} id="f-resumeText-hint">The Résumé &amp; cover letter step uses this. It's never changed without your approval.</p>
            <textarea id="f-resumeText" className={styles.input} rows={6} value={form.resumeText} onChange={(e) => set("resumeText", e.target.value)} aria-describedby="f-resumeText-hint" />
          </div>
          {field("portfolioUrl", "Portfolio link", { type: "url", placeholder: "https://" })}
        </fieldset>

        <div className={styles.actions}>
          <button type="submit" className="button">
            Save profile
          </button>
          <button type="button" className="button button--secondary" onClick={() => (saved ? setPending("demo") : loadDemo())}>
            Load Maya demo profile
          </button>
          <button type="button" className="button button--secondary" onClick={undo} disabled={!canUndo}>
            Undo last change
          </button>
          <button type="button" className={`button ${styles.danger}`} onClick={() => setPending("delete")} disabled={!saved}>
            Delete my data
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={pending === "demo"}
        title="Replace your profile?"
        message="This replaces your current profile with Maya's demo profile. You can undo this once."
        confirmLabel="Replace with demo"
        onConfirm={loadDemo}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "delete"}
        title="Delete your data?"
        message="This deletes your profile, its saved undo copy, and your selected internship from this device. It can't be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={deleteAll}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
