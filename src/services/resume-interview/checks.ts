// The no-fabrication rules (docs/resume-interview-spec.md section 6).
// They run on the draft TEXT, so they also catch problems the student or an
// AI model introduces while editing, not only what the template wrote.

import type { UserProfile } from "@/types";
import { allSourceText } from "./data";
import { containsTerm, findTermMatch, numbersIn, placeholdersIn, slug } from "./text";
import type { KeywordResult, ResumeLine, VerificationFlag } from "./types";

/** Words that claim more responsibility than "helped" or "assisted" (rule R5). */
export const ESCALATION_WORDS = [
  "led",
  "lead",
  "managed",
  "manage",
  "directed",
  "headed",
  "spearheaded",
  "supervised",
  "oversaw",
  "owned",
  "founded",
] as const;

export interface CheckContext {
  profile: UserProfile;
  keywordAnalysis: KeywordResult[];
  kind: "resume" | "cover_letter";
  /** Parsed original résumé (résumé drafts only). */
  sourceLines?: ResumeLine[];
  /** Text quoted from the listing (company facts). It's the employer's words, not a claim by the student. */
  ignore?: string[];
}

function flag(
  reason: VerificationFlag["reason"],
  claim: string,
  severity: VerificationFlag["severity"],
  message: string,
  fix: string,
  canConfirm: boolean,
): VerificationFlag {
  return {
    id: `vf-${reason}-${slug(claim)}`,
    claim,
    reason,
    severity,
    resolution: "pending",
    message,
    fix,
    canConfirm,
  };
}

export function runChecks(fullContent: string, ctx: CheckContext): VerificationFlag[] {
  const flags: VerificationFlag[] = [];
  let content = fullContent;
  for (const quoted of ctx.ignore ?? []) content = content.split(quoted).join(" ");
  const source = allSourceText(ctx.profile);

  // R3: never claim a qualification the student doesn't have.
  for (const r of ctx.keywordAnalysis) {
    if (r.action !== "missing_skill") continue;
    for (const k of r.keywords) {
      const hit = findTermMatch(content, k);
      if (hit) {
        flags.push(
          flag(
            "no_evidence",
            hit,
            "blocking",
            `"${hit}" isn't in your profile or résumé, so the draft can't claim it.`,
            "Remove it. If you really have this skill, add it to your profile first.",
            false,
          ),
        );
        break;
      }
    }
  }

  // R4: placeholders must be filled with real information.
  for (const p of new Set(placeholdersIn(content))) {
    flags.push(
      flag(
        "metric_placeholder",
        p,
        "blocking",
        `${p} is a placeholder.`,
        "Replace it with a real number you know, or delete it.",
        false,
      ),
    );
  }

  // R4: no numbers that aren't in the student's own material.
  // ISO dates in profile fields (e.g. "2028-05-15") only vouch for the year.
  const known = new Set(numbersIn(source.replace(/\b(\d{4})-\d{2}-\d{2}\b/g, "$1")));
  for (const n of new Set(numbersIn(content.replace(/\[[^\]\n]*\]/g, "")))) {
    if (!known.has(n)) {
      flags.push(
        flag(
          "no_evidence",
          n,
          "blocking",
          `The number "${n}" isn't in your profile or résumé.`,
          "Check it's true. Confirm it, or change it.",
          true,
        ),
      );
    }
  }

  // R5: don't raise the level of responsibility without confirmation.
  for (const word of ESCALATION_WORDS) {
    if (containsTerm(content, word) && !containsTerm(source, word)) {
      flags.push(
        flag(
          "scope_escalation",
          word,
          "warning",
          `"${word}" claims more responsibility than your own description does.`,
          "Keep it only if it's accurate. Otherwise use your original wording (for example, \"helped\").",
          true,
        ),
      );
    }
  }

  // R7: GPA only when the student chose to share it.
  if (ctx.profile.gpa === undefined && /\bgpa\b/i.test(content)) {
    flags.push(
      flag(
        "no_evidence",
        "GPA",
        "blocking",
        "You didn't choose to share a GPA, so the draft can't include one.",
        "Remove it, or add your GPA to your profile first.",
        false,
      ),
    );
  }

  // R2: role, employer and date lines must match the original résumé.
  if (ctx.kind === "resume" && ctx.sourceLines) {
    const headings = new Set(ctx.sourceLines.filter((l) => l.kind === "heading").map((l) => l.text));
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || /^[-•*]\s/.test(line) || !/\s[—–]\s/.test(line)) continue;
      if (!headings.has(line)) {
        flags.push(
          flag(
            "no_evidence",
            line,
            "blocking",
            "This role, employer or date line doesn't match your original résumé.",
            "Check the title, organization and dates are exactly right, then confirm.",
            true,
          ),
        );
      }
    }
  }

  return flags;
}

/** Keep earlier decisions (e.g. "confirmed by student") for flags that are still present. */
export function mergeResolutions(
  next: VerificationFlag[],
  previous: VerificationFlag[] = [],
): VerificationFlag[] {
  const before = new Map(previous.map((f) => [f.id, f]));
  return next.map((f) => {
    const old = before.get(f.id);
    return old && old.resolution === "confirmed_by_user" && f.canConfirm ? { ...f, resolution: old.resolution } : f;
  });
}

export function pendingFlags(flags: VerificationFlag[]): VerificationFlag[] {
  return flags.filter((f) => f.resolution === "pending");
}

/** Pending blocking flags: while any exist, the draft can't be approved (rule R9). */
export function blockingFlags(flags: VerificationFlag[]): VerificationFlag[] {
  return flags.filter((f) => f.severity === "blocking" && f.resolution === "pending");
}

/** The shared `claimsToVerify` field: the claim of every flag still pending. */
export function claimsToVerify(flags: VerificationFlag[]): string[] {
  return pendingFlags(flags).map((f) => f.claim);
}
