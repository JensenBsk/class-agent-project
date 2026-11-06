# Overall Project Handoff

The single place to see where the whole project stands. Agents update this at the end of every task or session (see `AGENTS.md`). Read this first, then the personal files in `handoffs/`.

**Project goal:** CareerLaunch Agent — an approval-based agentic assistant that guides college students from internship discovery through matching, résumé/cover-letter drafts, application tracking, and interview prep. Full brief: `docs/project-brief.md`.
**Due date:** _YYYY-MM-DD_
**Last updated:** 2026-11-06 by tommybaird26-star

## How to start (every team member)

Find your member number below, then start your AI agent session like this:

1. Paste the **full project brief** first (it's saved in `docs/project-brief.md`).
2. Add this sentence at the end, filled in with your number and workstream:

   > I am Member [number]. My assigned workstream is [workstream]. Follow the shared project brief, inspect the repository first, and only then begin implementation.

   Example: *"I am Member 2. My assigned workstream is Profile creation, internship data, matching and ranking. Follow the shared project brief, inspect the repository first, and only then begin implementation."*

| Member | Main responsibility | Branch |
| --- | --- | --- |
| 1 | Product requirements, use case, business case, documentation | `feature/product-docs` |
| 2 | Profile creation, internship data, matching and ranking | `feature/matching` |
| 3 | Résumé, cover letter, and interview preparation | `feature/resume-interview` |
| 4 | Application tracker, workflow state, next actions | `feature/tracker-agent` |
| 5 | UI integration, security, testing, and final demo | `feature/integration-testing` |

## Who's doing what

Each person/agent only edits their own row.

| Person | Working on now | Status | Branch | Last update |
| --- | --- | --- | --- | --- |
| Jensen | Member 1: competitor research, standout ideas and validation kit | Ready for review | `jensen/market-research` | 2026-11-05 |
| laurentjedi | | Not started | | |
| kcarrsdsu | Member 3: `/documents` and `/interview` pages built (services, 43 tests); PR #13 | Ready for review | `claude/epic-ritchie-yx4bzq` | 2026-11-06 |
| tommybaird26-star (Member 5) | Next.js app skeleton merged into `main` (PR #12); next: help port Member 2 code | Done | `main` | 2026-11-06 |
| BadoGoat1 | Member 4: `/tracker` page + home next-action card (logic merged in PR #11) | Ready for review | `claude/happy-euler-34uh8h` | 2026-11-06 |

Status options: Not started · In progress · Blocked · Ready for review · Done

## Milestones

- [ ] Idea and scope locked
- [x] Repo set up, everyone can run the code
- [ ] First agent run (agent completes a goal using one tool)
- [ ] All features working end to end
- [ ] Tests and README done
- [ ] Demo rehearsed

## Blockers

- _none yet_

## Decisions

| Date | Decision | Why | Who |
| --- | --- | --- | --- |
| 2026-11-05 | After reviewing PR #8, Next.js with TypeScript stays. Use the App Router in `src/app`, not a `src/pages` folder. Shared logic goes in `src/services` | PR #8 proposed plain JavaScript. Keeping one stack avoids a rival setup, and most of its logic is plain functions that can move across | Jensen (Member 1). Member 5 still needs to confirm |
| 2026-11-05 | `docs/data-definitions.md` updated: takes Member 2's `Qualification` and `MatchScore` shapes, and approves Member 3's optional extras. Member 3's Maya is the one demo user | Member 2's matching crashed on Member 3's data, so everyone needs one shape | Jensen (Member 1) |
| 2026-11-05 | Tech stack: Next.js with TypeScript in one app. Tests use Vitest. Internships come from labeled mock data, with no database at first. AI calls and keys stay on the server. Host on Vercel | One codebase for all five people, and shared types match `docs/data-definitions.md` | Jensen (Member 1). Member 5 still needs to confirm |
| 2026-11-06 | Member 5 confirms the Next.js stack. Versions: Next 16.4.5, React 19, TypeScript 5, Vitest 5.1.0 (older Next 15/Vitest 3 had critical `npm audit` findings). Shared types live in `src/types/index.ts`, imported as `@/types` | One app everyone builds into; 0 known vulnerabilities | tommybaird26-star (Member 5) |
| 2026-11-05 | Jensen is Member 1 | Claimed the product, research and documentation workstream | Jensen |
| 2026-11-06 | `docs/project-brief.md` is the shared source of truth for scope, terminology, workstreams, and definition of done | Team expanded to 5 members; everyone needs one brief | Laurent |

## Questions for each other

- _Leave questions for your teammates here instead of editing their handoff files._
- 2026-11-05 (Jensen, for Laurent): PR #8 is good work but is on hold. After the Next.js setup is on `main`, please: (1) move your logic into the new app and drop `scripts/serve.js`; (2) rename fields to match `docs/data-definitions.md` (`deadline` to `applicationDeadline`, `lastChecked` to `lastCheckedAt` as a timestamp, `in-person` to `in_person`, `any` to `no_preference`, `minHourlyRate` to `salaryExpectation`, `nice-to-have` to `nice_to_have`), and add `userProfileId` to `MatchScore`; (3) use Member 3's Maya; (4) set mock deadlines relative to today; (5) fix major matching so "CS" doesn't match "statistics", with a test; (6) move your notes into `handoffs/HANDOFF-laurentjedi.md`.
- 2026-11-05 (Jensen, for kcarrsdsu): Your optional extras are approved. Please update `src/data/resume-interview/` and your spec for the new `Qualification`, `Compensation` and `WorkAuthorization` shapes. `relatedVersion?` is still Member 4's call.
- 2026-11-05 (Jensen): Proposal: lead with "provably true" instead of "complete workflow," and add Proof Receipts and Gap-to-Proof Sprints to the prototype. Reasoning is in `docs/competitor-research.md` and `docs/standout-ideas.md`. Please reply here with yes, no or changes.
- 2026-11-05 (Jensen): Everyone: pick two students to interview using `docs/validation-kit.md`. Which school's career center should we approach, and which tools does it already provide?
- 2026-11-05 (Jensen): Tech stack is recorded under Decisions. Member 5, please confirm or object, then set up the shared app so everyone can branch from it.
- 2026-11-05 (Jensen): Everyone please review `docs/data-definitions.md` before writing features, and object here if a name or field won't work for your workstream.
- 2026-11-06 (Laurent): The team is now 5 people. Who takes Members 1–5? Each person should add a `handoffs/HANDOFF-<name>.md` and a row in the table above. Also: we still need to pick a tech stack (repo has no code yet) — suggest Member 1 + Member 5 decide before anyone writes features.
- 2026-11-06 (BadoGoat1): I'm Member 4 (application tracker + agent orchestration). Members 1 and 3: please add the tech stack to **Decisions** when chosen. I'll start then. Also need agreed fields for `Internship`/`UserProfile` before wiring the tracker to them.
- 2026-11-06 (BadoGoat1): Member 4 code is ready in `src/agents/tracker/` (see `docs/tracker-agent-design.md`). Member 3: your `relatedVersion?` on `ApprovalRequest` is in. Member 5: please add Vitest to the app skeleton so `tests/tracker/` runs.
- 2026-11-06 (BadoGoat1): `/tracker` is live. Member 5: I replaced the home page "Next action" card body (it was marked for Member 4) with `HomeNextAction`; your empty state is kept as the fallback. Member 2: to add from your internships page, call `useTracker().update(({ tracker }) => tracker.add(userId, internship))` from `@/agents/tracker/useTracker`.
- 2026-11-06 (kcarrsdsu, Member 3): Please review `docs/resume-interview-spec.md`. It uses `docs/data-definitions.md` names exactly and only ADDS optional fields (§4, marked [PROPOSED]). Jensen: OK those extras? Member 2: OK sharing `src/data/resume-interview/skill-aliases.json` for matching? Member 4: OK adding optional `relatedVersion?` to `ApprovalRequest` (§5)? Member 5: Member 3 code will wait for the Next.js skeleton on `main`.
- 2026-11-06 (kcarrsdsu, Member 3): Thanks, Jensen. I'll update `src/data/resume-interview/` and my spec for the new `Qualification`, `Compensation` and `WorkAuthorization` shapes next. Laurent: point 5 of my PR #8 review offered to switch to your Maya, but Jensen has since picked mine as the one demo user, so please ignore that part.
- 2026-11-06 (kcarrsdsu, Member 3): `/documents` and `/interview` are built (PR #13). Member 2: when your profile is in the app, swap `useDemoContext()` in `src/app/_resume-interview/shared.tsx` for the real profile; I already read your `careerlaunch.selectedInternshipId` key. Member 4: approved drafts could move an Application to `ready_for_review` on `/tracker`; your call. Member 5: please add both pages to the demo script.
- 2026-11-06 (kcarrsdsu → **laurentjedi, Member 2**) **Code: ZYN**: reply to your FRATDJ note. Please (1) open a PR for `claude/practical-gauss-xpx31v`, (2) confirm your `src/data/internships.mock.ts` replaces my mock internships, (3) confirm the wiring plan and function names, (4) review PR #13. Full details: `handoffs/HANDOFF-kcarrsdsu.md` → "For Laurent (Member 2) — Code: ZYN".

## Project log

Newest first. One line per finished task or session. Only add lines, never rewrite others'.

`YYYY-MM-DD | name | what changed | where (files/branch)`

- 2026-11-06 | kcarrsdsu | Left reply note for laurentjedi (code ZYN): PR for Member 2 branch, one internship list, wiring plan, review #13 | `handoffs/HANDOFF-kcarrsdsu.md`, `HANDOFF.md`, branch `claude/epic-ritchie-yx4bzq`
- 2026-11-06 | kcarrsdsu | Built `/documents` (résumé + cover letter drafts, rule checks, approvals) and `/interview` (questions, STAR talking points, practice feedback); mock data on new shared shapes; 43 tests, 129/129 total pass | `src/app/documents/`, `src/app/interview/`, `src/services/resume-interview/`, `tests/resume-interview/`, branch `claude/epic-ritchie-yx4bzq`
- 2026-11-06 | kcarrsdsu | Reviewed Laurent's PR #8 (Comment, 9 line notes); noted my mock data must move to the new shared shapes | `handoffs/HANDOFF-kcarrsdsu.md`, `HANDOFF.md`, branch `claude/epic-ritchie-yx4bzq`
- 2026-11-06 | BadoGoat1 | Built `/tracker` page (next actions, reminders, approval panel, status changes, saved in browser) and home "Next action" card; 86 tests pass | `src/app/tracker/`, `src/components/tracker/`, `src/agents/tracker/`, `src/app/page.tsx`, branch `claude/happy-euler-34uh8h`
- 2026-11-06 | tommybaird26-star | Merged the Next.js app skeleton into main. Everyone: `git pull`, `npm install`, `npm run dev` | PR #12, `main`
- 2026-11-06 | tommybaird26-star | Synced skeleton with latest main, updated shared types to new data definitions, opened PR | `src/types/index.ts`, `tests/integration/`, branch `claude/epic-hypatia-t2ya4k`
- 2026-11-06 | tommybaird26-star | Next.js + TS + Vitest app skeleton: shared types, nav/layout, state components, security headers, secrets test, README setup | `src/`, `tests/`, config files, `README.md`, branch `claude/epic-hypatia-t2ya4k`
- 2026-11-06 | tommybaird26-star | On hold until teammates decide tech stack; no code changes | `handoffs/HANDOFF-tommybaird26-star.md`, `HANDOFF.md`
- 2026-11-06 | tommybaird26-star | Claimed Member 5 (integration/security/testing/demo); inspected repo, no code yet | `handoffs/HANDOFF-tommybaird26-star.md`, `HANDOFF.md`, branch `claude/epic-hypatia-t2ya4k`
- 2026-11-06 | BadoGoat1 | Built Member 4 tracker, status rules, next actions/reminders, approval gate + 57 tests | `src/agents/tracker/`, `tests/tracker/`, `docs/tracker-agent-design.md`, branch `claude/happy-euler-34uh8h`
- 2026-11-06 | BadoGoat1 | Took Member 4 (tracker + orchestration); waiting on tech stack before coding | `handoffs/HANDOFF-BadoGoat1.md`, `HANDOFF.md`, branch `claude/happy-euler-34uh8h`
- 2026-11-06 | kcarrsdsu | Member 3 spec (data shapes, no-fabrication rules, test plan) + mock data (Maya, 4 fictional internships, interview question bank, skill aliases) | `docs/resume-interview-spec.md`, `src/data/resume-interview/`, branch `claude/epic-ritchie-yx4bzq`
- 2026-11-05 | Jensen | Reviewed PRs #7 and #8, merged #7, held #8, and updated the shared data definitions | `docs/data-definitions.md`, `HANDOFF.md`
- 2026-11-05 | Jensen | Added competitor research, standout ideas and validation kit, and updated the business case | `docs/`, `README.md`, branch `jensen/market-research`
- 2026-11-05 | Jensen | Recorded the tech stack decision | `HANDOFF.md`, `README.md`, `docs/project-overview.md`
- 2026-11-05 | Jensen | Wrote product overview, business case, user stories and shared data definitions, and updated the README | `docs/`, `README.md`, branch `feature/product-docs`
- 2026-11-05 | Jensen | Merged Laurent's project brief and start-up guide into main | `docs/project-brief.md`, `HANDOFF.md`
- 2026-11-06 | Laurent | Added member/workstream/branch table and start-up instructions | `HANDOFF.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-06 | Laurent | Added the CareerLaunch Agent team brief (5 workstreams, data concepts, demo, definition of done) | `docs/project-brief.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-05 | Jensen | Added BadoGoat1 to the team | README.md, HANDOFF.md, handoffs/HANDOFF-BadoGoat1.md
- 2026-11-05 | Jensen | Updated rules and handoff files for four people | AGENTS.md, CLAUDE.md, README.md, HANDOFF.md, handoffs/
- 2026-11-05 | Jensen | Created project folder, agent rules, and handoff files | repo root
