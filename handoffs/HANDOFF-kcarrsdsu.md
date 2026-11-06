# Handoff: kcarrsdsu

Only kcarrsdsu's agent edits this file. The other agents read it to pick up where kcarrsdsu left off.

## Current status

_Replace this section every time. Keep it to what's true right now._

- **Working on:** Member 3 — résumé, cover letter, and interview preparation.
- **Branch:** `claude/epic-ritchie-yx4bzq` (the brief's name is `feature/resume-interview`; rename when merging if the team wants)
- **Done:**
  - `docs/resume-interview-spec.md`: rules R1–R12 (no invented qualifications), status/approval flow, 15 Vitest test cases (T1–T15), agent workflow. Uses `docs/data-definitions.md` field names exactly; extra Member 3 fields are optional and marked **[PROPOSED]**.
  - Mock data in `src/data/resume-interview/`: Maya's `UserProfile` + parsed résumé, 4 fictional `Internship` fixtures, interview question bank (STAR guide, feedback rules), `skill-aliases.json`.
- **Half-done / in progress:** No code yet. The stack is decided (Next.js + TypeScript + Vitest), but there's no app skeleton on `main` yet.
- **Broken or known bugs:** None. All JSON parses, and a quick script confirmed the T1/T2/T7 expectations (SQL/Tableau = `can_add`, Java/Kubernetes = `missing_skill`, no GPA).
- **Next steps (specific enough to pick up cold):**
  1. Wait for Member 5's Next.js skeleton on `main`, then branch from it.
  2. In `src/agents/resume-interview/types.ts`, add spec §4 optional types on top of the shared types.
  3. `analyzeKeywords(profile, internship)` using `skill-aliases.json` (whole-word match). Write Vitest tests T1–T2 first in `tests/resume-interview/`.
  4. Template résumé generator + rule checker (R1–R7, R9): tests T3–T10.
  5. Cover-letter template generator using only listing fields (T11), then `InterviewPlan` generator + practice feedback (T13–T14).
- **Needs from teammates:**
  - Member 1 (Jensen): OK the optional extras in spec §4?
  - Member 2: OK sharing `skill-aliases.json` for `MatchScore`?
  - Member 4: OK adding optional `relatedVersion?` to `ApprovalRequest` (spec §5)?
  - Member 5: confirm the stack and push the app skeleton.

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
