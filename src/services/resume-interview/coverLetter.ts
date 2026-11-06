// Template cover-letter generator. Company facts come ONLY from the listing
// (rule R6); claims about the student come only from their profile (rule R1).

import type { ExperienceItem, Internship, UserProfile } from "@/types";
import { claimsToVerify, runChecks } from "./checks";
import { analyzeKeywords, matchedWording } from "./keywords";
import { containsTerm, lowerFirst, makeId, monthYear, sentences, stripEndPunctuation } from "./text";
import type { CompanyFact, CoverLetterDraftRecord, KeywordResult } from "./types";
import { MissingResumeError } from "./resumeDraft";

export const COVER_LETTER_DISCLAIMER = "AI-generated draft. Review every line before using it.";

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The company name without the "(fictional)" mock marker. */
function companyName(internship: Internship): string {
  return internship.company.replace(/\s*\(fictional\)\s*/i, "").trim();
}

export function generateCoverLetter(
  profile: UserProfile,
  internship: Internship,
  options: { now?: Date; keywordAnalysis?: KeywordResult[] } = {},
): CoverLetterDraftRecord {
  if (!profile.experience.length && !profile.resumeText?.trim()) throw new MissingResumeError();

  const keywordAnalysis = options.keywordAnalysis ?? analyzeKeywords(profile, internship);
  const company = companyName(internship);
  const companyFacts: CompanyFact[] = [
    { text: company, sourceField: "company" },
    { text: internship.title, sourceField: "title" },
  ];

  // Opening: facts from the profile and the listing.
  const opening = `I'm a ${profile.major} student at ${profile.school}, graduating in ${monthYear(
    profile.graduationDate,
  )}, and I'm applying for the ${internship.title} role at ${company}.`;

  // Why this role: the listing's own first sentence + the student's stated goal.
  const firstSentence = sentences(internship.description)[0];
  let whyRole = "";
  if (firstSentence) {
    companyFacts.push({ text: firstSentence, sourceField: "description" });
    whyRole = `Your listing says: "${firstSentence}" `;
  }
  if (profile.careerGoals) whyRole += `That fits my goal to ${lowerFirst(stripEndPunctuation(profile.careerGoals))}.`;

  // Evidence: required skills the student really has, and where they used them.
  const shown = keywordAnalysis.filter(
    (r) => r.importance === "required" && r.qualificationType === "skill" && r.action !== "missing_skill",
  );
  const skillWords = [...new Set(shown.map((r) => matchedWording(r)).filter((w): w is string => !!w))];
  const evidenceParts: string[] = [];
  if (skillWords.length) evidenceParts.push(`The role asks for ${listJoin(skillWords)}, and I've used each of them.`);
  // The (up to) two experiences that show the most required skills.
  const hits = (e: ExperienceItem) =>
    shown.filter((r) => r.keywords.some((k) => containsTerm(e.description ?? "", k))).length;
  const relevant = profile.experience
    .filter((e) => e.description && hits(e) > 0)
    .sort((a, b) => hits(b) - hits(a))
    .slice(0, 2);
  if (!relevant.length && profile.experience[0]?.description) relevant.push(profile.experience[0]);
  for (const e of relevant) {
    const org = e.organization.replace(/\s*\([^)]*\)/g, "").trim();
    evidenceParts.push(`${e.title} (${org}): ${stripEndPunctuation(e.description!)}.`);
  }

  const availability = profile.availability ? ` I'm available ${stripEndPunctuation(profile.availability)}.` : "";
  const closing = `Thank you for considering my application.${availability} I'd welcome the chance to talk about how I can help your team.`;

  const content = [
    "Dear Hiring Manager,",
    opening,
    whyRole.trim(),
    evidenceParts.join(" "),
    closing,
    `Sincerely,\n${profile.name}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const verificationFlags = runChecks(content, {
    profile,
    keywordAnalysis,
    kind: "cover_letter",
    ignore: companyFacts.map((f) => f.text),
  });
  const timestamp = (options.now ?? new Date()).toISOString();

  return {
    id: makeId("cl"),
    createdAt: timestamp,
    updatedAt: timestamp,
    userProfileId: profile.id,
    internshipId: internship.id,
    content,
    claimsToVerify: claimsToVerify(verificationFlags),
    status: "draft",
    isAiGenerated: true,
    version: 1,
    generatedBy: "template",
    tone: "professional",
    companyFacts,
    placeholders: [],
    verificationFlags,
  };
}
