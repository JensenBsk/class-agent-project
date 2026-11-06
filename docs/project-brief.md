# CareerLaunch Agent — Team Project Brief

> **Source of truth for all five team members.** Everyone uses this same brief, terminology, architecture, and definition of done. Propose changes in `HANDOFF.md` → *Decisions* before changing scope.

## Project Concept

CareerLaunch Agent is an AI-powered internship application assistant for college students who are overwhelmed by searching for internships, understanding qualifications, customizing application materials, tracking deadlines, and preparing for interviews.

The application should act as an **agentic workflow system** rather than a simple chatbot. It should gather information, create a plan, use approved tools or data sources, generate recommendations, track progress, and ask the user for approval before taking important actions.

**The system must never automatically submit an application, send an email, make a false claim, or alter a user's résumé without approval.**

## Target User

Our primary user is **Maya**, a college student who:

- Is applying for internships while taking classes and working part-time.
- Does not know which internships are realistic for her experience level.
- Has difficulty finding opportunities across multiple websites.
- Struggles to customize her résumé and cover letter.
- Misses deadlines because information is spread across different platforms.
- Feels unprepared for interviews.
- Wants guidance but still wants control over every final decision.

## Problem Statement

College students often have the skills and motivation to apply for internships but lack the time and organization to manage the full process. Existing job boards primarily list opportunities, while résumé tools primarily generate documents. Few systems coordinate the entire process from opportunity discovery through application tracking and interview preparation.

CareerLaunch Agent solves this problem by turning the internship search into a guided, personalized workflow.

## Core User Goal

The user enters their academic background, skills, experience, location preferences, work authorization, salary expectations, and career interests. The system then helps them:

1. Discover relevant internships.
2. Understand why each internship is a good or bad match.
3. Identify missing qualifications.
4. Customize application materials.
5. Track application deadlines and statuses.
6. Prepare for interviews.
7. Decide what action to take next.

## Complete Agentic Workflow

### Stage 1: User Profile Creation

The agent asks the user for:

- Name
- School
- Major
- Graduation date
- GPA, if the user wants to include it
- Technical and professional skills
- Previous work, volunteer, or project experience
- Preferred industries
- Preferred locations or remote-work preference
- Availability
- Salary expectations
- Work authorization requirements
- Career goals
- Existing résumé or portfolio

The agent should identify missing information and ask follow-up questions only when necessary.

### Stage 2: Internship Discovery

The agent searches approved internship data sources or uses a realistic **mock dataset** if live job-board integration is not available.

Each opportunity should include:

- Company
- Job title
- Location
- Remote or in-person status
- Salary or compensation, if available
- Required qualifications
- Preferred qualifications
- Application deadline
- Application URL
- Industry
- Description
- Source
- Date the listing was last checked

The system should avoid presenting duplicate listings.

### Stage 3: Opportunity Ranking

The agent scores internships based on:

- Skills match
- Major or academic background
- Career interests
- Experience level
- Location
- Work authorization
- Deadline urgency
- Compensation
- Remote or in-person preferences

The score must be **explainable**. Instead of displaying only "85% match," the system should explain:

- Why the opportunity matches.
- Which requirements the user already meets.
- Which qualifications are missing.
- Whether the missing qualifications are critical or trainable.
- What the user should do next.

### Stage 4: Résumé and Cover Letter Assistance

The agent may:

- Recommend résumé improvements.
- Identify missing keywords from a job description.
- Suggest stronger bullet points.
- Generate a customized résumé draft.
- Generate a customized cover-letter draft.
- Explain every major change.
- Highlight claims that require user verification.

The agent **must not invent** work experience, education, skills, awards, or accomplishments.

All generated documents must be shown to the user for review before being downloaded, copied, or used.

### Stage 5: Application Tracker

The application tracker should allow the user to record:

- Company
- Position
- Date saved
- Date applied
- Application deadline
- Application status
- Interview date
- Follow-up date
- Contact person
- Notes
- Next action

Possible statuses:

- Saved
- Preparing
- Ready for review
- Applied
- Interview requested
- Interview completed
- Offer received
- Rejected
- Withdrawn

The system should recommend next actions based on the current status.

### Stage 6: Interview Preparation

For a selected internship, the agent should generate:

- Company background summary.
- Position-specific interview questions.
- Behavioral questions.
- Technical or skill-based questions.
- Suggested STAR-method talking points.
- Questions the student can ask the interviewer.
- A practice interview mode.
- Feedback based on the user's answers.

The feedback should be constructive and should not claim to predict whether the user will be hired.

### Stage 7: Follow-Up and Reminders

The agent should identify important upcoming actions such as:

- Application deadlines.
- Interviews.
- Follow-up dates.
- Résumé review tasks.
- Missing application materials.
- Opportunities that are about to expire.

If the application supports notifications, the user must opt in. The system must not send messages or emails automatically without explicit user approval.

## Business Case

### Customer

The primary customer is a college student seeking internships. Potential paying customers include:

- Individual students.
- Universities and career centers.
- Academic departments.
- Workforce-development programs.
- Student-success platforms.
- Nonprofit organizations supporting first-generation students.

### Customer Pain

Students lose opportunities because they:

- Do not know where to search.
- Apply to positions that are poor matches.
- Use generic résumés.
- Miss deadlines.
- Do not understand job descriptions.
- Lack professional guidance.
- Have limited access to career advisors.

Career centers also have limited staff and cannot provide individualized support to every student.

### Value Proposition

CareerLaunch Agent provides personalized, organized, and explainable internship support in one workflow. It helps students apply more effectively while reducing repetitive administrative work for career advisors.

### Benefits for Students

- Saves time.
- Improves application quality.
- Reduces missed deadlines.
- Makes job descriptions easier to understand.
- Provides personalized preparation.
- Helps students identify skill gaps.
- Gives students control over final decisions.

### Benefits for Universities

- Supports more students without requiring a proportional increase in staff.
- Improves internship and employment outcomes.
- Provides measurable engagement data.
- Helps career centers prioritize students who need human assistance.
- Creates a scalable student-support tool.

### Possible Business Models

1. **Freemium student version:** basic internship matching and tracking are free; advanced résumé analysis and interview preparation require payment.
2. **University licensing:** universities pay an annual subscription based on student enrollment.
3. **Career-center software:** career advisors receive dashboards and student progress summaries.
4. **Workforce-program licensing:** nonprofits and workforce programs pay for access for a defined group of participants.

**Recommended initial model:** university or career-center licensing, because students are often price-sensitive while institutions have a direct interest in improving career outcomes.

### Competitive Advantage

- A complete workflow instead of one isolated tool.
- Explainable internship matching.
- Approval-based agent actions.
- Application tracking.
- Interview preparation connected to each specific opportunity.
- A focus on student control and truthful applications.
- Potential integration with university career centers.

### Key Performance Indicators

The prototype should identify how it could measure:

- Number of completed user profiles.
- Number of internship opportunities reviewed.
- Number of applications prepared.
- Number of applications submitted by users.
- Deadline completion rate.
- Interview preparation sessions completed.
- User-reported time saved.
- User satisfaction.
- Internship interview rate.
- Internship offer rate.
- Percentage of generated résumé content approved by users.

The prototype should not claim that it directly causes a student to receive a job unless that result is properly measured.

## Functional Requirements

The prototype must include, at minimum:

1. A profile or onboarding screen.
2. An internship opportunity screen.
3. A matching or ranking explanation.
4. A résumé or cover-letter assistance feature.
5. An application tracker.
6. An interview-preparation feature.
7. A visible next-action recommendation.
8. Approval steps before consequential actions.
9. Clear error and empty states.
10. A way to reset or edit user data.

## Agent Behavior Requirements

The agent should:

- Maintain context across the workflow.
- Break complex goals into steps.
- Explain its recommendations.
- Ask clarifying questions when required.
- Detect missing or conflicting information.
- Request approval before external or consequential actions.
- Keep a record of completed actions.
- Allow the user to undo or edit information.
- Clearly distinguish facts, recommendations, and generated content.
- Use mock data when external integrations are unavailable.
- Avoid fabricating job listings or company information.

## Safety, Privacy, and Trust Requirements

The prototype must:

- Minimize collection of personal information.
- Avoid collecting sensitive information unless necessary.
- Never expose one user's data to another user.
- Avoid inventing qualifications.
- Clearly label AI-generated text.
- Require user review before applications, emails, or documents are finalized.
- Avoid making hiring guarantees.
- Avoid discriminatory ranking based on protected characteristics.
- Explain why an internship was recommended.
- Provide a way for the user to delete or reset their information.
- Use placeholder credentials and environment variables.
- Never commit API keys, passwords, tokens, or private credentials to GitHub.

## Technical Expectations

Before making changes:

1. Inspect the current repository.
2. Identify the existing framework, language, package manager, and commands.
3. Run the existing application and tests if possible.
4. Preserve the current project structure unless there is a strong reason to change it.
5. Do not rewrite another team member's work without coordination.
6. Use reusable components and consistent naming.
7. Document setup instructions.
8. Add or update tests for important logic.
9. Make small, focused commits.
10. Test the complete workflow before declaring the project finished.

If live integrations are unavailable, create clean mock services and clearly label them as mock data. The design should make it possible to replace the mocks with real APIs later.

## Recommended Repository Organization

```
/docs
  project-overview.md
  business-case.md
  user-stories.md
  architecture.md
  testing-plan.md
/src
  /components
  /pages
  /services
  /agents
  /data
  /utils
/tests
README.md
```

Adapt this structure to the existing repository instead of forcing it if the project already has an established pattern.

## Team Work Division

Five workstreams. Each member works on a separate branch and avoids editing the same files whenever possible.

### Member 1 — Product, Research, and Documentation Lead
**Branch:** `feature/product-docs`

Responsibilities:
- Define user personas.
- Write the complete use case.
- Write user stories and acceptance criteria.
- Document the business case.
- Define success metrics and KPIs.
- Create `/docs/project-overview.md`, `/docs/business-case.md`, `/docs/user-stories.md`.
- Update the README with the project purpose and setup instructions.

Deliverables: product requirements, business case, user journey, user stories, assumptions and risks, definition of done.

### Member 2 — User Profile and Internship Matching Lead
**Branch:** `feature/matching`

Responsibilities:
- Build the onboarding/profile workflow.
- Create or organize mock internship data.
- Build internship search and filtering.
- Build matching or ranking logic.
- Display explainable match scores.
- Show missing and matched qualifications.
- Add tests for matching logic.

Deliverables: profile interface, internship data model, search and filter functionality, explainable ranking feature, matching tests.

### Member 3 — Résumé, Cover Letter, and Interview Agent Lead
**Branch:** `feature/resume-interview`

Responsibilities:
- Build the résumé assistance workflow.
- Build cover-letter generation or mock generation.
- Add job-description keyword analysis.
- Add user review and approval states.
- Build interview preparation.
- Add interview questions and STAR-method guidance.
- Ensure the system never invents qualifications.

Deliverables: résumé analysis interface, cover-letter draft interface, interview preparation interface, approval and verification states, tests for generated-content rules.

### Member 4 — Application Tracker and Agent Orchestration Lead
**Branch:** `feature/tracker-agent`

Responsibilities:
- Build the application tracker.
- Define application status transitions.
- Build next-action recommendations.
- Create the agent workflow state machine or orchestration logic.
- Track deadlines, interviews, notes, and follow-ups.
- Add confirmation steps before consequential actions.

Deliverables: application tracker, status workflow, next-action engine, agent state management, deadline and follow-up logic, tests for status transitions.

### Member 5 — UI Integration, Security, Testing, and Deployment Lead
**Branch:** `feature/integration-testing`

Responsibilities:
- Establish a consistent visual design.
- Integrate the five main workflow sections.
- Build navigation and shared layout.
- Add loading, error, empty, and success states.
- Review accessibility and mobile responsiveness.
- Check for exposed secrets or unsafe data handling.
- Run the full application and tests.
- Resolve integration conflicts.
- Create the final demo flow.

Deliverables: integrated interface, consistent styling, accessibility review, security review, end-to-end testing, final demo script, final README verification.

## GitHub Collaboration Rules

Each member should:

1. Pull the latest `main` branch before starting.
2. Create a branch using the format above (`feature/product-docs`, `feature/matching`, `feature/resume-interview`, `feature/tracker-agent`, `feature/integration-testing`).
3. Make focused commits.
4. Write a clear pull-request description.
5. Explain what files were changed.
6. Explain how the work was tested.
7. Identify any files that another team member may need to review.
8. Never commit secrets.
9. Communicate before changing shared configuration files.
10. Review at least one other team member's pull request.

## Integration Order

1. Member 1 creates the requirements, data definitions, and documentation.
2. Member 2 creates profile and internship matching features.
3. Member 3 creates résumé and interview features.
4. Member 4 creates application tracking and orchestration features.
5. Member 5 integrates, tests, secures, and polishes the full application.

All members should agree on shared data structures before implementing features.

## Shared Data Concepts

Use consistent names for:

- `UserProfile`
- `Internship`
- `MatchScore`
- `ResumeDraft`
- `CoverLetterDraft`
- `Application`
- `InterviewPlan`
- `AgentTask`
- `ApprovalRequest`
- `Notification`

Each object should have clear fields, types, and validation rules.

## Required Demo Scenario

1. Maya creates a profile.
2. She enters her major, skills, experience, and location preference.
3. The system displays several internship opportunities.
4. The system ranks them and explains the rankings.
5. Maya selects one internship.
6. The agent identifies missing qualifications and recommends next steps.
7. The system analyzes Maya's résumé.
8. The system creates a customized résumé and cover-letter draft.
9. Maya reviews and approves the drafts.
10. Maya adds the opportunity to her application tracker.
11. The system recommends a deadline and follow-up plan.
12. Maya opens interview preparation.
13. The system generates questions and STAR-method guidance.
14. The system displays a clear next action.
15. The system asks for approval before any external submission or communication.

## Definition of Done

The project is complete when:

- [ ] A user can complete the main workflow from profile creation to interview preparation.
- [ ] The workflow is understandable without a team member explaining every screen.
- [ ] Internship recommendations include explanations.
- [ ] Generated materials require user review.
- [ ] No false qualifications are created.
- [ ] The application tracker works.
- [ ] The agent recommends next actions.
- [ ] Loading, error, empty, and success states exist.
- [ ] The application can run from the README instructions.
- [ ] Tests pass.
- [ ] No secrets are committed.
- [ ] The team can demonstrate the complete Maya scenario.
- [ ] The business case and technical documentation are included.
- [ ] The final product clearly demonstrates agentic behavior: planning, tool/data use, memory, recommendations, state changes, and approval checkpoints.

## Agent Instructions (for every team member's AI agent)

First inspect the repository and report: the current technology stack, how to run the project, the existing file structure, what features already exist, what workstream to implement first, and any risks or conflicts.

Then work **only** within the responsibilities assigned to your team member. Do not silently change the project scope. If you discover a dependency on another workstream, document it clearly and create the smallest compatible interface or mock needed to continue.

At the end of your work, provide: files changed, features completed, tests run, known limitations, and instructions for the next team member.
