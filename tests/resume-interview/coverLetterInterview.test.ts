// Member 3: cover letter (T11), interview plan (T14) and practice feedback (T13).
import { describe, expect, it } from "vitest";
import {
  buildInterviewPlan,
  editDraft,
  generateCoverLetter,
  getDemoProfile,
  getMockInternships,
  getQuestionBank,
  givePracticeFeedback,
  MissingResumeError,
} from "@/services/resume-interview";

const maya = getDemoProfile();
const internships = getMockInternships("2026-11-06");
const [brightline, harborview, greenleaf] = internships;

describe("generateCoverLetter", () => {
  it("T11: every company fact is found in the listing field it came from", () => {
    for (const internship of internships) {
      const letter = generateCoverLetter(maya, internship);
      expect(letter.companyFacts.length).toBeGreaterThan(0);
      for (const fact of letter.companyFacts) {
        expect(String(internship[fact.sourceField])).toContain(fact.text.replace(/\s*\(fictional\)/, ""));
      }
    }
    expect(generateCoverLetter(maya, greenleaf).content).toContain("Greenleaf Community Health");
  });

  it("only claims skills Maya has, and passes every rule", () => {
    for (const internship of internships) {
      const letter = generateCoverLetter(maya, internship);
      expect(letter.verificationFlags).toEqual([]);
      expect(letter.isAiGenerated).toBe(true);
      expect(letter.content).not.toMatch(/gpa/i);
    }
    expect(generateCoverLetter(maya, harborview).content).not.toMatch(/\bjava\b|kubernetes/i);
    expect(generateCoverLetter(maya, brightline).content).toMatch(/SQL, Python, Tableau and Excel/);
  });

  it("rules still run when the student edits the letter", () => {
    const letter = generateCoverLetter(maya, brightline);
    const edited = editDraft(letter, `${letter.content}\nI led a team of 10.`, { profile: maya });
    expect(edited.version).toBe(2);
    expect(edited.verificationFlags.map((f) => f.claim)).toEqual(expect.arrayContaining(["10", "led"]));
  });

  it("T15: won't write a letter with no résumé or experience", () => {
    expect(() => generateCoverLetter({ ...maya, resumeText: "", experience: [] }, brightline)).toThrow(
      MissingResumeError,
    );
  });
});

describe("buildInterviewPlan", () => {
  it("T14: has enough questions of each kind, tied to the listing", () => {
    const plan = buildInterviewPlan(maya, brightline);
    const requiredLabels = brightline.requiredQualifications.map((q) => q.label);
    const technical = plan.questionDetails.filter((q) => q.type === "technical");

    expect(plan.behavioralQuestions.length).toBeGreaterThanOrEqual(3);
    expect(technical.filter((q) => requiredLabels.includes(q.relatedRequirement!)).length).toBeGreaterThanOrEqual(3);
    expect(plan.roleQuestions.length).toBeGreaterThanOrEqual(2);
    expect(plan.questionsToAsk.length).toBeGreaterThanOrEqual(3);
  });

  it("T14: every STAR talking point is built from one of Maya's real experiences", () => {
    const plan = buildInterviewPlan(maya, brightline);
    const descriptions = maya.experience.map((e) => e.description);
    expect(plan.starDetails.length).toBe(plan.behavioralQuestions.length);
    for (const s of plan.starDetails) {
      expect(s.evidence.length).toBeGreaterThan(0);
      for (const e of s.evidence) expect(descriptions).toContain(e.quote);
      expect(s.result).toMatch(/real numbers only if you know them/);
    }
  });

  it("marks questions on skills Maya lacks as gaps, so she can answer honestly", () => {
    const plan = buildInterviewPlan(maya, harborview);
    const java = plan.questionDetails.find((q) => q.relatedRequirement === "Proficiency in Java");
    expect(java?.isGap).toBe(true);
    expect(plan.gapAnswerTip).toMatch(/Never claim experience you don't have/);
    expect(plan.questionDetails.filter((q) => q.type === "technical" && !q.isGap).length).toBeGreaterThanOrEqual(3);
  });

  it("R6: the company summary uses only the listing and is labeled mock", () => {
    const plan = buildInterviewPlan(maya, brightline);
    expect(plan.companySummary).toContain(brightline.company);
    expect(brightline.description).toContain("Brightline Analytics helps regional retailers understand their sales data.");
    expect(plan.companySummary).toContain("Brightline Analytics helps regional retailers understand their sales data.");
    expect(plan.companySummaryIsMock).toBe(true);
    expect(plan.companySummaryDisclaimer).toMatch(/fictional mock listing/);
  });
});

describe("T13: practice feedback", () => {
  const forbidden = getQuestionBank().feedbackHeuristics.forbiddenInFeedback;
  const answers = [
    "",
    "We did a project.",
    "During my class project I was responsible for the database. I decided to write the queries first, then I built the dashboard. As a result we finished early and I learned how to plan.",
    "I don't know. You will get the job, guaranteed.",
  ];

  it("always shows the disclaimer and never predicts hiring", () => {
    for (const answer of answers) {
      const fb = givePracticeFeedback(answer);
      expect(fb.disclaimer).toBe("Practice feedback only. This does not predict whether you will be hired.");
      const all = [...fb.strengths, ...fb.improvements, fb.lengthNote ?? ""].join(" ").toLowerCase();
      for (const f of forbidden) expect(all).not.toContain(f);
    }
  });

  it("checks STAR coverage and length", () => {
    const full = givePracticeFeedback(answers[2]);
    expect(full.starCoverage).toEqual({ situation: true, task: true, action: true, result: true });
    expect(full.lengthNote).toMatch(/short/);

    const thin = givePracticeFeedback(answers[1]);
    expect(thin.starCoverage.result).toBe(false);
    expect(thin.improvements.some((i) => i.startsWith("Add the Result"))).toBe(true);
  });

  it("asks for an answer when it's empty", () => {
    expect(givePracticeFeedback("   ").improvements).toEqual(["Write an answer first, then ask for feedback."]);
  });
});
