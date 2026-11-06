// Template résumé generator (no AI key needed, fully testable).
// It only ever reuses the student's own words: it adds skills they already
// listed and swaps weak bullets for their own experience descriptions.
// An AI model can replace this later behind the same function signature.

import type { DraftChange, ExperienceItem, Internship, UserProfile } from "@/types";
import { claimsToVerify, runChecks } from "./checks";
import { parseResumeText } from "./data";
import { analyzeKeywords, matchedWording } from "./keywords";
import { containsTerm, makeId, normalize, numbersIn, sentences, stripEndPunctuation } from "./text";
import type { EvidenceRef, KeywordResult, ResumeDraftRecord, ResumeLine } from "./types";

export const RESUME_DISCLAIMER = "AI-generated draft. Review every line before using it.";

export class MissingResumeError extends Error {
  constructor(message = "Add your résumé or experiences to get a tailored draft.") {
    super(message);
    this.name = "MissingResumeError";
  }
}

const STOP_WORDS = new Set(["the", "and", "of", "a", "an", "at", "in", "for", "with", "to", "on", "part", "time"]);

function words(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Find the profile experience a résumé heading describes (by shared words in title/organization). */
export function experienceForHeading(
  heading: string | undefined,
  experience: ExperienceItem[],
): { item: ExperienceItem; index: number } | undefined {
  if (!heading) return undefined;
  const h = words(heading);
  let best: { item: ExperienceItem; index: number; score: number } | undefined;
  experience.forEach((item, index) => {
    const w = words(`${item.title} ${item.organization}`);
    const score = [...w].filter((x) => h.has(x)).length;
    if (score >= 2 && (!best || score > best.score)) best = { item, index, score };
  });
  return best && { item: best.item, index: best.index };
}

interface Edit {
  lineIndex: number;
  before: string;
  after: string;
  reason: string;
  evidence: EvidenceRef[];
}

/** Add skills the student listed (but the résumé doesn't) to the Skills line. */
function skillsEdit(lines: ResumeLine[], canAdd: KeywordResult[]): Edit | undefined {
  const skillsLine = lines.find((l) => l.section === "skills" && l.kind !== "heading");
  const toAdd = canAdd.filter((r) => r.qualificationType === "skill");
  if (!skillsLine || toAdd.length === 0) return undefined;

  const added: string[] = [];
  const evidence: EvidenceRef[] = [];
  for (const r of toAdd) {
    const wording = matchedWording(r);
    if (!wording || added.some((a) => normalize(a) === normalize(wording))) continue;
    if (containsTerm(skillsLine.text, wording)) continue;
    added.push(wording);
    evidence.push(r.evidence.find((e) => e.sourceType === "profile_field") ?? r.evidence[0]);
  }
  if (!added.length) return undefined;

  return {
    lineIndex: skillsLine.lineIndex,
    before: skillsLine.text,
    after: `${skillsLine.text}, ${added.join(", ")}`,
    reason: `Added ${added.join(" and ")}: the listing asks for ${added.length === 1 ? "it" : "them"}, and your profile shows you have ${added.length === 1 ? "it" : "them"}.`,
    evidence,
  };
}

/** Replace a weak bullet with the student's own, more specific description from their profile. */
function bulletEdits(lines: ResumeLine[], profile: UserProfile, canAdd: KeywordResult[]): Edit[] {
  const edits: Edit[] = [];
  const usedExperience = new Set<number>();
  for (const line of lines) {
    if (line.kind !== "bullet" || line.section === "skills") continue;
    const match = experienceForHeading(line.heading, profile.experience);
    if (!match || usedExperience.has(match.index) || !match.item.description) continue;

    // Keywords the listing wants that this experience's description shows but the bullet doesn't.
    const shown = canAdd.filter(
      (r) =>
        r.keywords.some((k) => containsTerm(match.item.description!, k)) &&
        !r.keywords.some((k) => containsTerm(line.text, k)),
    );
    if (!shown.length) continue;

    const picked = sentences(match.item.description).filter((s) =>
      shown.some((r) => r.keywords.some((k) => containsTerm(s, k))),
    );
    if (!picked.length) continue;
    const after = picked.map(stripEndPunctuation).join("; ");
    usedExperience.add(match.index);
    edits.push({
      lineIndex: line.lineIndex,
      before: line.text,
      after,
      reason: `Uses your own description of ${match.item.title} so the résumé shows ${shown
        .map((r) => r.displayTerm.replace(/\.$/, ""))
        .join("; ")}.`,
      evidence: [
        {
          sourceType: "profile_field",
          sourceId: `experience[${match.index}].description`,
          quote: match.item.description,
        },
      ],
    });
  }
  return edits;
}

export interface GenerateOptions {
  now?: Date;
}

export function generateResumeDraft(
  profile: UserProfile,
  internship: Internship,
  options: GenerateOptions = {},
): ResumeDraftRecord {
  const sourceLines = parseResumeText(profile.resumeText);
  if (sourceLines.length === 0) {
    throw new MissingResumeError(
      profile.experience.length
        ? "Paste your résumé text on the Profile page to get a tailored résumé draft."
        : undefined,
    );
  }

  const keywordAnalysis = analyzeKeywords(profile, internship);
  const canAdd = keywordAnalysis.filter((r) => r.action === "can_add");

  const edits = [...bulletEdits(sourceLines, profile, canAdd)];
  const skills = skillsEdit(sourceLines, canAdd);
  if (skills) edits.push(skills);
  edits.sort((a, b) => a.lineIndex - b.lineIndex);

  // Apply edits to a COPY of the original text, keeping bullets and layout.
  const outLines = (profile.resumeText ?? "").split("\n");
  for (const e of edits) outLines[e.lineIndex] = outLines[e.lineIndex].replace(e.before, e.after);
  const content = outLines.join("\n");

  const changes: DraftChange[] = edits.map((e) => ({ before: e.before, after: e.after, reason: e.reason }));
  const verificationFlags = runChecks(content, { profile, keywordAnalysis, kind: "resume", sourceLines });
  const timestamp = (options.now ?? new Date()).toISOString();

  return {
    id: makeId("rd"),
    createdAt: timestamp,
    updatedAt: timestamp,
    userProfileId: profile.id,
    internshipId: internship.id,
    content,
    changes,
    missingKeywords: keywordAnalysis.filter((r) => r.action === "missing_skill").map((r) => r.term),
    claimsToVerify: claimsToVerify(verificationFlags),
    status: "draft",
    isAiGenerated: true,
    version: 1,
    generatedBy: "template",
    sourceLines,
    changeEvidence: edits.map((e) => e.evidence),
    keywordAnalysis,
    verificationFlags,
  };
}

/**
 * Idea for a stronger bullet that needs a number the student didn't give.
 * Never invents the number: it inserts a placeholder, which blocks approval
 * until the student fills it in or removes it (rule R4).
 */
export function suggestMetric(line: string): string | undefined {
  if (numbersIn(line).length) return undefined;
  return `${stripEndPunctuation(line)} ([X] — add a real number, such as how many or how often)`;
}

/** Bullets that could be stronger with a real number, with a suggested rewrite. */
export function metricSuggestions(draft: ResumeDraftRecord, limit = 3): { line: string; suggestion: string }[] {
  const experienceBullets = new Set(
    draft.sourceLines.filter((l) => l.section === "experience" && l.kind === "bullet").map((l) => l.text),
  );
  return draft.content
    .split("\n")
    .filter((l) => /^-\s/.test(l.trim()))
    .map((l) => l.trim().replace(/^-\s+/, ""))
    .filter((l) => experienceBullets.has(l) && !/\[[^\]]*\]/.test(l))
    .flatMap((line) => {
      const suggestion = suggestMetric(line);
      return suggestion ? [{ line, suggestion }] : [];
    })
    .slice(-limit);
}

