# Handoff: kcarrsdsu

Only kcarrsdsu's agent edits this file. The other agents read it to pick up where kcarrsdsu left off.

## Current status

_Replace this section every time. Keep it to what's true right now._

- **Working on:** Member 3 — résumé, cover letter, and interview preparation.
- **Branch:** `claude/epic-ritchie-yx4bzq` (restarted from `main` after PR #7 merged)
- **Done:**
  - PR #7 merged: `docs/resume-interview-spec.md` (rules R1–R12, approval flow, tests T1–T15) and mock data in `src/data/resume-interview/`.
  - Jensen approved the spec §4 optional extras in `docs/data-definitions.md` (PR #10). My Maya (`src/data/resume-interview/mock-profile-maya.json`) is now the team's one demo user.
  - Posted a review (Comment, not blocking) on Laurent's PR #8: stack conflict, `HANDOFF.md` merge conflict, duplicate `handoffs/HANDOFF-laurent.md`, field-name mismatches, empty `resumeText`, two skill-alias lists.
- **Half-done / in progress:** My mock data and spec still use the OLD shapes: `requiredQualifications`/`preferredQualifications` are `string[]` (now `Qualification[]`), `compensation` is a string (now `Compensation`), and `workAuthorization` is a string (now `WorkAuthorization`).
- **Broken or known bugs:**
  - Per Jensen, Member 2's matching crashed on my data because of those old shapes.
  - Point 5 of my PR #8 review offered to switch to Laurent's Maya. That's now out of date: Jensen chose my Maya. Tell Laurent if it comes up.
- **Next steps (specific enough to pick up cold):**
  1. Update `src/data/resume-interview/mock-internships.json`: convert each qualification to `{label, type, keywords, trainable}`, `compensation` to `{hourlyMin?, hourlyMax?, note}`, set deadlines relative to today (rule in `docs/data-definitions.md`).
  2. Update `mock-profile-maya.json`: `workAuthorization` → `{authorizedToWork: true, needsSponsorship: false}`; optionally add `skills` per experience item.
  3. Update `docs/resume-interview-spec.md` §2 inputs for the new shapes; change §9 code location to `src/services/resume-interview/` (Jensen: shared logic goes in `src/services`, App Router in `src/app`); label claims backed only by `user_confirmation` as "confirmed by student", not "proven".
  4. Once the Next.js skeleton is on `main`: `analyzeKeywords` + Vitest tests T1–T2, then the template résumé generator + rule checks (T3–T10), cover letter (T11), interview plan + practice feedback (T13–T14).
- **Needs from teammates:**
  - Member 2 (Laurent): OK to share one skill-alias list? (asked on PR #8)
  - Member 4: OK adding optional `relatedVersion?` to `ApprovalRequest` (spec §5)? Still unclaimed.
  - Member 5: confirm the stack and push the Next.js skeleton. Still unclaimed.

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

### 2026-11-06 | Reviewed Laurent's PR #8
**Goal:** Review the Member 2 PR, since it touches Member 3's inputs.
**What I did:**
- Read PR #8's `src/models/schemas.js`, `src/utils/text.js`, `docs/matching.md`, `src/data/sampleProfile.mock.js`, `package.json`, and its `HANDOFF.md` changes. Ran its tests: 29/29 pass on Node 22.
- Posted a Comment review with 9 line comments.
- Pulled `main` and read Jensen's PR #10 (new shared shapes, extras approved, my Maya is the demo user).
**Files changed:**
- `handoffs/HANDOFF-kcarrsdsu.md`, `HANDOFF.md`: this update only.
**Decisions made:**
- None new. Following Jensen's 2026-11-05 decisions.
**Problems / bugs found:**
- My mock data uses the old `string[]` qualifications, which crashed Member 2's matching. Fix is next step 1.
**Next steps:**
1. See "Next steps" under Current status.

### 2026-11-06 | Résumé/interview spec + mock data
**Goal:** Groundwork for Member 3 before app code exists: spec, rules, tests, mock data.
**What I did:**
- Read AGENTS.md, HANDOFF.md, all handoffs, `docs/project-brief.md`, and `docs/data-definitions.md`.
- Wrote the workstream spec, then reworked it after pulling Jensen's data definitions so it uses the shared names (`experience`, `workMode`, `resumeText`, `content`, `claimsToVerify`, Member 4's `ApprovalRequest`).
- Built mock data and checked the test expectations against it with a small script.
**Files changed:**
- `docs/resume-interview-spec.md`: new — scope, inputs, shared objects, optional extras, status/approval flow, rules R1–R12, tests T1–T15, workflow, open questions.
- `src/data/resume-interview/mock-profile-maya.json`: new — fictional Maya `UserProfile` with `resumeText` + expected `parsedResume`; no GPA (tests R7).
- `src/data/resume-interview/mock-internships.json`: new — 4 fictional `Internship` fixtures (strong, partial w/ missing Java/Kubernetes, operations, low match).
- `src/data/resume-interview/interview-question-bank.json`: new — 12 behavioral, 18 technical (skill-tagged), 5 role, 7 questions to ask, STAR guide, feedback rules + disclaimer.
- `src/data/resume-interview/skill-aliases.json`: new — skill normalization map.
**Decisions made:**
- `docs/data-definitions.md` wins; Member 3 only adds optional fields.
- Proposed: template generator first (no API key, deterministic tests), LLM later behind the same function.
- Mock internships are fixtures only; Member 2 owns the real dataset.
**Problems / bugs found:**
- None. Blocked only on the app skeleton.
**Next steps:**
1. See "Next steps" under Current status.
