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
| Jensen | Member 1: product, research and documentation | Ready for review | `feature/product-docs` | 2026-11-05 |
| laurentjedi | | Not started | | |
| kcarrsdsu | | Not started | | |
| tommybaird26-star | | Not started | | |
| BadoGoat1 | Member 4: tracker, statuses, next actions, approvals (`src/agents/tracker/`) | Ready for review | `claude/happy-euler-34uh8h` | 2026-11-06 |

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
- 2026-11-05 (Jensen): Tech stack is recorded under Decisions. Member 5, please confirm or object, then set up the shared app so everyone can branch from it.
- 2026-11-05 (Jensen): Everyone please review `docs/data-definitions.md` before writing features, and object here if a name or field won't work for your workstream.
- 2026-11-06 (Laurent): The team is now 5 people. Who takes Members 1–5? Each person should add a `handoffs/HANDOFF-<name>.md` and a row in the table above. Also: we still need to pick a tech stack (repo has no code yet) — suggest Member 1 + Member 5 decide before anyone writes features.
- 2026-11-06 (BadoGoat1): I'm Member 4 (application tracker + agent orchestration). Members 1 and 3: please add the tech stack to **Decisions** when chosen. I'll start then. Also need agreed fields for `Internship`/`UserProfile` before wiring the tracker to them.
- 2026-11-06 (BadoGoat1): Member 4 code is ready in `src/agents/tracker/` (see `docs/tracker-agent-design.md`). Member 3: your `relatedVersion?` on `ApprovalRequest` is in. Member 5: please add Vitest to the app skeleton so `tests/tracker/` runs.

## Project log

Newest first. One line per finished task or session. Only add lines, never rewrite others'.

`YYYY-MM-DD | name | what changed | where (files/branch)`

- 2026-11-06 | BadoGoat1 | Built Member 4 tracker, status rules, next actions/reminders, approval gate + 57 tests | `src/agents/tracker/`, `tests/tracker/`, `docs/tracker-agent-design.md`, branch `claude/happy-euler-34uh8h`
- 2026-11-06 | BadoGoat1 | Took Member 4 (tracker + orchestration); waiting on tech stack before coding | `handoffs/HANDOFF-BadoGoat1.md`, `HANDOFF.md`, branch `claude/happy-euler-34uh8h`
- 2026-11-05 | Jensen | Recorded the tech stack decision | `HANDOFF.md`, `README.md`, `docs/project-overview.md`
- 2026-11-05 | Jensen | Wrote product overview, business case, user stories and shared data definitions, and updated the README | `docs/`, `README.md`, branch `feature/product-docs`
- 2026-11-05 | Jensen | Merged Laurent's project brief and start-up guide into main | `docs/project-brief.md`, `HANDOFF.md`
- 2026-11-06 | Laurent | Added member/workstream/branch table and start-up instructions | `HANDOFF.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-06 | Laurent | Added the CareerLaunch Agent team brief (5 workstreams, data concepts, demo, definition of done) | `docs/project-brief.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-05 | Jensen | Added BadoGoat1 to the team | README.md, HANDOFF.md, handoffs/HANDOFF-BadoGoat1.md
- 2026-11-05 | Jensen | Updated rules and handoff files for four people | AGENTS.md, CLAUDE.md, README.md, HANDOFF.md, handoffs/
- 2026-11-05 | Jensen | Created project folder, agent rules, and handoff files | repo root
