// Member 3 (kcarrsdsu): optional extras on top of the shared types.
// Approved in docs/data-definitions.md ("Approved extras") and described in
// section 4 of docs/resume-interview-spec.md. Other workstreams can ignore them.

import type {
  CoverLetterDraft,
  InterviewPlan,
  Internship,
  Qualification,
  ResumeDraft,
} from "@/types";

/** One line of the user's résumé, parsed from UserProfile.resumeText. */
export interface ResumeLine {
  id: string;
  /** 0-based line number in resumeText, so drafts can replace it in place. */
  lineIndex: number;
  section: "header" | "education" | "experience" | "projects" | "skills" | "other";
  heading?: string;
  text: string;
  kind: "heading" | "bullet" | "text";
}

export interface EvidenceRef {
  sourceType: "resume_line" | "profile_field" | "user_confirmation";
  /** ResumeLine id, profile path like "skills[1]" or "experience[3].description", or a flag id. */
  sourceId: string;
  /** Exact source text that supports the claim. */
  quote: string;
}

export type FlagReason =
  | "no_evidence"
  | "metric_placeholder"
  | "scope_escalation"
  | "company_fact_unsourced";

export interface VerificationFlag {
  /** Stable for the same claim and reason, so a resolution survives re-checks. */
  id: string;
  claim: string;
  reason: FlagReason;
  severity: "blocking" | "warning";
  resolution: "pending" | "confirmed_by_user" | "edited" | "removed";
  /** Plain-language explanation shown to the student. */
  message: string;
  /** How to fix it. */
  fix: string;
  /** False when only an edit can fix it (e.g. a placeholder, or a skill the student doesn't have). */
  canConfirm: boolean;
}

export type KeywordAction = "already_present" | "can_add" | "missing_skill";

/** One listing qualification compared with the student's résumé and profile. */
export interface KeywordResult {
  /** Normalized first keyword, e.g. "sql". */
  term: string;
  /** The qualification as written in the listing. */
  displayTerm: string;
  importance: "required" | "preferred";
  qualificationType: Qualification["type"];
  keywords: string[];
  inResume: boolean;
  inProfile: boolean;
  action: KeywordAction;
  /** Where the student's own data shows it (empty when missing). */
  evidence: EvidenceRef[];
  suggestion?: string;
}

export type GeneratedBy = "ai" | "template" | "user";

export interface ResumeDraftRecord extends ResumeDraft {
  version: number;
  generatedBy: GeneratedBy;
  sourceLines: ResumeLine[];
  /** changeEvidence[i] supports changes[i]. */
  changeEvidence: EvidenceRef[][];
  keywordAnalysis: KeywordResult[];
  verificationFlags: VerificationFlag[];
}

export interface CompanyFact {
  text: string;
  sourceField: keyof Internship;
}

export interface CoverLetterDraftRecord extends CoverLetterDraft {
  version: number;
  generatedBy: GeneratedBy;
  tone: "professional" | "enthusiastic" | "concise";
  companyFacts: CompanyFact[];
  placeholders: string[];
  verificationFlags: VerificationFlag[];
}

export interface QuestionDetail {
  /** Same string as in the matching *Questions array. */
  text: string;
  type: "role" | "behavioral" | "technical";
  whyAsked: string;
  relatedRequirement?: string;
  /** Technical question on a skill the student doesn't have yet. */
  isGap?: boolean;
  bankId?: string;
}

export interface StarDetail {
  question: string;
  /** The real experience this talking point is built from. */
  experienceLabel: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  evidence: EvidenceRef[];
}

export interface AnswerFeedback {
  starCoverage: { situation: boolean; task: boolean; action: boolean; result: boolean };
  strengths: string[];
  improvements: string[];
  lengthNote?: string;
  wordCount: number;
  disclaimer: string;
}

export interface PracticeAnswer {
  question: string;
  answerText: string;
  feedback: AnswerFeedback;
  answeredAt: string;
}

export interface PracticeSession {
  id: string;
  startedAt: string;
  answers: PracticeAnswer[];
}

export interface InterviewPlanRecord extends InterviewPlan {
  generatedBy: GeneratedBy;
  companySummaryIsMock: boolean;
  companySummaryDisclaimer: string;
  questionDetails: QuestionDetail[];
  starDetails: StarDetail[];
  practiceSessions: PracticeSession[];
  /** Tip for technical questions on skills the student doesn't have yet. */
  gapAnswerTip: string;
}
