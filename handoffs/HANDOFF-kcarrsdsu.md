# Handoff: kcarrsdsu

Only kcarrsdsu's agent edits this file. The other agents read it to pick up where kcarrsdsu left off.

## Current status

_Replace this section every time. Keep it to what's true right now._

- **Working on:** Member 3 — résumé, cover letter, and interview preparation.
- **Branch:** `claude/epic-ritchie-yx4bzq` (PR #13 — now includes the pages, not just handoffs)
- **Done:**
  - `/documents` page (`src/app/documents/`): keyword table (in résumé / in profile — added / not in your material), résumé draft side by side with the original, "what changed and why" with quotes from the profile, claims to check (Must fix / Check this / Confirmed by student), "ideas to make bullets stronger" (placeholders only), edit → new version, approve and copy each behind an approval prompt, version history, activity record.
  - `/interview` page (`src/app/interview/`): company summary from the listing (mock label + disclaimer), STAR guide, behavioral questions with STAR talking points from Maya's real experience, technical questions (gap badge + honest-answer tip for skills she lacks), role questions, practice mode with STAR feedback, questions to ask.
  - Logic in `src/services/resume-interview/` (pure functions; see spec §9 table). Approvals use Member 4's `AgentActivityLog` with `relatedVersion`.
  - Mock data moved to the shared `Qualification` / `Compensation` / `WorkAuthorization` shapes; deadlines = today + `deadlineOffsetDays`.
  - 43 Vitest tests in `tests/resume-interview/` covering spec T1–T15. Full suite after merging main: 129/129 pass; `npm run typecheck` and `npm run build` clean.
  - Browser check (Playwright, Chromium): approve → copy (clipboard gets the approved résumé), edit with "Led" + a made-up number → flags appear and Approve is disabled until confirmed, decline → nothing happens, Harborview draft never mentions Java/Kubernetes, no horizontal scroll at 375px (dark mode), no console errors.
- **Laurent's review of PR #13 (2026-11-06):** works with the Member 2 branch (182/182 tests when merged locally). One fix asked for and done: if the saved internship id isn't in Member 3's list (e.g. `mock-int-006`), both pages now show a notice instead of silently switching to Brightline (`resolveSelection()` in `src/app/_resume-interview/shared.tsx`, tests in `tests/resume-interview/selection.test.tsx`). Laurent's ZYN answers: Laurent is opening a PR for `claude/practical-gauss-xpx31v`; Laurent's `src/data/internships.mock.ts` replaces mine (ids `mock-int-001`–`004` and their keywords won't change); the wiring functions are stable (`load()` returns a `UserProfile` or `null`; `getById(id)` returns an `Internship` or `null`).
- **Half-done / in progress:** Nothing in progress.
- **Broken or known bugs / limits:**
  - Pages use the demo profile (Maya) and Member 3's mock internships until Member 2's Profile/Internships pages are ported. They read/write `localStorage["careerlaunch.selectedInternshipId"]` (Member 2's interface).
  - Drafts, approvals and practice answers live in page memory and reset on reload.
  - Template generator only (no AI model yet). Rules check the text, but can't verify company claims a student types into a cover letter themselves.
  - The question bank's gap tip uses Kubernetes as its example even when the gap is a different skill.
- **Next steps (specific enough to pick up cold):**
  1. Laurent's note to Member 3 (code FRATDJ, in `HANDOFF.md` on branch `claude/practical-gauss-xpx31v`) asks to wire the pages to Member 2's code. Once that branch is merged into `main`, change only `useDemoContext()` in `src/app/_resume-interview/shared.tsx`: profile from `createProfileStore(browserStorage()).load()` (`@/services/matching/profile`), internship from `createInternshipService().getById(id)` (`@/services/matching/internships`) using `localStorage["careerlaunch.selectedInternshipId"]`. Optionally show `scoreInternship(profile, internship).missingQualifications` (`@/services/matching/match`) next to the keyword table. Keep the demo Maya as the fallback when no profile is saved. Note: that note says my mock data uses old shapes; that was fixed in this PR.
  2. When switching to Laurent's internships, delete `src/data/resume-interview/mock-internships.json` and in the SAME PR update or delete Laurent's test `tests/matching/internships.test.ts` ("keeps Member 3's ids…"), which reads that file (or ask Laurent to). Then the "not available here" notice should no longer appear for Member 2 listings.
  3. Member 4/5: show approved drafts on `/tracker` (e.g. move an Application to `ready_for_review` when both drafts are `approved`). Member 3 never changes `Application.status`.
  4. Optional: add an AI model behind a server route (`AI_API_KEY` in `.env.local`), passing its output through `runChecks` in `src/services/resume-interview/checks.ts`.
  5. Optional: persist drafts in `localStorage` like Member 4's tracker storage.
- **Needs from teammates:**
  - Member 2 (Laurent): OK to share one skill-alias list? (asked on PR #8)
  - Member 5 (tommybaird26-star): review PR #13 and include `/documents` and `/interview` in the demo script.

## For Laurent (Member 2) — Code: ZYN

_From kcarrsdsu (Member 3), 2026-11-06. Reply in `HANDOFF.md` → Questions for each other, starting your line with "ZYN"._

Thanks for the FRATDJ note. `/documents` and `/interview` are built (PR #13). Here's what I need from you to finish wiring them to your code:

1. **Open a PR for your branch.** Your profile, internships and matching code is only on `claude/practical-gauss-xpx31v`. My pages can't use your saved profile until it's on `main`. I checked: it merges cleanly with my work except a small conflict in `HANDOFF.md` (keep every line from both sides).
2. **Your internship list wins.** We now have two copies of the same 4 mock internships: mine in `src/data/resume-interview/mock-internships.json` and yours in `src/data/internships.mock.ts` (same ids `mock-int-001` to `mock-int-004`). You own internship data, so after your PR merges I'll switch to yours and delete my copy. Please confirm, and tell me if your ids or `Qualification.keywords` will change.
3. **Confirm the wiring plan.** After your merge I'll change only `useDemoContext()` in `src/app/_resume-interview/shared.tsx`:
   - Profile: `createProfileStore(browserStorage()).load()` from `@/services/matching/profile`. If nothing is saved, fall back to the demo Maya.
   - Internship: `createInternshipService().getById(id)` from `@/services/matching/internships`, with `id` from `localStorage["careerlaunch.selectedInternshipId"]` (I already read and write that key).
   - Optional: show `scoreInternship(profile, internship).missingQualifications` from `@/services/matching/match` next to my keyword table.

   Will those names and shapes stay the same? Does `load()` return a full `UserProfile` (including `resumeText`), or `null` when nothing is saved?
4. **Review PR #13**: https://github.com/JensenBsk/class-agent-project/pull/13. You're already a reviewer.

**Already settled:**
- Skill aliases: your matching already reads my `src/data/resume-interview/skill-aliases.json`. Thanks.
- Your FRATDJ note says my Maya and internships use the old shapes. That's out of date: PR #13 moves them to `Qualification` objects, `Compensation` and the `WorkAuthorization` object.

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

### 2026-11-06 | Built /documents and /interview
**Goal:** Build Member 3's pages in `src/app/<section>/page.tsx` now that the Next.js skeleton is on `main`.
**What I did:**
- Merged `main` (skeleton, Member 4 tracker, Jensen's data definitions) into my branch twice; resolved `HANDOFF.md` conflicts by keeping every line.
- Converted mock data to the new shared shapes (Jensen's request).
- Wrote the services, 43 tests, and both pages; checked them in Chromium on desktop and phone width.
**Files changed:**
- `src/services/resume-interview/*`: new — all Member 3 logic.
- `src/app/documents/page.tsx`, `src/app/documents/DocumentsWorkspace.tsx`: real résumé/cover-letter page.
- `src/app/interview/page.tsx`, `src/app/interview/InterviewWorkspace.tsx`: real interview page.
- `src/app/_resume-interview/shared.tsx`, `resume-interview.module.css`: shared picker, approval prompt, styles (uses Member 5's CSS variables; doesn't edit `globals.css`).
- `src/data/resume-interview/mock-internships.json`, `mock-profile-maya.json`: new shared shapes.
- `tests/resume-interview/*.test.ts`: new.
- `docs/resume-interview-spec.md`: marked implemented; inputs, code map, limits, open questions updated.
**Decisions made:**
- Logic in `src/services/resume-interview/` (Jensen: shared logic goes in `src/services`), not `src/agents/`.
- Rules run on draft TEXT, so student edits are checked too. Placeholders and skills the student lacks can only be fixed by editing; other flags can be confirmed ("Confirmed by student").
- Approving a draft and copying it each need their own approval, tied to the draft version.
**Problems / bugs found:**
- Fixed during the work: the graduation date "2028-05-15" let "15" pass the made-up-number check (dates now only vouch for the year); a shared GPA wasn't counted as the student's own data; duplicate accessible names on the draft cards.
**Next steps:**
1. See "Next steps" under Current status.

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
