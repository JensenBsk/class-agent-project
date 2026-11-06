# CareerLaunch Agent: Ideas That Set Us Apart

Owner: Member 1 (Jensen). **Status: proposal.** Nothing here changes the project scope until the team agrees in `HANDOFF.md` under **Decisions**. The reasoning comes from `docs/competitor-research.md`.

## The new angle

> Every other AI tool makes your application sound better. CareerLaunch makes it provably true.

Employers are losing trust in AI-polished applications, and most tools push students toward more polish. We go the other way, which also fits the brief's existing promise never to invent qualifications.

## Recommended: three ideas to add

### 1. Proof Receipts

Every claim in a résumé draft links to where it came from, such as a class project, a job or an uploaded file. Anything with no source is marked **unproven**, and the student must supply proof or remove it before approving the draft.

- **Why it stands out:** it turns an "AI safety rule" into a feature students and advisors can actually see.
- **Why it's agentic:** the agent checks its own work against evidence.
- **Effort:** small. Member 3's draft spec (`docs/resume-interview-spec.md` on branch `claude/epic-ritchie-yx4bzq`) already proposes `EvidenceRef` and `VerificationFlag`, which would provide most of this.
- **Keep it honest:** a claim the student merely confirms is not the same as one backed by a file or project. The screen should label it "confirmed by student," not "proven."
- **Owner:** Member 3.

### 2. Gap-to-Proof Sprints

When a missing qualification is "trainable," the agent doesn't just report it. It plans a small real project, such as "build a two-page sales analysis in Excel this weekend." When the student finishes, that work becomes a new Proof Receipt and the match score updates.

- **Why it stands out:** other tools tell students what's missing, and this helps them earn it, truthfully.
- **Why it's agentic:** it plans, tracks progress, updates its memory, and changes its recommendation.
- **Effort:** medium. It can be a simple status on a task in the prototype.
- **Owners:** Members 2 and 4.

### 3. The "Try to Make It Lie" demo

During the demo, a judge asks the agent to add a fake skill or award. It refuses to put it in as true, explains why, and offers an honest alternative.

- **Why it stands out:** judges remember what they personally tried, and it proves the promise live.
- **Effort:** very small once Proof Receipts exist.
- **Owner:** Member 5.

## Worth doing if time allows

### 4. The Skip List
The agent recommends which internships **not** to apply to, with its reasons: a poor match, a closing deadline, or warning signs such as a very old or repeatedly reposted listing.

**Careful:** it can say "this listing looks stale," but must never state a listing is fake, because we can't know that.

### 5. Class-aware deadline planner
The agent works backward from each deadline around the student's exams and work shifts, so Maya gets a weekly plan instead of just a due date.

### 6. Advisor Brief
When a student is stuck, the agent writes a one-page summary for a career advisor, with the student's approval: their goals, proof and blockers. This makes career centers a partner and gives the university buyer a reason to care.

## Not recommended

| Idea | Why not |
| --- | --- |
| Auto-applying to many internships | Breaks our approval promise and adds to the problem employers are complaining about |
| Beating AI-résumé detectors | Dishonest, and the opposite of our angle |
| Replacing Handshake | Unrealistic for a new product |
| Predicting who gets hired | The brief forbids it, and we couldn't back it up |

## What the team would need to agree on

1. Replace "a complete workflow" with "provably true" as the lead message.
2. Add Proof Receipts and Gap-to-Proof Sprints to the prototype scope.
3. If agreed, add the agreed evidence fields to `docs/data-definitions.md` before Member 3 builds drafts.
