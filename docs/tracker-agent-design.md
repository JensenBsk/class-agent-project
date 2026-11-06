# Application Tracker & Agent Orchestration (Member 4)

Owner: BadoGoat1 (Member 4). Code: `src/agents/tracker/`. Tests: `tests/tracker/`.

Plain TypeScript with no framework code, so it drops into the Next.js app as is. Field names match `docs/data-definitions.md`. Storage is in memory for now.

## The 4 jobs

| Job | File | Main exports |
| --- | --- | --- |
| 1. Tracker | `tracker.ts` | `ApplicationTracker` (`add`, `get`, `list`, `edit`, `changeStatus`, `remove`, `reset`), `createApplication`, `editApplication` |
| 2. Statuses | `status.ts` | `ALLOWED_TRANSITIONS`, `canTransition`, `transitionApplication`, `STATUS_LABELS`, `InvalidTransitionError` |
| 3. Next steps | `nextActions.ts` | `recommendNextAction`, `listNextActions`, `buildReminders` |
| 4. Approval | `approvals.ts` | `AgentActivityLog` (`startTask`, `requestApproval`, `approve`, `reject`, `runIfApproved`, `listTasks`, `listPendingApprovals`) |

Shared types (`Application`, `AgentTask`, `ApprovalRequest`, `Notification`) are in `types.ts`. Import everything from `src/agents/tracker/index.ts`.

## Job 1: Tracker

- Adding an internship copies `company`, `title` → `position` and `applicationDeadline`, sets `status: "saved"` and `dateSaved`.
- One application per user per internship (`DuplicateApplicationError`).
- Every method takes `userProfileId`, so one user can never read or change another user's data.
- `list()` sorts by soonest deadline. `reset(userId)` deletes all of that user's applications.
- Status is changed only through `changeStatus` (job 2), never through `edit`.

## Job 2: Statuses

```
saved → preparing → ready_for_review → applied → interview_requested → interview_completed → offer_received
          ↑______________|                               ↑_____________________|  (another round)
rejected:  from applied, interview_requested, interview_completed (final)
withdrawn: from any open status, including offer_received (= declining); can reopen → saved
```

What changes automatically:

| Moving to | Sets |
| --- | --- |
| `applied` | `dateApplied` (today or given date), `followUpDate` = +14 days |
| `interview_requested` | `interviewDate` (if given), clears `followUpDate` |
| `interview_completed` | `followUpDate` = interview date + 7 days |
| `offer_received` / `rejected` / `withdrawn` | clears `followUpDate` |

`applied` only **records** that the student applied. The app never submits anything.

## Job 3: Next steps

`recommendNextAction(app, today)` returns `{ action, reason, priority, dueDate? }`. `action` is what gets stored in `Application.nextAction`.

- Not applied yet: start / finish / review drafts. High priority if the deadline is within 7 days; warns if the deadline passed.
- Applied: wait, then follow up on `followUpDate`.
- Interview requested: add the date if missing, then go to interview prep (high priority within 3 days).
- Interview completed: thank-you note within a day (the student sends it), then follow up after 7 days.
- Never promises a job.

`buildReminders(apps, { today, windowDays = 7 })` returns `Notification`s, all `channel: "in_app"`: `deadline`, `expiring_listing` (saved but not started), `resume_review`, `interview`, `missing_material` (no interview date), `follow_up` (including overdue).

## Job 4: Approval

Rule: an action runs **only** if its `ApprovalRequest` is `approved`.

```ts
const task = log.startTask(userId, "recommend_next_action", "Drafted a follow-up email");
const req  = log.requestApproval(userId, task.id, "Send this follow-up email to Jane Lee", { relatedId: appId });
// UI: show req.action with Approve / Reject
log.approve(userId, req.id);
await log.runIfApproved(userId, req.id, () => sendEmail(...));
```

`runIfApproved` refuses (throws `ApprovalRequiredError`, action not called) when the request is pending, rejected, missing, already used, belongs to another user, or was approved for a different `relatedVersion` of a draft. A rejected request closes the task with "You declined: …" in its summary. `listTasks(userId)` is the activity record.

Use it for: sending any email or message, marking a résumé/cover-letter draft final (Member 3), and any future real submission.

## For other members

- **Member 2:** `add()` takes any object with `id`, `company`, `title`, `applicationDeadline?`, so a full `Internship` works.
- **Member 3:** your proposed optional `relatedVersion` on `ApprovalRequest` is included. Call `requestApproval(..., { relatedId: draftId, relatedVersion })` before finalizing a draft.
- **Member 5:** the tracker and activity log are in-memory classes. Create one of each per session (or swap in localStorage/a DB behind the same methods). Add `vitest` to the app; tests are in `tests/tracker/`.

## Known limits

- In-memory only: data is lost on reload until Member 5 picks storage.
- No status history or undo beyond the allowed backward moves.
- No UI yet (Member 5 / integration).
