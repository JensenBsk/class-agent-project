# Handoff: laurentjedi

Only laurentjedi's agent edits this file. The other agents read it to pick up where laurentjedi left off.

## Current status

- **Working on:** Member 2: profile creation, internship data, matching and ranking.
- **Branch:** `claude/practical-gauss-xpx31v` (brief's name: `feature/matching`)
- **Done:**
  - Team project brief (`docs/project-brief.md`) and the "How to start" table in `HANDOFF.md` (merged via PR #3).
  - Version 1 of matching in plain JavaScript (PR #8, now **closed**, not merged). The code is still viewable there: profile form with missing/conflicting-info checks, 11 fictional internships with de-duplication, search/filters, 8-factor explainable scoring (critical / trainable / nice-to-have gaps, facts vs. recommendations), fairness allow-list, and 29 tests.
- **Half-done / in progress:** Nothing in code. Waiting to port.
- **Broken or known bugs (in the PR #8 version):**
  - Major matching uses substring checks, so short majors like "CS" can falsely match "statistics".
  - Field names don't match `docs/data-definitions.md`, and it crashed on Member 3's data.
  - Mock deadlines are fixed dates and will expire before the demo.
- **Blocked on:** Member 5's Next.js skeleton (`claude/epic-hypatia-t2ya4k`) being merged into `main`.
- **Next steps (specific enough to pick up cold):**
  1. Once the skeleton is on `main`, branch from it.
  2. Port PR #8's `src/services/{profileService,internshipService,matchingService}.js` and `src/utils/text.js` to TypeScript in `src/services/`, importing types from `@/types`.
  3. Rename fields per `docs/data-definitions.md`: `deadline`→`applicationDeadline`, `lastChecked`→`lastCheckedAt` (timestamp), `in-person`→`in_person`, `any`→`no_preference`, `minHourlyRate`→`salaryExpectation`, `nice-to-have`→`nice_to_have`; add `userProfileId` to `MatchScore`.
  4. Use Member 3's Maya (`src/data/resume-interview/mock-profile-maya.json`) and `skill-aliases.json`. Generate mock deadlines relative to today.
  5. Fix major matching with whole-word/alias matching; add a test that "CS" ≠ "statistics".
  6. Port the 29 tests to Vitest; build `src/app/profile/page.tsx` and `src/app/internships/page.tsx` using `StateMessage`, `MockDataLabel`, and `AiGeneratedLabel`.
  7. Open a new PR; ask Jensen and Member 5 to review.
- **Needs from teammates:** Member 5: open and merge the skeleton PR.

## Session log

Newest entry at the top. Copy the template for each new entry.

<!-- TEMPLATE: copy this block
### YYYY-MM-DD | short title
**Goal:** what this session set out to do
**What I did:**
-
**Files changed:**
- `path/to/file`: what changed
**Decisions made:**
-
**Problems / bugs found:**
-
**Next steps:**
1.
-->

### 2026-11-06 | Closed PR #8, agreed to team stack
**Goal:** Line up with the team's Next.js decision and answer open questions.
**What I did:**
- Closed PR #8 with a comment explaining the plan
- Synced this branch with `main` (old plain-JS files removed; still viewable on PR #8)
- Answered Jensen, Member 3, Member 4, and Member 5 in `HANDOFF.md` → Questions
**Files changed:**
- `HANDOFF.md`: my row, answers, log line
- `handoffs/HANDOFF-laurentjedi.md`: status and this entry
**Decisions made:**
- Agreed to Next.js + TypeScript + Vitest; matching gets rebuilt rather than merged
- Use Member 3's Maya and skill aliases
**Problems / bugs found:**
- Known bugs in the PR #8 version are listed under Current status
**Next steps:**
1. See Current status → Next steps
