/**
 * Shared CareerLaunch data types.
 *
 * Source of truth: docs/data-definitions.md (owned by Member 1).
 * If you need to change a field, propose it in HANDOFF.md -> Decisions first,
 * because every workstream imports these types.
 *
 * Conventions:
 *  - ISODate      = "YYYY-MM-DD"
 *  - ISOTimestamp = full ISO 8601, e.g. "2026-11-06T03:12:01Z"
 *  - Every object has id, createdAt, updatedAt (see BaseRecord).
 */

export type ISODate = string;
export type ISOTimestamp = string;

export interface BaseRecord {
  id: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// UserProfile (Member 2)
// Never add protected characteristics (race, gender, age, religion, disability).
// ---------------------------------------------------------------------------

export const REMOTE_PREFERENCES = ["remote", "in_person", "hybrid", "no_preference"] as const;
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];

export const EXPERIENCE_TYPES = ["work", "volunteer", "project"] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export interface ExperienceItem {
  type: ExperienceType;
  title: string;
  organization: string;
  startDate?: ISODate;
  endDate?: ISODate;
  description?: string;
  skills?: string[];
}

/** Each value is null if the user hasn't answered. */
export interface WorkAuthorization {
  authorizedToWork: boolean | null;
  needsSponsorship: boolean | null;
}

export interface UserProfile extends BaseRecord {
  name: string;
  school: string;
  major: string;
  graduationDate: ISODate;
  /** Only if the user chooses to share it. */
  gpa?: number;
  skills: string[];
  experience: ExperienceItem[];
  preferredIndustries: string[];
  preferredLocations: string[];
  remotePreference: RemotePreference;
  /** e.g. "Summer 2027, full-time" */
  availability: string;
  /** Lowest acceptable hourly pay, in USD. */
  salaryExpectation?: number;
  /** Used only to check a listing's stated requirement. */
  workAuthorization: WorkAuthorization;
  careerGoals: string;
  resumeText?: string;
  portfolioUrl?: string;
}

// ---------------------------------------------------------------------------
// Internship (Member 2)
// ---------------------------------------------------------------------------

export const WORK_MODES = ["remote", "in_person", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export interface Compensation {
  hourlyMin?: number;
  hourlyMax?: number;
  note: string;
}

export const QUALIFICATION_TYPES = ["skill", "education", "experience", "other"] as const;
export type QualificationType = (typeof QUALIFICATION_TYPES)[number];

export interface Qualification {
  /** The text people read. */
  label: string;
  type: QualificationType;
  /** Lowercase terms that satisfy it. */
  keywords: string[];
  /** True if a student could reasonably learn it before starting. */
  trainable: boolean;
}

export const EXPERIENCE_LEVELS = ["none", "some", "significant"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/**
 * Mock data rules: set mock deadlines relative to today so listings don't
 * expire before the demo. The one demo user is Maya Rivera in
 * src/data/resume-interview/mock-profile-maya.json.
 */
export interface Internship extends BaseRecord {
  company: string;
  title: string;
  location: string;
  workMode: WorkMode;
  /** Only if listed. */
  compensation?: Compensation;
  requiredQualifications: Qualification[];
  preferredQualifications: Qualification[];
  applicationDeadline?: ISODate;
  applicationUrl: string;
  industry: string;
  /** Lowercase interest tags. */
  careerTags?: string[];
  /** Lowercase. Empty or missing means any major. */
  relevantMajors?: string[];
  experienceLevel?: ExperienceLevel;
  sponsorshipAvailable?: boolean;
  description: string;
  /** Where the listing came from. */
  source: string;
  lastCheckedAt: ISOTimestamp;
  /** If true, the UI must label it as mock data (use <MockDataLabel />). */
  isMock: boolean;
}

// ---------------------------------------------------------------------------
// MatchScore (Member 2)
// ---------------------------------------------------------------------------

export const MATCH_FACTOR_KEYS = [
  "skills",
  "academics",
  "interests",
  "experience",
  /** Covers both location and remote preference. */
  "location",
  "workAuthorization",
  "deadline",
  "compensation",
] as const;
export type MatchFactorKey = (typeof MATCH_FACTOR_KEYS)[number];

/** Weights across all factors add up to 100. */
export interface MatchFactor {
  key: MatchFactorKey;
  label: string;
  /** Maximum points for this factor. */
  weight: number;
  points: number;
  explanation: string;
}

export const MATCH_LABELS = ["Strong match", "Good match", "Possible match", "Weak match"] as const;
export type MatchLabel = (typeof MATCH_LABELS)[number];

export const ELIGIBILITY_STATUSES = ["eligible", "blocked", "expired"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export interface Eligibility {
  status: EligibilityStatus;
  reasons: string[];
}

export interface MatchedQualification {
  label: string;
  required: boolean;
  evidence: string;
}

export const MISSING_SEVERITIES = ["critical", "trainable", "nice_to_have"] as const;
export type MissingQualificationSeverity = (typeof MISSING_SEVERITIES)[number];

export interface MissingQualification {
  label: string;
  required: boolean;
  severity: MissingQualificationSeverity;
  suggestion: string;
}

export interface MatchScore extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  /** 0 to 100 */
  score: number;
  label: MatchLabel;
  eligibility: Eligibility;
  factors: MatchFactor[];
  matchedQualifications: MatchedQualification[];
  missingQualifications: MissingQualification[];
  /** Facts: why it matches. */
  reasons: string[];
  /** Recommendations: what to do next. */
  nextSteps: string[];
}

// ---------------------------------------------------------------------------
// ResumeDraft / CoverLetterDraft (Member 3)
// These and InterviewPlan may also use the optional extras in section 4 of
// docs/resume-interview-spec.md (Member 3 adds those types in their own module).
// ---------------------------------------------------------------------------

export const DRAFT_STATUSES = ["draft", "approved", "rejected"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export interface DraftChange {
  before?: string;
  after: string;
  reason: string;
}

export interface ResumeDraft extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  content: string;
  /** Every major change, explained. */
  changes: DraftChange[];
  missingKeywords: string[];
  /** Claims not found in the user's material. */
  claimsToVerify: string[];
  status: DraftStatus;
  /** If true, the UI must label it (use <AiGeneratedLabel />). */
  isAiGenerated: boolean;
}

export interface CoverLetterDraft extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  content: string;
  claimsToVerify: string[];
  status: DraftStatus;
  isAiGenerated: boolean;
}

// ---------------------------------------------------------------------------
// Application (Member 4)
// ---------------------------------------------------------------------------

/** In workflow order. */
export const APPLICATION_STATUSES = [
  "saved",
  "preparing",
  "ready_for_review",
  "applied",
  "interview_requested",
  "interview_completed",
  "offer_received",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  /** Copied, so it survives if a listing changes. */
  company: string;
  /** Copied, for the same reason. */
  position: string;
  status: ApplicationStatus;
  dateSaved: ISODate;
  dateApplied?: ISODate;
  applicationDeadline?: ISODate;
  interviewDate?: ISODate;
  followUpDate?: ISODate;
  contactPerson?: string;
  notes?: string;
  nextAction: string;
}

// ---------------------------------------------------------------------------
// InterviewPlan (Member 3)
// ---------------------------------------------------------------------------

export interface InterviewPlan extends BaseRecord {
  userProfileId: string;
  internshipId: string;
  /** Sourced, or labeled as mock data. */
  companySummary: string;
  roleQuestions: string[];
  behavioralQuestions: string[];
  technicalQuestions: string[];
  /** Based only on the user's real experience. */
  starTalkingPoints: string[];
  questionsToAsk: string[];
}

// ---------------------------------------------------------------------------
// AgentTask / ApprovalRequest / Notification (Member 4)
// ---------------------------------------------------------------------------

export const AGENT_TASK_TYPES = [
  "find_internships",
  "rank_internships",
  "draft_resume",
  "draft_cover_letter",
  "prepare_interview",
  "recommend_next_action",
] as const;
export type AgentTaskType = (typeof AGENT_TASK_TYPES)[number];

export const AGENT_TASK_STATUSES = [
  "pending",
  "in_progress",
  "waiting_for_approval",
  "completed",
  "failed",
] as const;
export type AgentTaskStatus = (typeof AGENT_TASK_STATUSES)[number];

export interface AgentTask extends BaseRecord {
  userProfileId: string;
  type: AgentTaskType;
  status: AgentTaskStatus;
  /** Plain-language description of what happened. */
  summary: string;
  relatedId?: string;
  error?: string;
}

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/**
 * Rule: the action runs only when status === "approved".
 * Anything else, including a missing request, means it does not run.
 */
export interface ApprovalRequest extends BaseRecord {
  userProfileId: string;
  agentTaskId: string;
  /** Exactly what will happen, in plain language. */
  action: string;
  relatedId?: string;
  status: ApprovalStatus;
  decidedAt?: ISOTimestamp;
}

export const NOTIFICATION_TYPES = [
  "deadline",
  "interview",
  "follow_up",
  "resume_review",
  "missing_material",
  "expiring_listing",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Only in_app for now. Other channels need the user to opt in. */
export type NotificationChannel = "in_app";

export interface Notification extends BaseRecord {
  userProfileId: string;
  type: NotificationType;
  message: string;
  dueDate?: ISODate;
  channel: NotificationChannel;
  isRead: boolean;
}
