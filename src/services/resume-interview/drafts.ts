// Draft lifecycle: edit, confirm a claim, approve, reject, and export.
// Every function returns a NEW draft object; nothing is changed in place, so
// earlier versions (and the original résumé text) always stay as they were.
//
// Approvals use Member 4's AgentActivityLog: a draft becomes `approved` only
// through an approved ApprovalRequest for that exact draft version (rule R9),
// and copying/downloading needs its own approval (rule R11).

import type { AgentActivityLog } from "@/agents/tracker";
import type { Internship, UserProfile } from "@/types";
import { blockingFlags, claimsToVerify, mergeResolutions, runChecks } from "./checks";
import { placeholdersIn } from "./text";
import type { CoverLetterDraftRecord, KeywordResult, ResumeDraftRecord, VerificationFlag } from "./types";

type AnyDraft = ResumeDraftRecord | CoverLetterDraftRecord;

export class DraftApprovalError extends Error {
  constructor(public readonly issues: string[]) {
    super(`This draft can't be approved yet: ${issues.join(" ")}`);
    this.name = "DraftApprovalError";
  }
}

function isResume(draft: AnyDraft): draft is ResumeDraftRecord {
  return "sourceLines" in draft;
}

/** What still has to be fixed before the student can approve this draft. */
export function blockingIssues(draft: AnyDraft): string[] {
  return blockingFlags(draft.verificationFlags).map((f) => `${f.message} ${f.fix}`);
}

/** Save the student's edit as a new version, re-running every rule on the new text. */
export function editDraft<T extends AnyDraft>(
  draft: T,
  newContent: string,
  ctx: { profile: UserProfile; keywordAnalysis?: KeywordResult[]; now?: Date },
): T {
  const keywordAnalysis = ctx.keywordAnalysis ?? (isResume(draft) ? draft.keywordAnalysis : []);
  const flags = mergeResolutions(
    runChecks(newContent, {
      profile: ctx.profile,
      keywordAnalysis,
      kind: isResume(draft) ? "resume" : "cover_letter",
      sourceLines: isResume(draft) ? draft.sourceLines : undefined,
      ignore: isResume(draft) ? undefined : draft.companyFacts.map((f) => f.text),
    }),
    draft.verificationFlags,
  );
  const timestamp = (ctx.now ?? new Date()).toISOString();
  const base = {
    content: newContent,
    version: draft.version + 1,
    status: "draft" as const,
    generatedBy: "user" as const,
    verificationFlags: flags,
    claimsToVerify: claimsToVerify(flags),
    updatedAt: timestamp,
  };
  if (isResume(draft)) {
    return {
      ...draft,
      ...base,
      changes: [...draft.changes, { after: `Version ${draft.version + 1}`, reason: "You edited the draft." }],
    } as T;
  }
  return { ...draft, ...base, placeholders: placeholdersIn(newContent) } as T;
}

/**
 * The student says a flagged claim is true. It stays labeled "confirmed by
 * student" (not "proven"). Placeholders and skills they don't have can't be
 * confirmed — only fixed by editing.
 */
export function confirmFlag<T extends AnyDraft>(draft: T, flagId: string, now: Date = new Date()): T {
  const target = draft.verificationFlags.find((f) => f.id === flagId);
  if (!target) throw new Error(`No flag with id "${flagId}" on this draft.`);
  if (!target.canConfirm) throw new Error(`${target.message} ${target.fix}`);
  const flags: VerificationFlag[] = draft.verificationFlags.map((f) =>
    f.id === flagId ? { ...f, resolution: "confirmed_by_user" } : f,
  );
  return { ...draft, verificationFlags: flags, claimsToVerify: claimsToVerify(flags), updatedAt: now.toISOString() };
}

export function draftKindLabel(draft: AnyDraft): string {
  return isResume(draft) ? "résumé" : "cover letter";
}

/** Plain-language text for the approval request. */
export function approvalActionText(draft: AnyDraft, internship: Internship): string {
  return `Approve ${draftKindLabel(draft)} draft v${draft.version} for ${internship.title} at ${internship.company}`;
}

export function exportActionText(draft: AnyDraft, internship: Internship): string {
  return `Copy approved ${draftKindLabel(draft)} v${draft.version} for ${internship.title} at ${internship.company} to your clipboard`;
}

/**
 * Mark the draft approved. Throws DraftApprovalError if anything still blocks it,
 * and ApprovalRequiredError (from the tracker) unless the student approved this
 * exact version. Uses the approval up, so it can't be reused.
 */
export async function approveDraft<T extends AnyDraft>(
  draft: T,
  approval: { log: AgentActivityLog; userProfileId: string; requestId: string | undefined },
  now: Date = new Date(),
): Promise<T> {
  if (draft.status !== "draft") throw new DraftApprovalError([`It is already ${draft.status}.`]);
  const issues = blockingIssues(draft);
  if (issues.length) throw new DraftApprovalError(issues);
  return approval.log.runIfApproved(
    approval.userProfileId,
    approval.requestId,
    () => ({ ...draft, status: "approved" as const, updatedAt: now.toISOString() }),
    { relatedVersion: draft.version },
  );
}

/** The student rejected the draft. */
export function rejectDraft<T extends AnyDraft>(draft: T, now: Date = new Date()): T {
  return { ...draft, status: "rejected", updatedAt: now.toISOString() };
}

/** Copy or download an approved draft. Needs its own approved request (rule R11). */
export async function exportDraft<R>(
  draft: AnyDraft,
  approval: { log: AgentActivityLog; userProfileId: string; requestId: string | undefined },
  doExport: (content: string) => R | Promise<R>,
): Promise<R> {
  if (draft.status !== "approved") {
    throw new DraftApprovalError(["Approve the draft before copying or downloading it."]);
  }
  return approval.log.runIfApproved(
    approval.userProfileId,
    approval.requestId,
    () => doExport(draft.content),
    { relatedVersion: draft.version },
  );
}
