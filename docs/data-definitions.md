# CareerLaunch Agent: Shared Data Definitions

Owner: Member 1 (Jensen). **Status: current as of 2026-11-05.** This version includes the best parts of Member 2's and Member 3's work, so build against it.

Every workstream uses these same names, so the pieces fit together at integration. To change something, propose it in `HANDOFF.md` under **Decisions**, because a change here can break another person's work.

These definitions don't depend on a language or framework. Once the stack is picked, whoever sets it up turns them into real types.

**Conventions**
- Field names use `camelCase`.
- Dates use `YYYY-MM-DD`, and timestamps use full ISO 8601.
- A `?` means the field is optional.
- `id` is a unique string on every object.
- Every object also has `createdAt` and `updatedAt` timestamps.

## UserProfile

Owner: Member 2. **Never add protected characteristics such as race, gender, age, religion or disability.**

| Field | Type | Notes |
| --- | --- | --- |
| name | string | Required |
| school | string | Required |
| major | string | Required |
| graduationDate | date | Required |
| gpa? | number | Only if the user chooses to share it |
| skills | string[] | Technical and professional |
| experience | ExperienceItem[] | Work, volunteer or project |
| preferredIndustries | string[] | |
| preferredLocations | string[] | |
| remotePreference | enum | `remote`, `in_person`, `hybrid`, `no_preference` |
| availability | string | For example, "Summer 2027, full-time" |
| salaryExpectation? | number | Lowest acceptable hourly pay, in USD |
| workAuthorization | WorkAuthorization | Used only to check a listing's stated requirement |
| careerGoals | string | |
| resumeText? | string | Text of the existing résumé |
| portfolioUrl? | string | |

**ExperienceItem:** `type` (`work`, `volunteer`, `project`), `title`, `organization`, `startDate?`, `endDate?`, `description?`, `skills?` (string[]).

**WorkAuthorization:** `authorizedToWork` and `needsSponsorship`, each a boolean, or `null` if the user hasn't answered.

## Internship

Owner: Member 2.

| Field | Type | Notes |
| --- | --- | --- |
| company | string | Required |
| title | string | Required |
| location | string | |
| workMode | enum | `remote`, `in_person`, `hybrid` |
| compensation? | Compensation | Only if listed |
| requiredQualifications | Qualification[] | |
| preferredQualifications | Qualification[] | |
| applicationDeadline? | date | |
| applicationUrl | string | |
| industry | string | |
| careerTags? | string[] | Lowercase interest tags |
| relevantMajors? | string[] | Lowercase. Empty or missing means any major |
| experienceLevel? | enum | `none`, `some`, `significant` |
| sponsorshipAvailable? | boolean | |
| description | string | |
| source | string | Where the listing came from |
| lastCheckedAt | timestamp | |
| isMock | boolean | Required. If `true`, the UI must label it as mock data |

**Compensation:** `hourlyMin?`, `hourlyMax?`, `note`.

**Qualification:** `label` (the text people read), `type` (`skill`, `education`, `experience`, `other`), `keywords` (string[], lowercase terms that satisfy it), `trainable` (boolean, true if a student could reasonably learn it before starting).

**Mock data rules**
- Set mock deadlines relative to today, so listings don't expire before the demo.
- There is one demo user: Maya Rivera in `src/data/resume-interview/mock-profile-maya.json`.

## MatchScore

Owner: Member 2.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| internshipId | string | |
| score | number | 0 to 100 |
| label | string | `Strong match`, `Good match`, `Possible match` or `Weak match` |
| eligibility | Eligibility | |
| factors | MatchFactor[] | The explanation behind the score |
| matchedQualifications | MatchedQualification[] | |
| missingQualifications | MissingQualification[] | |
| reasons | string[] | Facts: why it matches |
| nextSteps | string[] | Recommendations: what to do next |

**MatchFactor:** `key` (`skills`, `academics`, `interests`, `experience`, `location`, `workAuthorization`, `deadline`, `compensation`), `label`, `weight` (maximum points), `points`, `explanation`. Weights add up to 100, and `location` covers both location and remote preference.

**Eligibility:** `status` (`eligible`, `blocked`, `expired`), `reasons` (string[]).

**MatchedQualification:** `label`, `required` (boolean), `evidence`.

**MissingQualification:** `label`, `required` (boolean), `severity` (`critical`, `trainable`, `nice_to_have`), `suggestion`.

## ResumeDraft

Owner: Member 3.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| internshipId | string | |
| content | string | |
| changes | DraftChange[] | Every major change, explained |
| missingKeywords | string[] | |
| claimsToVerify | string[] | Claims not found in the user's material |
| status | enum | `draft`, `approved`, `rejected` |
| isAiGenerated | boolean | If `true`, the UI must label it |

**DraftChange:** `before?`, `after`, `reason`.

## CoverLetterDraft

Owner: Member 3. Uses the same `userProfileId`, `internshipId`, `content`, `claimsToVerify`, `status` and `isAiGenerated` fields as `ResumeDraft`.

**Approved extras:** `ResumeDraft`, `CoverLetterDraft` and `InterviewPlan` may also use the optional fields in section 4 of `docs/resume-interview-spec.md`. Other workstreams can ignore them. A claim backed only by a `user_confirmation` must be labeled "confirmed by student," not "proven."

## Application

Owner: Member 4.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| internshipId | string | |
| company | string | Copied, so it survives if a listing changes |
| position | string | Copied, for the same reason |
| status | enum | See below |
| dateSaved | date | |
| dateApplied? | date | |
| applicationDeadline? | date | |
| interviewDate? | date | |
| followUpDate? | date | |
| contactPerson? | string | |
| notes? | string | |
| nextAction | string | |

**Status values, in order:** `saved`, `preparing`, `ready_for_review`, `applied`, `interview_requested`, `interview_completed`, `offer_received`, `rejected`, `withdrawn`.

## InterviewPlan

Owner: Member 3.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| internshipId | string | |
| companySummary | string | Sourced, or labeled as mock data |
| roleQuestions | string[] | Position-specific |
| behavioralQuestions | string[] | |
| technicalQuestions | string[] | |
| starTalkingPoints | string[] | Based only on the user's real experience |
| questionsToAsk | string[] | For the student to ask the interviewer |

## AgentTask

Owner: Member 4. This is the record of what the agent did, and it powers the activity record.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| type | enum | `find_internships`, `rank_internships`, `draft_resume`, `draft_cover_letter`, `prepare_interview`, `recommend_next_action` |
| status | enum | `pending`, `in_progress`, `waiting_for_approval`, `completed`, `failed` |
| summary | string | Plain-language description of what happened |
| relatedId? | string | The object this task worked on |
| error? | string | |

## ApprovalRequest

Owner: Member 4.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| agentTaskId | string | |
| action | string | Exactly what will happen, in plain language |
| relatedId? | string | The draft or application involved |
| status | enum | `pending`, `approved`, `rejected`. Starts as `pending` |
| decidedAt? | timestamp | |

**Rule:** the action runs only when the status is `approved`. Anything else, including a missing request, means it does not run.

## Notification

Owner: Member 4.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| type | enum | `deadline`, `interview`, `follow_up`, `resume_review`, `missing_material`, `expiring_listing` |
| message | string | |
| dueDate? | date | |
| channel | enum | `in_app`. Other channels need the user to opt in |
| isRead | boolean | |

## How the objects connect

```
UserProfile
├── MatchScore ───────── Internship
├── ResumeDraft ──────── Internship
├── CoverLetterDraft ─── Internship
├── InterviewPlan ────── Internship
├── Application ──────── Internship
├── AgentTask ────────── ApprovalRequest
└── Notification
```

## What each person needs from others

| Member | Creates | Reads |
| --- | --- | --- |
| 2 | `UserProfile`, `Internship`, `MatchScore` | Nothing from others |
| 3 | `ResumeDraft`, `CoverLetterDraft`, `InterviewPlan` | `UserProfile`, `Internship` |
| 4 | `Application`, `AgentTask`, `ApprovalRequest`, `Notification` | Everything above |
| 5 | Nothing new | Everything, for the integrated app |

Members 3 and 4 shouldn't wait for Member 2. They can start with one sample `UserProfile` and `Internship` built from these definitions.
