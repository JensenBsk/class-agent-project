# CareerLaunch Agent

CareerLaunch Agent is an AI assistant that guides college students through the internship process, from finding opportunities to preparing for interviews, and asks for approval before anything important happens.

**Status:** app skeleton is set up (Next.js 16 + TypeScript + Vitest). Each section is a placeholder until its owner builds it.

This is our shared project folder for our class agentic AI build. Five people, each working with their own AI agent, handing work back and forth through handoff files.

## Team

| Name | Handoff file | Focus |
| --- | --- | --- |
| Jensen | `handoffs/HANDOFF-jensen.md` | Member 1: product, research and documentation |
| laurentjedi | `handoffs/HANDOFF-laurentjedi.md` | |
| kcarrsdsu | `handoffs/HANDOFF-kcarrsdsu.md` | |
| tommybaird26-star | `handoffs/HANDOFF-tommybaird26-star.md` | |
| BadoGoat1 | `handoffs/HANDOFF-BadoGoat1.md` | |

## Project documents

| Document | What it covers |
| --- | --- |
| `docs/project-brief.md` | The shared source of truth for scope and workstreams |
| `docs/project-overview.md` | Users, journey, requirements, assumptions and risks |
| `docs/business-case.md` | Customers, business model, KPIs and evidence still needed |
| `docs/user-stories.md` | Stories and acceptance criteria |
| `docs/data-definitions.md` | The shared data names everyone builds against |
| `docs/competitor-research.md` | Competitors and sourced market evidence |
| `docs/standout-ideas.md` | Proposed ideas that set us apart |
| `docs/validation-kit.md` | Scripts and targets for testing with real people |

## Folder layout

```
agentic-project/
├── README.md            ← you are here (project overview + how we work)
├── AGENTS.md            ← rules every AI agent must follow
├── CLAUDE.md            ← points Claude Code at AGENTS.md
├── HANDOFF.md           ← OVERALL status: who's doing what, project log, decisions
├── docs/                ← project brief, requirements, business case, stories, data definitions
├── handoffs/
│   ├── HANDOFF-jensen.md    ← Jensen's agent writes here
│   ├── HANDOFF-laurentjedi.md
│   ├── HANDOFF-kcarrsdsu.md
│   ├── HANDOFF-tommybaird26-star.md
│   └── HANDOFF-BadoGoat1.md  ← each person's agent writes only to its own file
└── src/                 ← project code goes here
```

## How we work

1. **Start of session:** `git pull`, then tell your agent: "Read AGENTS.md and follow it."
2. **Do the work** on your own branch.
3. **End of session:** your agent updates your handoff file + `HANDOFF.md` (rules in `AGENTS.md`).
4. **Commit and push** the handoff files so everyone else sees them.
5. **Picking up from your teammate:** read their handoff file first. Their "Next steps" is your starting point. Your finished work has to be merged into `main` before anyone else's agent will see it.

## The handoff loop

```
You + your agent work
        ↓
Agent finishes → updates handoffs/HANDOFF-you.md
        ↓
Agent updates HANDOFF.md (overall log + status)
        ↓
You push and merge into main → teammates pull
        ↓
Teammate's agent reads the handoff files → continues the work
```

## Rules for humans

- Don't edit anyone else's handoff file. Leave a note in `HANDOFF.md` → **Questions for each other** instead.
- If your agent skips the handoff, tell it: "Update the handoff files per AGENTS.md before we stop."
- Never commit `.env` or API keys.

## Setup

You need Node.js 20 or newer and Git.

```bash
git clone https://github.com/JensenBsk/class-agent-project.git
cd class-agent-project
npm install
cp .env.example .env.local   # optional: only needed for real AI calls
npm run dev                  # open http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the app locally with hot reload |
| `npm test` | Run all Vitest tests once (includes a scan for committed secrets) |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Production build (run this before opening a PR) |

### Where code goes

| Path | What lives there | Owner |
| --- | --- | --- |
| `src/types/index.ts` | Shared types from `docs/data-definitions.md`. Import from `@/types` | Member 1 (change via Decisions) |
| `src/app/<section>/page.tsx` | One page per section: `profile`, `internships`, `documents`, `tracker`, `interview` | Owner noted at the top of each page |
| `src/components/` | Shared UI: `StateMessage` (loading/error/empty/success), `MockDataLabel`, `AiGeneratedLabel`, `PageHeader` | Member 5 |
| `src/app/globals.css` | Shared colors and classes (`card`, `button`, `state`, `label`). Use the CSS variables, not hard-coded colors | Member 5 |
| `src/lib/sections.ts` | The nav and home-page section list | Member 5 |
| `tests/` | Vitest tests. Put yours in `tests/<your-area>/` | Everyone |

### Rules for secrets

- Real keys go only in `.env.local`, which git ignores.
- Read keys only in server code (route handlers, server actions). Never prefix a secret with `NEXT_PUBLIC_`, because Next.js sends those to the browser.
- `npm test` fails if it finds something that looks like an API key in the repo.
