# CareerLaunch Agent: User Stories

Owner: Member 1 (Jensen). Each story has an owner and acceptance criteria, which are the tests for calling it finished. Requirement IDs (R1 to R10) refer to `docs/project-overview.md`, and object names refer to `docs/data-definitions.md`.

**Priority:** P1 means the Maya demo needs it. P2 means it should be built if time allows.

## Profile (Member 2)

### S1. Create a profile (P1, R1)
As a student, I want to enter my background and preferences so that recommendations fit me.

- [ ] I can enter every field in `UserProfile`, and GPA and salary expectations are optional.
- [ ] The agent asks follow-up questions only when required information is missing.
- [ ] The app never asks for race, gender, age, religion, disability or similar characteristics.

### S2. Edit or reset my data (P1, R10)
As a student, I want to change or delete my information so that I stay in control of it.

- [ ] I can edit any profile field, and new rankings use the change.
- [ ] Reset clears my profile, drafts, applications and agent history.
- [ ] Reset asks me to confirm first.

## Discovery and matching (Member 2)

### S3. See relevant internships (P1, R2)
As a student, I want relevant opportunities in one place so that I don't have to search many sites.

- [ ] Each listing shows the `Internship` fields, including its source and last-checked date.
- [ ] Mock listings are clearly labeled as mock data.
- [ ] Duplicates do not appear.
- [ ] I can filter by location, remote status and industry.
- [ ] If nothing matches, I see an empty state that suggests what to change.

### S4. Understand each match (P1, R3)
As a student, I want to know why an internship was recommended so that I can decide whether to apply.

- [ ] Each score lists requirements I meet and qualifications I'm missing.
- [ ] Each missing qualification is marked critical or trainable.
- [ ] Each match gives a recommended next step.
- [ ] Protected characteristics play no part in the score.
- [ ] A test proves the same input always gives the same score.

## Résumé and cover letter (Member 3)

### S5. Improve my résumé for a role (P1, R4)
As a student, I want role-specific suggestions so that my application is stronger.

- [ ] The agent shows keywords missing from the job description.
- [ ] Every major suggested change comes with an explanation.
- [ ] A suggested keyword does not become a claim unless my material supports it.

### S6. Draft a résumé and cover letter (P1, R4, R8)
As a student, I want a tailored draft so that I save time, without losing the truth.

- [ ] Generated text is labeled as AI-generated.
- [ ] Anything not found in my profile or résumé is flagged for me to verify.
- [ ] I can't download or copy a draft until I approve it.
- [ ] I can edit or reject a draft.
- [ ] A test proves that an invented skill is flagged.

## Tracker and next actions (Member 4)

### S7. Track my applications (P1, R5)
As a student, I want every application in one place so that nothing gets lost.

- [ ] I can add an internship to the tracker and edit the `Application` fields.
- [ ] Statuses are limited to the nine in `docs/data-definitions.md`.
- [ ] Tests cover allowed and blocked status changes.

### S8. Always know my next step (P1, R7)
As a student, I want one clear next action so that I'm not overwhelmed.

- [ ] Every application shows a next action based on its status.
- [ ] Deadlines that are close appear first.
- [ ] The next action explains why it was chosen.

### S9. Approve important actions (P1, R8)
As a student, I want to approve consequential actions so that nothing happens without me.

- [ ] Every consequential action creates an `ApprovalRequest` first.
- [ ] Each request says exactly what will happen, and I can approve or reject it.
- [ ] A rejected or unanswered action does not happen.
- [ ] Completed actions appear in an activity record.

### S10. Get reminders (P2)
As a student, I want to be alerted about important dates so that I don't miss them.

- [ ] In-app reminders cover deadlines, interviews, follow-ups and expiring listings.
- [ ] Any notification outside the app requires me to opt in.
- [ ] Nothing is sent by email or message without my approval.

## Interview preparation (Member 3)

### S11. Prepare for a specific interview (P1, R6)
As a student, I want prep tied to the role so that I feel ready.

- [ ] Prep includes a company summary and role-specific, behavioral and technical questions.
- [ ] STAR guidance uses my real experience.
- [ ] It includes questions I can ask the interviewer.
- [ ] Company facts are sourced or labeled as mock data.

### S12. Practice and get feedback (P2, R6)
As a student, I want to practice answers so that I improve.

- [ ] I can answer questions in a practice mode and get constructive feedback.
- [ ] Feedback never predicts whether I will be hired.

## Whole product (Member 5)

### S13. Clear states everywhere (P1, R9)
As a student, I want to know what the app is doing so that I'm never stuck.

- [ ] Every screen has loading, error, empty and success states.
- [ ] Errors explain what to do next, and the app keeps my data.

### S14. The full demo works (P1)
As the team, we want the Maya scenario to run from start to finish so that we can present it with confidence.

- [ ] All 15 steps of the demo in `docs/project-brief.md` work in order.
- [ ] Someone outside the team can follow it without an explanation of every screen.
- [ ] The app runs from the README instructions.
- [ ] A check confirms no secrets are committed.

## Coverage check

| Requirement | Stories |
| --- | --- |
| R1 Profile | S1 |
| R2 Opportunities | S3 |
| R3 Ranking explanation | S4 |
| R4 Résumé and cover letter | S5, S6 |
| R5 Tracker | S7 |
| R6 Interview prep | S11, S12 |
| R7 Next action | S8 |
| R8 Approvals | S6, S9 |
| R9 Error and empty states | S13 |
| R10 Reset and edit | S2 |
