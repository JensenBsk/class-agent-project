"use client";

// Member 3 (kcarrsdsu): résumé and cover-letter drafts with review and approval.
// Logic lives in src/services/resume-interview; this file is only the UI.

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentActivityLog } from "@/agents/tracker";
import { AiGeneratedLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";
import {
  approvalActionText,
  approveDraft,
  blockingIssues,
  confirmFlag,
  COVER_LETTER_DISCLAIMER,
  editDraft,
  exportActionText,
  exportDraft,
  generateCoverLetter,
  generateResumeDraft,
  metricSuggestions,
  MissingResumeError,
  RESUME_DISCLAIMER,
  rejectDraft,
  summarizeKeywords,
  type CoverLetterDraftRecord,
  type KeywordResult,
  type ResumeDraftRecord,
  type VerificationFlag,
} from "@/services/resume-interview";
import type { Internship, UserProfile } from "@/types";
import { ApprovalPrompt, InternshipPicker, styles, useDemoContext } from "../_resume-interview/shared";

type AnyDraft = ResumeDraftRecord | CoverLetterDraftRecord;
type Kind = "resume" | "cover";

interface Pending {
  kind: Kind;
  purpose: "approve" | "export";
  requestId: string;
  action: string;
}

interface Notice {
  variant: "success" | "error";
  title: string;
  text?: string;
}

const ACTION_LABEL: Record<KeywordResult["action"], { text: string; className: string }> = {
  already_present: { text: "In your résumé", className: styles.badgeOk },
  can_add: { text: "In your profile — added", className: styles.badgeAdd },
  missing_skill: { text: "Not in your material", className: styles.badgeMissing },
};

const STATUS_LABEL: Record<AnyDraft["status"], string> = {
  draft: "Draft — needs your review",
  approved: "Approved by you",
  rejected: "Rejected",
};

export function DocumentsWorkspace() {
  const ctx = useDemoContext();
  const { profile, internship, ready } = ctx;
  const log = useRef(new AgentActivityLog()).current;
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [resumeVersions, setResumeVersions] = useState<ResumeDraftRecord[]>([]);
  const [coverVersions, setCoverVersions] = useState<CoverLetterDraftRecord[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [missing, setMissing] = useState<string | null>(null);

  const generate = useCallback(
    (forInternship: Internship) => {
      setPending(null);
      setNotice(null);
      try {
        const resume = generateResumeDraft(profile, forInternship);
        const rTask = log.startTask(profile.id, "draft_resume", `Drafted a résumé for ${forInternship.title}`, resume.id);
        log.completeTask(profile.id, rTask.id);
        const cover = generateCoverLetter(profile, forInternship, { keywordAnalysis: resume.keywordAnalysis });
        const cTask = log.startTask(
          profile.id,
          "draft_cover_letter",
          `Drafted a cover letter for ${forInternship.title}`,
          cover.id,
        );
        log.completeTask(profile.id, cTask.id);
        setResumeVersions([resume]);
        setCoverVersions([cover]);
        setMissing(null);
      } catch (err) {
        if (err instanceof MissingResumeError) setMissing(err.message);
        else setNotice({ variant: "error", title: "Something went wrong while drafting. Try again." });
      }
      refresh();
    },
    [log, profile],
  );

  useEffect(() => {
    if (ready) generate(internship);
  }, [ready, internship, generate]);

  const resume = resumeVersions[resumeVersions.length - 1];
  const cover = coverVersions[coverVersions.length - 1];

  if (!ready || (!resume && !missing)) {
    return <StateMessage variant="loading" title="Preparing your drafts…" />;
  }

  // ---- actions ----
  const setLatest = (kind: Kind, next: AnyDraft, asNewVersion: boolean) => {
    const apply = <T extends AnyDraft>(list: T[]) =>
      asNewVersion ? [...list, next as T] : [...list.slice(0, -1), next as T];
    if (kind === "resume") setResumeVersions(apply);
    else setCoverVersions(apply);
  };

  const ask = (kind: Kind, purpose: Pending["purpose"]) => {
    const draft = kind === "resume" ? resume : cover;
    const action = purpose === "approve" ? approvalActionText(draft, internship) : exportActionText(draft, internship);
    const what = `${kind === "resume" ? "résumé" : "cover letter"} (v${draft.version})`;
    const summary = purpose === "approve" ? `Asked you to approve your ${what}` : `Asked you before copying your ${what}`;
    const task = log.startTask(profile.id, kind === "resume" ? "draft_resume" : "draft_cover_letter", summary, draft.id);
    const req = log.requestApproval(profile.id, task.id, action, { relatedId: draft.id, relatedVersion: draft.version });
    setPending({ kind, purpose, requestId: req.id, action });
    setNotice(null);
    refresh();
  };

  const decide = async (approve: boolean) => {
    if (!pending) return;
    const draft = pending.kind === "resume" ? resume : cover;
    const name = pending.kind === "resume" ? "Résumé" : "Cover letter";
    setPending(null);
    if (!approve) {
      log.reject(profile.id, pending.requestId);
      setNotice({ variant: "success", title: "Okay, nothing was done.", text: "You can approve later." });
      refresh();
      return;
    }
    log.approve(profile.id, pending.requestId);
    const approval = { log, userProfileId: profile.id, requestId: pending.requestId };
    try {
      if (pending.purpose === "approve") {
        setLatest(pending.kind, await approveDraft(draft, approval), false);
        setNotice({ variant: "success", title: `${name} approved.`, text: "You can now copy it." });
      } else {
        await exportDraft(draft, approval, (text) => navigator.clipboard.writeText(text));
        setNotice({ variant: "success", title: `${name} copied to your clipboard.` });
      }
    } catch (err) {
      setNotice({
        variant: "error",
        title: pending.purpose === "export" ? "Couldn't copy it." : "Couldn't approve it.",
        text:
          pending.purpose === "export"
            ? "Your browser blocked the clipboard. Select the text and copy it yourself."
            : err instanceof Error
              ? err.message
              : String(err),
      });
    }
    refresh();
  };

  const tasks = log.listTasks(profile.id);

  return (
    <>
      <InternshipPicker ctx={ctx} id="documents-internship" />

      {notice ? (
        <StateMessage variant={notice.variant} title={notice.title}>
          {notice.text}
        </StateMessage>
      ) : null}

      {missing ? (
        <StateMessage variant="empty" title={missing}>
          Drafts are built only from your own material, so there&apos;s nothing to tailor yet.
        </StateMessage>
      ) : (
        <>
          <KeywordCard results={resume.keywordAnalysis} />
          <DraftPanel
            key={`resume-${internship.id}`}
            kind="resume"
            title="Résumé draft"
            disclaimer={RESUME_DISCLAIMER}
            versions={resumeVersions}
            profile={profile}
            pending={pending?.kind === "resume" ? pending : null}
            onAsk={(p) => ask("resume", p)}
            onDecide={decide}
            onChange={(next, asNew) => setLatest("resume", next, asNew)}
          />
          <DraftPanel
            key={`cover-${internship.id}`}
            kind="cover"
            title="Cover letter draft"
            disclaimer={COVER_LETTER_DISCLAIMER}
            versions={coverVersions}
            profile={profile}
            keywordAnalysis={resume.keywordAnalysis}
            pending={pending?.kind === "cover" ? pending : null}
            onAsk={(p) => ask("cover", p)}
            onDecide={decide}
            onChange={(next, asNew) => setLatest("cover", next, asNew)}
          />
        </>
      )}

      <section className="card" aria-labelledby="activity-heading">
        <h2 id="activity-heading">What the assistant did</h2>
        {tasks.length === 0 ? (
          <p className={styles.muted}>Nothing yet.</p>
        ) : (
          <ul className={styles.list}>
            {tasks.map((t) => (
              <li key={t.id} className={styles.small}>
                {t.summary} <span className={styles.muted}>({t.status.replaceAll("_", " ")})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function KeywordCard({ results }: { results: KeywordResult[] }) {
  return (
    <section className="card" aria-labelledby="keywords-heading">
      <h2 id="keywords-heading">What the listing asks for</h2>
      <p>{summarizeKeywords(results)}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Qualification</th>
              <th scope="col">Needed?</th>
              <th scope="col">Your material</th>
              <th scope="col">What happens</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={`${r.importance}-${r.displayTerm}`}>
                <td>{r.displayTerm}</td>
                <td>{r.importance === "required" ? "Required" : "Preferred"}</td>
                <td>
                  <span className={`${styles.badge} ${ACTION_LABEL[r.action].className}`}>
                    {ACTION_LABEL[r.action].text}
                  </span>
                </td>
                <td className={styles.small}>{r.suggestion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`${styles.small} ${styles.muted}`}>
        Skills you don&apos;t have are never added to your drafts.
      </p>
    </section>
  );
}

interface DraftPanelProps {
  kind: Kind;
  title: string;
  disclaimer: string;
  versions: AnyDraft[];
  profile: UserProfile;
  keywordAnalysis?: KeywordResult[];
  pending: Pending | null;
  onAsk: (purpose: Pending["purpose"]) => void;
  onDecide: (approve: boolean) => void;
  onChange: (next: AnyDraft, asNewVersion: boolean) => void;
}

function DraftPanel(props: DraftPanelProps) {
  const { kind, title, disclaimer, versions, profile, pending } = props;
  const draft = versions[versions.length - 1];
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.content);
  const id = `${kind}-draft`;
  const issues = blockingIssues(draft);
  const resume = kind === "resume" ? (draft as ResumeDraftRecord) : null;
  const cover = kind === "cover" ? (draft as CoverLetterDraftRecord) : null;

  const save = (content: string) => {
    props.onChange(editDraft(draft, content, { profile, keywordAnalysis: props.keywordAnalysis }), true);
    setEditing(false);
  };

  return (
    <section className="card" aria-labelledby={`${id}-heading`}>
      <div className={styles.panelHeader}>
        <h2 id={`${id}-heading`}>{title}</h2>
        {draft.isAiGenerated ? <AiGeneratedLabel /> : null}
      </div>
      <p className={styles.small}>
        <strong>{STATUS_LABEL[draft.status]}</strong> · Version {draft.version}
        {draft.generatedBy === "user" ? " (edited by you)" : ""}
      </p>
      <p className={`${styles.small} ${styles.muted}`}>{disclaimer}</p>

      {editing ? (
        <div className={styles.field}>
          <label htmlFor={`${id}-edit`}>Edit your {kind === "resume" ? "résumé" : "cover letter"}</label>
          <textarea
            id={`${id}-edit`}
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={styles.actions}>
            <button type="button" className="button" onClick={() => save(text)}>
              Save as version {draft.version + 1}
            </button>
            <button type="button" className="button button--secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : resume ? (
        <div className={styles.compare}>
          <div>
            <h3 className={styles.small}>Your original résumé</h3>
            <pre className={styles.doc} aria-label="Original résumé text">
              {profile.resumeText}
            </pre>
          </div>
          <div>
            <h3 className={styles.small}>Draft for this internship</h3>
            <pre className={styles.doc} aria-label="Résumé draft text">
              {draft.content}
            </pre>
          </div>
        </div>
      ) : (
        <pre className={styles.doc} aria-label="Cover letter draft text">
          {draft.content}
        </pre>
      )}

      {resume ? <Changes draft={resume} /> : null}
      {cover ? <CompanyFacts draft={cover} /> : null}
      <Flags
        flags={draft.verificationFlags}
        onConfirm={(flagId) => props.onChange(confirmFlag(draft, flagId), false)}
      />
      {resume && draft.status === "draft" && !editing ? (
        <Ideas
          draft={resume}
          onUse={(line, suggestion) => save(draft.content.replace(line, suggestion))}
        />
      ) : null}

      {pending ? (
        <ApprovalPrompt
          action={pending.action}
          onApprove={() => props.onDecide(true)}
          onDecline={() => props.onDecide(false)}
        />
      ) : null}

      {!editing && !pending ? (
        <div className={styles.actions}>
          {draft.status === "draft" ? (
            <>
              <button
                type="button"
                className="button"
                disabled={issues.length > 0}
                aria-describedby={issues.length ? `${id}-blocked` : undefined}
                onClick={() => props.onAsk("approve")}
              >
                Approve draft…
              </button>
              <button type="button" className="button button--secondary" onClick={() => props.onChange(rejectDraft(draft), false)}>
                Reject
              </button>
            </>
          ) : null}
          {draft.status === "approved" ? (
            <button type="button" className="button" onClick={() => props.onAsk("export")}>
              Copy to clipboard…
            </button>
          ) : null}
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setText(draft.content);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      ) : null}
      {issues.length && !editing && draft.status === "draft" ? (
        <p id={`${id}-blocked`} className={`${styles.small} ${styles.muted}`}>
          Fix the items marked “Must fix” before approving.
        </p>
      ) : null}

      {versions.length > 1 ? (
        <details className={styles.details}>
          <summary>Version history ({versions.length})</summary>
          <ul className={styles.list}>
            {versions.map((v) => (
              <li key={`${v.version}-${v.updatedAt}`} className={styles.small}>
                Version {v.version}: {STATUS_LABEL[v.status].toLowerCase()}
                {v.generatedBy === "user" ? ", edited by you" : ", first draft"}
              </li>
            ))}
          </ul>
          <p className={`${styles.small} ${styles.muted}`}>Earlier versions are kept. Your original résumé is never changed.</p>
        </details>
      ) : null}
    </section>
  );
}

function Changes({ draft }: { draft: ResumeDraftRecord }) {
  if (!draft.changes.length) {
    return <p className={styles.muted}>No changes were needed: your résumé already covers what you can show.</p>;
  }
  return (
    <>
      <h3>What changed and why</h3>
      <ul className={styles.plainList}>
        {draft.changes.map((c, i) => (
          <li key={i} className={styles.item}>
            {c.before ? (
              <p className={styles.small}>
                <span className={styles.srOnly}>Before: </span>
                <span className={styles.before}>{c.before}</span>
              </p>
            ) : null}
            <p className={styles.small}>
              <strong>{c.after}</strong>
            </p>
            <p className={styles.small}>{c.reason}</p>
            {draft.changeEvidence[i]?.map((e) => (
              <p key={e.sourceId} className={styles.quote} title={e.sourceId}>
                From your profile: “{e.quote}”
              </p>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}

function CompanyFacts({ draft }: { draft: CoverLetterDraftRecord }) {
  return (
    <>
      <h3>Facts about the company</h3>
      <p className={`${styles.small} ${styles.muted}`}>Taken only from the listing, never made up.</p>
      <ul className={styles.list}>
        {draft.companyFacts.map((f) => (
          <li key={f.text} className={styles.small}>
            “{f.text}” <span className={styles.muted}>(listing: {String(f.sourceField)})</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Flags({ flags, onConfirm }: { flags: VerificationFlag[]; onConfirm: (id: string) => void }) {
  return (
    <>
      <h3>Claims to check</h3>
      {flags.length === 0 ? (
        <StateMessage variant="success" title="Nothing to check">
          Every claim in this draft comes from your own profile or the listing.
        </StateMessage>
      ) : (
        <ul className={styles.plainList}>
          {flags.map((f) => (
            <li key={f.id} className={styles.item}>
              <p>
                <span
                  className={`${styles.badge} ${
                    f.resolution === "confirmed_by_user"
                      ? styles.badgeOk
                      : f.severity === "blocking"
                        ? styles.badgeBlocking
                        : styles.badgeWarning
                  }`}
                >
                  {f.resolution === "confirmed_by_user"
                    ? "Confirmed by student"
                    : f.severity === "blocking"
                      ? "Must fix"
                      : "Check this"}
                </span>{" "}
                {f.resolution === "confirmed_by_user" ? `“${f.claim}”: you confirmed this is true.` : f.message}
              </p>
              {f.resolution === "pending" ? (
                <>
                  <p className={`${styles.small} ${styles.muted}`}>{f.fix}</p>
                  {f.canConfirm ? (
                    <button type="button" className="button button--secondary" onClick={() => onConfirm(f.id)}>
                      This is true
                    </button>
                  ) : null}
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Ideas({ draft, onUse }: { draft: ResumeDraftRecord; onUse: (line: string, suggestion: string) => void }) {
  const ideas = metricSuggestions(draft);
  if (!ideas.length) return null;
  return (
    <details className={styles.details}>
      <summary>Ideas to make bullets stronger</summary>
      <p className={`${styles.small} ${styles.muted}`}>
        Real numbers help, but only add ones you know. Using an idea adds a placeholder you must fill in before
        approving.
      </p>
      <ul className={styles.plainList}>
        {ideas.map((i) => (
          <li key={i.line} className={styles.item}>
            <p className={styles.small}>{i.suggestion}</p>
            <button type="button" className="button button--secondary" onClick={() => onUse(i.line, i.suggestion)}>
              Use this idea
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
