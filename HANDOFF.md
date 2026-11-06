# Overall Project Handoff

The single place to see where the whole project stands. Agents update this at the end of every task or session (see `AGENTS.md`). Read this first, then the personal files in `handoffs/`.

**Project goal:** CareerLaunch Agent — an approval-based agentic assistant that guides college students from internship discovery through matching, résumé/cover-letter drafts, application tracking, and interview prep. Full brief: `docs/project-brief.md`.
**Due date:** _YYYY-MM-DD_
**Last updated:** 2026-11-05 by Jensen

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
| kcarrsdsu | Member 3: résumé, cover letter, interview prep — spec + mock data done; code waits for app skeleton | In progress | `claude/epic-ritchie-yx4bzq` | 2026-11-06 |
| tommybaird26-star | | Not started | | |
| BadoGoat1 | | Not started | | |

Status options: Not started · In progress · Blocked · Ready for review · Done

## Milestones

- [ ] Idea and scope locked
- [ ] Repo set up, everyone can run the code
- [ ] First agent run (agent completes a goal using one tool)
- [ ] All features working end to end
- [ ] Tests and README done
- [ ] Demo rehearsed

## Blockers

- _none yet_

## Decisions

| Date | Decision | Why | Who |
| --- | --- | --- | --- |
| 2026-11-05 | Tech stack: Next.js with TypeScript in one app. Tests use Vitest. Internships come from labeled mock data, with no database at first. AI calls and keys stay on the server. Host on Vercel | One codebase for all five people, and shared types match `docs/data-definitions.md` | Jensen (Member 1). Member 5 still needs to confirm |
| 2026-11-05 | Jensen is Member 1 | Claimed the product, research and documentation workstream | Jensen |
| 2026-11-06 | `docs/project-brief.md` is the shared source of truth for scope, terminology, workstreams, and definition of done | Team expanded to 5 members; everyone needs one brief | Laurent |

## Questions for each other

- _Leave questions for your teammates here instead of editing their handoff files._
- 2026-11-05 (Jensen): Proposal: lead with "provably true" instead of "complete workflow," and add Proof Receipts and Gap-to-Proof Sprints to the prototype. Reasoning is in `docs/competitor-research.md` and `docs/standout-ideas.md`. Please reply here with yes, no or changes.
- 2026-11-05 (Jensen): Everyone: pick two students to interview using `docs/validation-kit.md`. Which school's career center should we approach, and which tools does it already provide?
- 2026-11-05 (Jensen): Tech stack is recorded under Decisions. Member 5, please confirm or object, then set up the shared app so everyone can branch from it.
- 2026-11-05 (Jensen): Everyone please review `docs/data-definitions.md` before writing features, and object here if a name or field won't work for your workstream.
- 2026-11-06 (Laurent): The team is now 5 people. Who takes Members 1–5? Each person should add a `handoffs/HANDOFF-<name>.md` and a row in the table above. Also: we still need to pick a tech stack (repo has no code yet) — suggest Member 1 + Member 5 decide before anyone writes features.
- 2026-11-06 (kcarrsdsu, Member 3): Please review `docs/resume-interview-spec.md`. It uses `docs/data-definitions.md` names exactly and only ADDS optional fields (§4, marked [PROPOSED]). Jensen: OK those extras? Member 2: OK sharing `src/data/resume-interview/skill-aliases.json` for matching? Member 4: OK adding optional `relatedVersion?` to `ApprovalRequest` (§5)? Member 5: Member 3 code will wait for the Next.js skeleton on `main`.

## Project log

Newest first. One line per finished task or session. Only add lines, never rewrite others'.

`YYYY-MM-DD | name | what changed | where (files/branch)`

- 2026-11-06 | kcarrsdsu | Member 3 spec (data shapes, no-fabrication rules, test plan) + mock data (Maya, 4 fictional internships, interview question bank, skill aliases) | `docs/resume-interview-spec.md`, `src/data/resume-interview/`, branch `claude/epic-ritchie-yx4bzq`
- 2026-11-05 | Jensen | Added competitor research, standout ideas and validation kit, and updated the business case | `docs/`, `README.md`, branch `jensen/market-research`
- 2026-11-05 | Jensen | Recorded the tech stack decision | `HANDOFF.md`, `README.md`, `docs/project-overview.md`
- 2026-11-05 | Jensen | Wrote product overview, business case, user stories and shared data definitions, and updated the README | `docs/`, `README.md`, branch `feature/product-docs`
- 2026-11-05 | Jensen | Merged Laurent's project brief and start-up guide into main | `docs/project-brief.md`, `HANDOFF.md`
- 2026-11-06 | Laurent | Added member/workstream/branch table and start-up instructions | `HANDOFF.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-06 | Laurent | Added the CareerLaunch Agent team brief (5 workstreams, data concepts, demo, definition of done) | `docs/project-brief.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-05 | Jensen | Added BadoGoat1 to the team | README.md, HANDOFF.md, handoffs/HANDOFF-BadoGoat1.md
- 2026-11-05 | Jensen | Updated rules and handoff files for four people | AGENTS.md, CLAUDE.md, README.md, HANDOFF.md, handoffs/
- 2026-11-05 | Jensen | Created project folder, agent rules, and handoff files | repo root
