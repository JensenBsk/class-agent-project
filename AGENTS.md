# Rules for AI Agents

Every AI agent working in this repo (Claude Code, Cursor, Copilot, ChatGPT, anything) MUST follow these rules. Humans: point your agent at this file at the start of every session.

## 1. Before you start any work

1. Read `HANDOFF.md` (the overall project status).
2. Read **every** file in `handoffs/` so you know what everyone else's agents did last.
3. Check `git pull` has been run so you're on the latest code.
4. If your task overlaps with something marked "In progress" by someone else, stop and tell your human before touching it.

## 2. While you work

- Only work on the task your human gave you. Don't "fix" other people's code unasked.
- Keep changes small. One task = one branch: `yourname/short-task-name`.
- Never commit secrets (`.env`, API keys, passwords).
- Never delete files you didn't create without asking your human first.
- If you get stuck or a decision could go either way, ask your human instead of guessing.

## 3. When you finish (thinking, a task, or a work session) - REQUIRED

You are not done until both of these are updated:

### a) Your person's handoff file
Update `handoffs/HANDOFF-<name>.md` for the human you're working with.
- Replace the **Current status** section with the latest state.
- Add a new entry at the TOP of the **Session log** using the template in that file.
- Only edit YOUR person's file. Never edit anyone else's handoff file.

### b) The overall file
Update `HANDOFF.md`:
- Update that person's row in the **Who's doing what** table.
- Add ONE line at the TOP of the **Project log** (newest first):
  `YYYY-MM-DD | name | what changed | where (files/branch)`
- If you made a decision that affects everyone, add it to **Decisions**.
- If something is now blocked or broken, add it to **Blockers**.

### c) Tell your human
End with a 2-3 line summary of what you did and what's next, and remind them to commit and push the handoff files.

## 4. Handoff writing rules

- Write for someone who has zero context. Name exact files, functions, and branches.
- Say what's done, what's half-done, and what's broken. Be honest about bugs.
- "Next steps" must be specific enough that anyone else's agent could pick it up cold.
- Keep it short. Bullets over paragraphs.
- Use real dates (YYYY-MM-DD), not "today" or "yesterday".

## 5. Avoiding merge conflicts

- Each person only edits their own `handoffs/` file.
- In `HANDOFF.md`, only edit your own row and only ADD lines to the logs (never rewrite others' lines).
- Always `git pull` before editing handoff files, and push right after.
