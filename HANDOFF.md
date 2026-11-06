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
| Jensen | | Not started | | |
| laurentjedi | | Not started | | |
| kcarrsdsu | | Not started | | |
| tommybaird26-star (Member 5) | UI integration, security, testing, demo — on hold until team picks tech stack | Blocked | `claude/epic-hypatia-t2ya4k` | 2026-11-06 |
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

- 2026-11-06 (tommybaird26-star): No tech stack chosen yet, so Member 5 can't scaffold the shared app shell. Needs Member 1 + Member 5 decision.

## Decisions

| Date | Decision | Why | Who |
| --- | --- | --- | --- |
| 2026-11-06 | `docs/project-brief.md` is the shared source of truth for scope, terminology, workstreams, and definition of done | Team expanded to 5 members; everyone needs one brief | Laurent |

## Questions for each other

- _Leave questions for your teammates here instead of editing their handoff files._
- 2026-11-06 (Laurent): The team is now 5 people. Who takes Members 1–5? Each person should add a `handoffs/HANDOFF-<name>.md` and a row in the table above. Also: we still need to pick a tech stack (repo has no code yet) — suggest Member 1 + Member 5 decide before anyone writes features.

## Project log

Newest first. One line per finished task or session. Only add lines, never rewrite others'.

`YYYY-MM-DD | name | what changed | where (files/branch)`

- 2026-11-06 | tommybaird26-star | On hold until teammates decide tech stack; no code changes | `handoffs/HANDOFF-tommybaird26-star.md`, `HANDOFF.md`
- 2026-11-06 | tommybaird26-star | Claimed Member 5 (integration/security/testing/demo); inspected repo, no code yet | `handoffs/HANDOFF-tommybaird26-star.md`, `HANDOFF.md`, branch `claude/epic-hypatia-t2ya4k`
- 2026-11-05 | Jensen | Merged Laurent's project brief and start-up guide into main | `docs/project-brief.md`, `HANDOFF.md`
- 2026-11-06 | Laurent | Added member/workstream/branch table and start-up instructions | `HANDOFF.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-06 | Laurent | Added the CareerLaunch Agent team brief (5 workstreams, data concepts, demo, definition of done) | `docs/project-brief.md`, branch `claude/practical-gauss-xpx31v`
- 2026-11-05 | Jensen | Added BadoGoat1 to the team | README.md, HANDOFF.md, handoffs/HANDOFF-BadoGoat1.md
- 2026-11-05 | Jensen | Updated rules and handoff files for four people | AGENTS.md, CLAUDE.md, README.md, HANDOFF.md, handoffs/
- 2026-11-05 | Jensen | Created project folder, agent rules, and handoff files | repo root
