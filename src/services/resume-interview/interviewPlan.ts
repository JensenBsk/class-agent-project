// Interview plan for one internship: company summary (listing only), role,
// behavioral and technical questions, STAR talking points built ONLY from the
// student's real experience, and questions to ask the interviewer.

import type { ExperienceItem, Internship, Qualification, UserProfile } from "@/types";
import { getQuestionBank, type QuestionBank } from "./data";
import { analyzeKeywords } from "./keywords";
import { makeId, monthYear, normalize, sentences, slug, stripEndPunctuation, termVariants } from "./text";
import type { InterviewPlanRecord, KeywordResult, QuestionDetail, StarDetail } from "./types";

export const COMPANY_SUMMARY_DISCLAIMER =
  "Based only on the listing. Check the company's own website before your interview.";

const WORK_MODE_LABEL: Record<Internship["workMode"], string> = {
  remote: "remote",
  hybrid: "hybrid",
  in_person: "in person",
};

/** Which behavioral competencies the listing hints at, in priority order. */
function competenciesFor(internship: Internship): string[] {
  const text = normalize(
    [
      internship.description,
      ...internship.requiredQualifications.map((q) => q.label),
      ...internship.preferredQualifications.map((q) => q.label),
    ].join(" "),
  );
  const hints: [string, RegExp][] = [
    ["teamwork", /team|paired|mentor|collaborat/],
    ["communication", /communicat|present|explain|report/],
    ["customer-focus", /customer|client|patient/],
    ["detail-oriented", /detail|accura|clean/],
    ["time-management", /schedul|coordinat|deadline|hours per week/],
    ["learning", /learn|new|intern/],
  ];
  const picked = hints.filter(([, re]) => re.test(text)).map(([c]) => c);
  for (const fallback of ["teamwork", "learning", "failure", "pressure"]) {
    if (picked.length >= 4) break;
    if (!picked.includes(fallback)) picked.push(fallback);
  }
  return picked.slice(0, 4);
}

/** The student's experience that best fits a competency (always a real one). */
function experienceFor(competency: string, experience: ExperienceItem[]): number {
  const find = (re: RegExp, type?: ExperienceItem["type"]) =>
    experience.findIndex((e) => (!type || e.type === type) && re.test(normalize(`${e.description ?? ""} ${e.title}`)));
  const rules: Record<string, () => number> = {
    teamwork: () => find(/team/),
    "customer-focus": () => find(/customer/),
    leadership: () => find(/train|tutor/),
    communication: () => find(/present|tutor|explain/),
    "detail-oriented": () => find(/count|spreadsheet|database|register/),
    "time-management": () => find(/./, "work"),
    learning: () => find(/./, "project"),
  };
  const i = rules[competency]?.() ?? -1;
  return i >= 0 ? i : 0;
}

function dateRange(e: ExperienceItem): string {
  if (!e.startDate) return "";
  const start = monthYear(e.startDate);
  return e.endDate ? `${start} to ${monthYear(e.endDate)}` : `since ${start}`;
}

function starFor(question: string, index: number, profile: UserProfile): StarDetail | undefined {
  const e = profile.experience[index];
  if (!e) return undefined;
  const dates = dateRange(e);
  const parts = sentences(e.description ?? "");
  const label = `${e.title} at ${e.organization}`;
  return {
    question,
    experienceLabel: label,
    situation: `${label}${dates ? ` (${dates})` : ""}.`,
    task: parts[0]
      ? `Say what you were responsible for. Your profile says: "${stripEndPunctuation(parts[0])}."`
      : "Say what you were responsible for.",
    action:
      parts.length > 1
        ? `Walk through what YOU did, using "I". Start from: "${stripEndPunctuation(parts.slice(1).join(" "))}."`
        : `Walk through what YOU did, step by step, using "I".`,
    result: "Say what changed because of your actions and what you learned. Use real numbers only if you know them.",
    evidence: e.description
      ? [{ sourceType: "profile_field", sourceId: `experience[${index}].description`, quote: e.description }]
      : [{ sourceType: "profile_field", sourceId: `experience[${index}].title`, quote: e.title }],
  };
}

function bankMatchesQualification(skillTag: string, q: Qualification): boolean {
  const tagVariants = termVariants(skillTag);
  return q.keywords.some((k) => {
    const n = normalize(k);
    return slug(k) === skillTag || tagVariants.includes(n) || termVariants(k).includes(skillTag);
  });
}

function technicalQuestions(
  internship: Internship,
  keywordAnalysis: KeywordResult[],
  bank: QuestionBank,
): QuestionDetail[] {
  const out: QuestionDetail[] = [];
  const used = new Set<string>();
  const quals = [...internship.requiredQualifications, ...internship.preferredQualifications].filter(
    (q) => q.type === "skill",
  );
  const take = (q: Qualification, allowRepeat: boolean) => {
    const result = keywordAnalysis.find((r) => r.displayTerm === q.label);
    const candidates = bank.technical.filter((t) => bankMatchesQualification(t.skill, q) && !used.has(t.id));
    const pick = candidates[0];
    if (!pick || (!allowRepeat && out.some((o) => o.relatedRequirement === q.label))) return;
    used.add(pick.id);
    out.push({
      text: pick.text,
      type: "technical",
      whyAsked: pick.whyAsked,
      relatedRequirement: q.label,
      isGap: result?.action === "missing_skill",
      bankId: pick.id,
    });
  };
  for (const q of quals) if (out.length < 6) take(q, false);
  // Make sure there are at least 3 questions on skills the student HAS, so they can show them.
  for (const q of quals) {
    if (out.filter((o) => !o.isGap).length >= 3 || out.length >= 8) break;
    const r = keywordAnalysis.find((x) => x.displayTerm === q.label);
    if (r && r.action !== "missing_skill") take(q, true);
  }
  return out;
}

export function buildInterviewPlan(
  profile: UserProfile,
  internship: Internship,
  options: { now?: Date; bank?: QuestionBank; keywordAnalysis?: KeywordResult[] } = {},
): InterviewPlanRecord {
  const bank = options.bank ?? getQuestionBank();
  const keywordAnalysis = options.keywordAnalysis ?? analyzeKeywords(profile, internship);

  const descriptionSentences = sentences(internship.description).slice(0, 2).join(" ");
  const companySummary = `${internship.company}, ${internship.industry} industry. ${descriptionSentences} Role: ${
    internship.title
  }, ${internship.location}, ${WORK_MODE_LABEL[internship.workMode]}.`;

  const role: QuestionDetail[] = bank.role
    .filter((q) => ["rq-1", "rq-2", "rq-3", "rq-5"].includes(q.id))
    .map((q) => ({ text: q.text, type: "role", whyAsked: q.whyAsked, bankId: q.id }));

  const behavioral: QuestionDetail[] = competenciesFor(internship).flatMap((c) => {
    const q = bank.behavioral.find((b) => b.competency === c);
    return q ? [{ text: q.text, type: "behavioral" as const, whyAsked: q.whyAsked, bankId: q.id }] : [];
  });

  const technical = technicalQuestions(internship, keywordAnalysis, bank);

  const starDetails = behavioral.flatMap((q) => {
    const competency = bank.behavioral.find((b) => b.id === q.bankId)?.competency ?? "";
    const star = starFor(q.text, experienceFor(competency, profile.experience), profile);
    return star ? [star] : [];
  });

  const timestamp = (options.now ?? new Date()).toISOString();
  return {
    id: makeId("ip"),
    createdAt: timestamp,
    updatedAt: timestamp,
    userProfileId: profile.id,
    internshipId: internship.id,
    companySummary,
    roleQuestions: role.map((q) => q.text),
    behavioralQuestions: behavioral.map((q) => q.text),
    technicalQuestions: technical.map((q) => q.text),
    starTalkingPoints: starDetails.map(
      (s) => `${s.question} Use your experience as ${s.experienceLabel}. ${s.task.replace(/^Say what you were responsible for\. /, "")}`,
    ),
    questionsToAsk: bank.questionsToAsk.slice(0, 5),
    generatedBy: "template",
    companySummaryIsMock: internship.isMock,
    companySummaryDisclaimer: internship.isMock
      ? `${COMPANY_SUMMARY_DISCLAIMER} This is a fictional mock listing.`
      : COMPANY_SUMMARY_DISCLAIMER,
    questionDetails: [...role, ...behavioral, ...technical],
    starDetails,
    practiceSessions: [],
    gapAnswerTip: bank.gapAnswerTip,
  };
}
