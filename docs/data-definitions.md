# CareerLaunch Agent: Shared Data Definitions

Owner: Member 1 (Jensen). **Status: proposed. Everyone must agree on this before writing features.**

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
| salaryExpectation? | number | Hourly, in USD |
| workAuthorization | string | Used only to check a listing's stated requirement |
| careerGoals | string | |
| resumeText? | string | Text of the existing résumé |
| portfolioUrl? | string | |

**ExperienceItem:** `type` (`work`, `volunteer`, `project`), `title`, `organization`, `startDate`, `endDate?`, `description`.

## Internship

Owner: Member 2.

| Field | Type | Notes |
| --- | --- | --- |
| company | string | Required |
| title | string | Required |
| location | string | |
| workMode | enum | `remote`, `in_person`, `hybrid` |
| compensation? | string | Only if listed |
| requiredQualifications | string[] | |
| preferredQualifications | string[] | |
| applicationDeadline? | date | |
| applicationUrl | string | |
| industry | string | |
| description | string | |
| source | string | Where the listing came from |
| lastCheckedAt | timestamp | |
| isMock | boolean | Required. If `true`, the UI must label it as mock data |

## MatchScore

Owner: Member 2.

| Field | Type | Notes |
| --- | --- | --- |
| userProfileId | string | |
| internshipId | string | |
| score | number | 0 to 100 |
| factors | MatchFactor[] | The explanation behind the score |
| matchedRequirements | string[] | |
| missingQualifications | MissingQualification[] | |
| recommendedNextStep | string | |

**MatchFactor:** `name` (`skills`, `academic_background`, `career_interests`, `experience_level`, `location`, `work_authorization`, `deadline_urgency`, `compensation`, `work_mode`), `score` (0 to 100), `explanation`.

**MissingQualification:** `qualification`, `severity` (`critical` or `trainable`).

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
