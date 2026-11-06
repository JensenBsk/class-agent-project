# Agentic AI Class Project

Shared project folder for our class agentic AI build. Two people, each working with their own AI agent, handing work back and forth through handoff files.

## Team

| Name | Handoff file | Focus |
| --- | --- | --- |
| Jensen | `handoffs/HANDOFF-jensen.md` | |
| Teammate | `handoffs/HANDOFF-teammate.md` | |

Rename `HANDOFF-teammate.md` to your friend's name and update the table above and `HANDOFF.md`.

## Folder layout

```
agentic-project/
├── README.md            ← you are here (project overview + how we work)
├── AGENTS.md            ← rules every AI agent must follow
├── CLAUDE.md            ← points Claude Code at AGENTS.md
├── HANDOFF.md           ← OVERALL status: who's doing what, project log, decisions
├── handoffs/
│   ├── HANDOFF-jensen.md    ← Jensen's agent writes here
│   └── HANDOFF-teammate.md  ← teammate's agent writes here
└── src/                 ← project code goes here
```

## How we work

1. **Start of session:** `git pull`, then tell your agent: "Read AGENTS.md and follow it."
2. **Do the work** on your own branch.
3. **End of session:** your agent updates your handoff file + `HANDOFF.md` (rules in `AGENTS.md`).
4. **Commit and push** the handoff files so the other person sees them.
5. **Picking up from your teammate:** read their handoff file first. Their "Next steps" is your starting point.

## The handoff loop

```
You + your agent work
        ↓
Agent finishes → updates handoffs/HANDOFF-you.md
        ↓
Agent updates HANDOFF.md (overall log + status)
        ↓
You push → teammate pulls
        ↓
Teammate's agent reads both files → continues the work
```

## Rules for humans

- Don't edit your teammate's handoff file. Leave a note in `HANDOFF.md` → **Questions for each other** instead.
- If your agent skips the handoff, tell it: "Update the handoff files per AGENTS.md before we stop."
- Never commit `.env` or API keys.

## Setup

1. Install Git and Python 3.10+ (or whatever stack we pick).
2. Clone the repo: `git clone <repo-url>`
3. Create a `.env` from `.env.example` with your own keys.
