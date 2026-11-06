# CareerLaunch Agent

CareerLaunch Agent is an AI assistant that guides college students through the internship process, from finding opportunities to preparing for interviews, and asks for approval before anything important happens.

**Status:** planning. There is no app code yet, and the tech stack hasn't been picked.

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

1. Install Git.
2. Clone the repo: `git clone https://github.com/JensenBsk/class-agent-project.git`

There is no app to run yet. Instructions for running it, and any `.env` setup, will be added here once the tech stack is picked.
