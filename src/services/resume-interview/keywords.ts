// Compare a listing's qualifications with the student's résumé and profile.
// This is about résumé WORDING; overall fit is Member 2's MatchScore.

import type { Internship, Qualification, UserProfile } from "@/types";
import { parseResumeText, profileSources } from "./data";
import { containsTerm, findTermMatch, normalize } from "./text";
import type { EvidenceRef, KeywordResult } from "./types";

function analyzeOne(
  q: Qualification,
  importance: KeywordResult["importance"],
  profile: UserProfile,
): KeywordResult {
  const resumeText = profile.resumeText ?? "";
  const keywords = q.keywords.length ? q.keywords : [q.label];
  const inResume = keywords.some((k) => containsTerm(resumeText, k));

  const evidence: EvidenceRef[] = [];
  for (const source of profileSources(profile)) {
    // Career goals say what the student WANTS to do, not what they've done.
    if (source.sourceId === "careerGoals") continue;
    if (keywords.some((k) => containsTerm(source.quote, k))) evidence.push(source);
  }
  if (inResume) {
    for (const line of parseResumeText(resumeText)) {
      if (keywords.some((k) => containsTerm(line.text, k))) {
        evidence.unshift({ sourceType: "resume_line", sourceId: line.id, quote: line.text });
        break;
      }
    }
  }
  const inProfile = evidence.some((e) => e.sourceType === "profile_field");
  const action = inResume ? "already_present" : inProfile ? "can_add" : "missing_skill";

  return {
    term: normalize(keywords[0]),
    displayTerm: q.label,
    importance,
    qualificationType: q.type,
    keywords,
    inResume,
    inProfile,
    action,
    evidence,
    suggestion: suggestionFor(q, action, importance),
  };
}

function suggestionFor(
  q: Qualification,
  action: KeywordResult["action"],
  importance: KeywordResult["importance"],
): string {
  if (action === "already_present") return "Already in your résumé.";
  if (action === "can_add") return "You have this. The draft adds it, using your own words as proof.";
  if (q.type === "education") {
    return importance === "required"
      ? "Your major isn't listed. Check whether the employer accepts related majors before applying."
      : "Not in your profile. This one is optional.";
  }
  if (!q.trainable) return "Not in your profile, and not quick to learn. It won't be added to your résumé.";
  return importance === "required"
    ? "Not in your profile, so it won't be added. You could learn the basics before applying, then add it to your profile."
    : "Not in your profile. It's optional, so it's fine to apply without it.";
}

export function analyzeKeywords(profile: UserProfile, internship: Internship): KeywordResult[] {
  return [
    ...internship.requiredQualifications.map((q) => analyzeOne(q, "required", profile)),
    ...internship.preferredQualifications.map((q) => analyzeOne(q, "preferred", profile)),
  ];
}

/** Plain-English summary, e.g. "Your résumé already shows 2 of 5 required qualifications." */
export function summarizeKeywords(results: KeywordResult[]): string {
  const required = results.filter((r) => r.importance === "required");
  const present = required.filter((r) => r.action === "already_present").length;
  const canAdd = required.filter((r) => r.action === "can_add").length;
  const missing = required.filter((r) => r.action === "missing_skill").length;
  const parts = [`Your résumé already shows ${present} of ${required.length} required qualifications.`];
  if (canAdd) parts.push(`${canAdd} more ${canAdd === 1 ? "is" : "are"} in your profile and can be added.`);
  if (missing) parts.push(`${missing} ${missing === 1 ? "isn't" : "aren't"} in your material yet.`);
  return parts.join(" ");
}

/** The exact words in the student's data that show a qualification (original casing). */
export function matchedWording(result: KeywordResult): string | undefined {
  // Prefer the student's own skills list ("Excel"), then other profile text, then résumé lines.
  const rank = (e: EvidenceRef) =>
    e.sourceId.startsWith("skills[") ? 0 : e.sourceType === "profile_field" ? 1 : 2;
  const ordered = [...result.evidence].sort((a, b) => rank(a) - rank(b));
  for (const e of ordered) {
    for (const k of result.keywords) {
      const m = findTermMatch(e.quote, k);
      if (m) return m;
    }
  }
  return undefined;
}
