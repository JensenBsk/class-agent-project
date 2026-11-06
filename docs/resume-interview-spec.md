# Résumé, Cover Letter & Interview Prep — Spec (Member 3)

**Owner:** kcarrsdsu (Member 3) · **Status:** Implemented (v1, template generator) · **Last updated:** 2026-11-06

This spec explains how the résumé, cover-letter, and interview-preparation workstream of CareerLaunch Agent will work: rules, workflow, tests, and the extra detail Member 3 needs inside each object.

**`docs/data-definitions.md` (Member 1) is the shared contract and wins over this file.** Everything here uses its field names exactly. Where Member 3 needs more detail, this spec adds **optional** fields only, so nobody else's code breaks if they ignore them. Jensen approved these extras on 2026-11-05 (`docs/data-definitions.md` → "Approved extras").

Stack (per `HANDOFF.md` → Decisions): Next.js + TypeScript, Vitest for tests, mock data, AI calls server-side only. Types below are TypeScript.

Mock data for this workstream: `src/data/resume-interview/` (see §8).

---

## 1. Scope

In scope (brief Stage 4 and Stage 6):

- Résumé analysis against one selected internship (keywords present / missing, stronger bullets).
- Customized résumé draft — a copy; the original `resumeText` is never changed.
- Customized cover-letter draft.
- An explanation for every major change.
- Claims the user must verify before approving.
- Review and approval of drafts.
- Interview plan: company summary, role / behavioral / technical questions, STAR talking points, questions to ask, practice mode with feedback.

Out of scope: profile + internship data + `MatchScore` (Member 2); `Application`, `AgentTask`, `ApprovalRequest`, `Notification` (Member 4); shared app shell (Member 5).

---

## 2. Inputs (read-only, from `data-definitions.md`)

Member 3 reads these fields and nothing else:

- **`UserProfile`**: `id`, `name`, `school`, `major`, `graduationDate`, `gpa?`, `skills`, `experience: ExperienceItem[]`, `careerGoals`, `resumeText?`.
- **`ExperienceItem`**: `type`, `title`, `organization`, `startDate?`, `endDate?`, `description?`, `skills?`.
- **`Internship`**: `id`, `company`, `title`, `location`, `workMode`, `requiredQualifications: Qualification[]`, `preferredQualifications: Qualification[]`, `description`, `industry`, `applicationDeadline?`, `isMock`.
- **`Qualification`**: `label`, `type`, `keywords` (lowercase), `trainable`. Keyword analysis matches each qualification's `keywords` (plus aliases from `skill-aliases.json`) against the student's data.

**GPA rule:** `data-definitions.md` says `gpa?` is set only if the user chose to share it. So: GPA may appear in a draft only when `gpa` is present.

**Résumé input:** `resumeText` is a plain string. Member 3 parses it internally into lines (`ResumeLine`, §4.1) so each line can be traced. The résumé draft tailors a copy of that text, so it needs `resumeText`; without it the page asks the student to paste their résumé. The cover letter and interview plan work from `experience` alone.

**Claims the student confirms** are labeled "Confirmed by student", never "proven" (rule from `docs/data-definitions.md`).

---

## 3. Shared objects Member 3 creates

These fields come straight from `data-definitions.md` — **do not rename them**.

```ts
type DraftStatus = "draft" | "approved" | "rejected";

interface DraftChange {
  before?: string;
  after: string;
  reason: string;            // plain English: "Added 'SQL' — it's a required qualification and is in your skills."
}

interface ResumeDraft {
  id: string;
  userProfileId: string;
  internshipId: string;
  content: string;           // full draft text, what the user sees and would copy
  changes: DraftChange[];
  missingKeywords: string[]; // skills in the listing the user does NOT have — never added to content
  claimsToVerify: string[];  // claims not found in the user's material
  status: DraftStatus;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  // optional extras: §4
}

interface CoverLetterDraft {
  id: string;
  userProfileId: string;
  internshipId: string;
  content: string;
  claimsToVerify: string[];
  status: DraftStatus;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  // optional extras: §4
}

interface InterviewPlan {
  id: string;
  userProfileId: string;
  internshipId: string;
  companySummary: string;     // from the listing only; labeled mock if the listing isMock
  roleQuestions: string[];
  behavioralQuestions: string[];
  technicalQuestions: string[];
  starTalkingPoints: string[];// based only on the user's real experience
  questionsToAsk: string[];
  createdAt: string;
  updatedAt: string;
  // optional extras: §4
}
```

---

## 4. Optional extras (approved 2026-11-05)

All optional. Other workstreams can ignore them. They exist so the UI can show *why* and *where from*, and so tests can prove nothing was invented.

### 4.1 Evidence and verification (résumé + cover letter)

```ts
// One line of the user's résumé, parsed from UserProfile.resumeText.
interface ResumeLine {
  id: string;                 // e.g. "rl-3"
  section: "education" | "experience" | "projects" | "skills" | "other";
  heading?: string;           // "Shift Lead (part-time) — Bean Counter Café, Jan 2025–Present"
  text: string;
}

interface EvidenceRef {
  sourceType: "resume_line" | "profile_field" | "user_confirmation";
  sourceId: string;           // ResumeLine id, profile path like "skills[1]" / "experience[3].description", or a flag id
  quote: string;              // exact source text supporting the claim
}

interface VerificationFlag {
  id: string;
  claim: string;              // the exact words — also copied into claimsToVerify while unresolved
  reason: "no_evidence" | "metric_placeholder" | "scope_escalation" | "company_fact_unsourced";
  severity: "blocking" | "warning";
  resolution: "pending" | "confirmed_by_user" | "edited" | "removed";
}
```

Severity: `no_evidence`, `metric_placeholder`, `company_fact_unsourced` → **blocking**. `scope_escalation` → **warning**.

`claimsToVerify` = the `claim` of every flag still `pending`. That keeps the shared field simple and accurate.

Optional extras on `ResumeDraft`:

```ts
version?: number;                     // starts at 1; editing creates version + 1
sourceLines?: ResumeLine[];           // parsed original résumé
changeEvidence?: EvidenceRef[][];     // changeEvidence[i] supports changes[i]
keywordAnalysis?: KeywordResult[];    // §4.2
verificationFlags?: VerificationFlag[];
```

Optional extras on `CoverLetterDraft`:

```ts
version?: number;
tone?: "professional" | "enthusiastic" | "concise";
companyFacts?: { text: string; sourceField: keyof Internship }[];  // every company claim + where it came from
placeholders?: string[];              // unresolved, e.g. "[Hiring manager name]"
verificationFlags?: VerificationFlag[];
```

### 4.2 Keyword analysis

About **résumé wording**, not overall fit (fit is Member 2's `MatchScore`). Skills are normalized with `src/data/resume-interview/skill-aliases.json` — proposed to share with Member 2 so "matched" means the same thing in both features.

```ts
interface KeywordResult {
  term: string;               // normalized, e.g. "sql"
  displayTerm: string;        // as written in the listing
  importance: "required" | "preferred" | "description";
  inResume: boolean;          // already in resumeText
  inProfile: boolean;         // in skills or an experience description
  action: "already_present"   // nothing to do
        | "can_add"           // user has it, résumé doesn't say it — safe to add, with evidence
        | "missing_skill";    // user lacks it — NEVER add; goes in missingKeywords
  suggestion?: string;        // e.g. "Try a free Kubernetes basics tutorial."
}
```

### 4.3 Interview extras

Optional extras on `InterviewPlan`:

```ts
questionDetails?: {
  text: string;               // same string as in the matching *Questions array
  type: "role" | "behavioral" | "technical";
  whyAsked: string;
  relatedRequirement?: string;
  isGap?: boolean;            // technical question on a skill the user lacks; show the honest-answer tip
  bankId?: string;            // id in interview-question-bank.json
}[];
starDetails?: {
  question: string;
  situation: string; task: string; action: string; result: string;
  evidence: EvidenceRef[];    // must point to a real ExperienceItem
}[];
practiceSessions?: PracticeSession[];
```

```ts
interface PracticeSession {
  id: string;
  startedAt: string;
  answers: {
    question: string;
    answerText: string;       // written by the user
    feedback: {
      starCoverage: { situation: boolean; task: boolean; action: boolean; result: boolean };
      strengths: string[];
      improvements: string[];
      lengthNote?: string;
      disclaimer: string;     // "Practice feedback only. This does not predict whether you will be hired."
    };
  }[];
}
```

---

## 5. Status flow and approvals

Shared statuses are `draft`, `approved`, `rejected`. Member 3 uses them like this:

```
generate ──▶ draft ──user approves (ApprovalRequest approved)──▶ approved
               │                                                    │
               └──user rejects──▶ rejected                          └─user edits─▶ new version, status draft
```

| Transition | Who | Guard |
| --- | --- | --- |
| → `draft` | agent | Rule checks R1–R7 have run; flags attached. |
| `draft` → `approved` | **user only** | No pending **blocking** flag, no unresolved placeholder, and an `ApprovalRequest` for this draft is `approved`. |
| `draft` → `rejected` | user | — |
| `approved` → edit | user | Creates a new version with status `draft`; the old approved version is kept. |

**Approvals use Member 4's `ApprovalRequest` exactly** (`userProfileId`, `agentTaskId`, `action`, `relatedId`, `status`, `decidedAt`). Member 3 creates requests like:

| When | `action` text (plain language) | `relatedId` |
| --- | --- | --- |
| User clicks "Approve résumé" | "Approve résumé draft v2 for Data Analyst Intern at Brightline Analytics" | ResumeDraft id |
| User clicks "Approve cover letter" | "Approve cover letter v1 for …" | CoverLetterDraft id |
| User clicks "Copy" / "Download" | "Copy approved résumé draft v2 to clipboard" | ResumeDraft id |

Member 4's `AgentActivityLog.requestApproval` accepts `relatedVersion`, so an approval applies only to the exact version the student saw.

**Matching `AgentTask` types** (Member 4): `draft_resume`, `draft_cover_letter`, `prepare_interview`. A task waiting on the user's approval uses status `waiting_for_approval`.

**Tracker hint for Member 4:** while a draft for an internship is `draft`, the `Application` can be `preparing`; once both drafts are `approved`, `ready_for_review`. Member 3 never changes `Application.status`.

---

## 6. No-fabrication and safety rules

Hard rules. Each has at least one automated test (§7).

| # | Rule |
| --- | --- |
| **R1** | Every changed or new résumé line, every cover-letter claim about the user, and every STAR talking point must trace to the user's own data (`resumeText`, `skills`, `experience`). No trace ⇒ `no_evidence` blocking flag, and the claim appears in `claimsToVerify`. |
| **R2** | Never add an employer, job title, date, degree, school, GPA, award, certification, or publication that isn't in the user's data. |
| **R3** | A skill may appear in a draft only if it's in `skills` or quoted in an experience. Listing skills the user lacks go in `missingKeywords` — never in `content`. |
| **R4** | Never invent numbers. If a stronger bullet needs a metric the user didn't give, insert a placeholder like `[X students]` and raise a `metric_placeholder` blocking flag. |
| **R5** | Don't raise the user's level of responsibility ("helped" → "led", "assisted" → "managed") without confirmation. Raise a `scope_escalation` warning. |
| **R6** | Company facts come only from the `Internship` fields. Anything else is left out. If the listing `isMock`, the UI labels the summary as mock data. |
| **R7** | GPA appears in a draft only when `UserProfile.gpa` is set. |
| **R8** | `isAiGenerated` is `true` for anything the AI or template wrote, and the UI labels it. |
| **R9** | A draft can't become `approved` while a blocking flag is pending or a placeholder is unresolved. Only the user can approve. |
| **R10** | The original `resumeText` is never modified. Drafts are versioned copies. |
| **R11** | Nothing is copied, downloaded, submitted, or emailed without an `approved` `ApprovalRequest` for that action. A missing request means no. |
| **R12** | Interview feedback never predicts hiring outcomes and never refers to protected characteristics. Drafts never add such details. |

---

## 7. Test plan (Vitest)

Fixtures are in `src/data/resume-interview/`. Maya = `mock-profile-maya`.

| ID | Rule | Given | Expect |
| --- | --- | --- | --- |
| T1 | R3 | Maya + `mock-int-002` (requires Java, Kubernetes) | `java` and `kubernetes` are `missing_skill` and in `missingKeywords`; neither word appears in `content`. |
| T2 | R3 | Maya + `mock-int-001` (requires SQL, Tableau) | `sql` and `tableau` are `can_add` (in profile, not in résumé) — never `missing_skill`. |
| T3 | R1 | Any résumé draft | Every `changes[i]` has evidence whose `quote` is found in Maya's data. |
| T4 | R2 | Any résumé draft | Employers, titles, dates, and schools in `content` ⊆ those in Maya's data. |
| T5 | R4 | Strengthen the tutoring line | Output has a `[X …]` placeholder plus a `metric_placeholder` blocking flag; no digits that aren't in the source. |
| T6 | R5 | Rewrite of "Helped organize workshop series…" to "Led…" | `scope_escalation` warning raised. |
| T7 | R7 | Maya has no `gpa` | "GPA" never appears in either draft. A copy of Maya with `gpa: 3.4` may show it. |
| T8 | R9 | Draft with one pending blocking flag | Approving it throws a clear error. |
| T9 | R9 | Agent code tries to set `approved` without a user decision | Rejected. |
| T10 | R10 | Edit an approved draft | New version, status `draft`; old version and `resumeText` unchanged. |
| T11 | R6 | Cover letter for `mock-int-003` | Every `companyFacts[i].text` is found in that listing's `sourceField`. |
| T12 | R11 | Copy/download with no approved `ApprovalRequest` | Blocked. |
| T13 | R12 | Practice feedback on any answer | Has the disclaimer; contains none of `forbiddenInFeedback` in the question bank. |
| T14 | — | Interview plan for `mock-int-001` | ≥3 behavioral, ≥3 technical tied to required skills, ≥3 questions to ask; every `starDetails[i].evidence` points to a real Maya experience. |
| T15 | — | Profile with no `resumeText` and no `experience` | Clear empty state ("Add your résumé or experiences to get a tailored draft"); no draft created. |

---

## 8. Mock data (`src/data/resume-interview/`)

All mock. All companies fictional.

| File | Contents |
| --- | --- |
| `mock-profile-maya.json` | Maya's `UserProfile` (shared field names) with `resumeText`, plus `parsedResume` — the `ResumeLine[]` the parser should produce from it. No `gpa` (tests R7). Has a "Helped organize" line (R5) and a no-numbers tutoring line (R4). |
| `mock-internships.json` | 4 fictional `Internship` records: strong match, partial match missing Java/Kubernetes, operations role, low match. **Fixtures only** — Member 2 owns the real dataset. |
| `interview-question-bank.json` | Behavioral questions by competency, technical questions tagged by skill, role questions, questions to ask, STAR guide, practice-feedback rules + disclaimer. |
| `skill-aliases.json` | Maps skill variants to one term (e.g. "MS Excel" → `excel`). Proposed to share with Member 2. |

---

## 9. Workflow (agent steps)

1. **Check inputs.** Need a selected `Internship` and either `resumeText` or ≥1 `experience`. Missing → ask the user / show the empty state.
2. **Analyze.** Parse `resumeText` → `ResumeLine[]`; build `KeywordResult[]` using `skill-aliases.json`.
3. **Plan.** List the proposed changes (each `can_add` keyword with its evidence, weak lines to strengthen). Show the plan as a recommendation.
4. **Generate.** Résumé draft + cover letter, using a template generator by default, or an LLM server-side if a key is configured. Run checks R1–R7, attach flags, fill `claimsToVerify`.
5. **Review.** Original vs draft side by side, change reasons, flags. User resolves flags, edits, approves, or rejects.
6. **Approve / export.** Each through Member 4's `ApprovalRequest`.
7. **Interview prep** (any time after picking an internship): build the `InterviewPlan` from the listing + question bank + Maya's real experiences; practice mode gives STAR-based feedback.
8. **Record** each step as an `AgentTask` (Member 4).

### Where the code is

Shared logic goes in `src/services` (Jensen's 2026-11-05 decision). Logic is pure functions, so it's testable without the UI or an API key.

| Path | What it does |
| --- | --- |
| `src/services/resume-interview/types.ts` | The optional extras in §4 (`ResumeDraftRecord`, `VerificationFlag`, `KeywordResult`, …) |
| `src/services/resume-interview/data.ts` | Loads Maya and mock internships (deadlines = today + offset), parses `resumeText` |
| `src/services/resume-interview/keywords.ts` | `analyzeKeywords`, `summarizeKeywords` |
| `src/services/resume-interview/checks.ts` | Rules R2–R5, R7 on any draft text (`runChecks`), `blockingFlags`, `claimsToVerify` |
| `src/services/resume-interview/resumeDraft.ts` | `generateResumeDraft` (template), `metricSuggestions` |
| `src/services/resume-interview/coverLetter.ts` | `generateCoverLetter` (template; company facts from the listing only) |
| `src/services/resume-interview/drafts.ts` | `editDraft`, `confirmFlag`, `approveDraft`, `rejectDraft`, `exportDraft` (uses Member 4's `AgentActivityLog`) |
| `src/services/resume-interview/interviewPlan.ts` | `buildInterviewPlan` |
| `src/services/resume-interview/practice.ts` | `givePracticeFeedback` |
| `src/app/documents/`, `src/app/interview/` | The two pages (client components `DocumentsWorkspace`, `InterviewWorkspace`) |
| `src/app/_resume-interview/` | Shared page pieces: internship picker, approval prompt, CSS module |
| `tests/resume-interview/` | Vitest tests T1–T15 and more |

**Known limits (v1):** the generator is a template, not an AI model. Rules run on the text, so they can't verify company claims a student types into a cover letter themselves (R6 covers generated text only). Drafts and practice answers live in page memory and reset on reload. Until Member 2's pages are in the app, both pages use the demo profile (Maya) and Member 3's mock internships, and read the selected internship from `localStorage["careerlaunch.selectedInternshipId"]`.

---

## 10. Open questions

1. ~~Team sign-off on the optional extras~~: approved by Jensen 2026-11-05. Member 4's `AgentActivityLog` already supports `relatedVersion`, and Member 3 uses it.
2. **Member 2:** OK to share `skill-aliases.json` for `MatchScore`? Where should the shared copy live?
3. **AI model:** the template generator is built. An AI model can be added later as a server route (key in `.env.local`), returning text that goes through the same `runChecks` rules.
4. **Member 2 / Member 5:** connect the real profile and selected internship once the Profile and Internships pages are ported, replacing `useDemoContext` in `src/app/_resume-interview/shared.tsx`.
