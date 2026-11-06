# CareerLaunch Agent: Product Overview

Owner: Member 1 (Jensen). This document turns `docs/project-brief.md` into requirements the team can build and test. If the two ever disagree, the brief wins until the team records a change in `HANDOFF.md` under **Decisions**.

## What we are building

CareerLaunch Agent guides a college student through an internship search, from finding opportunities to preparing for interviews. It is a workflow with a plan and approval steps, not a chatbot: it gathers information, recommends next steps, keeps track of progress, and asks before doing anything important.

**The one line for judges:** a student's internship search is several disconnected jobs, and CareerLaunch runs them as one workflow that the student stays in control of.

## Who it is for

### Primary user: Maya, the student

Maya is applying for internships while taking classes and working part-time. She doesn't know which roles are realistic, listings are spread across many sites, tailoring a résumé takes too long, and she misses deadlines. She wants guidance, but wants the final say on every decision.

**What success looks like for Maya:** she always knows which internships are worth her time and what to do next, and nothing goes out without her approval.

### Secondary user and likely buyer: Daniel, the career advisor

Daniel is a fictional advisor at a university career center. He cannot give every student individual attention, so he wants routine help handled and needs to see which students need a person.

The prototype does not need to build Daniel's dashboard. He is here because the business case depends on him, and judges will ask who pays.

## User journey

| Stage | What Maya does | What the agent does | Maya stays in control because |
| --- | --- | --- | --- |
| 1. Profile | Enters background, skills and preferences | Spots gaps and asks only necessary follow-ups | She can edit or reset her data at any time |
| 2. Discovery | Reviews listings | Searches approved sources or labeled mock data and removes duplicates | Every listing shows its source and last-checked date |
| 3. Ranking | Compares matches | Scores each match and explains it | She sees why, not just a number |
| 4. Documents | Reviews drafts | Suggests changes and drafts a résumé and cover letter | Nothing is finalized until she approves, and invented claims are not allowed |
| 5. Tracker | Records progress | Tracks status and recommends the next action | She changes her own status |
| 6. Interview prep | Practices | Creates questions, STAR guidance and feedback | Feedback never predicts a hiring result |
| 7. Reminders | Opts in | Flags upcoming dates and missing items | Nothing is sent without her approval |

## Scope for the prototype

### Must have

These are the ten functional requirements from the brief. Stories are in `docs/user-stories.md`.

| ID | Requirement | Owner |
| --- | --- | --- |
| R1 | Profile or onboarding screen | Member 2 |
| R2 | Internship opportunity screen | Member 2 |
| R3 | Matching or ranking explanation | Member 2 |
| R4 | Résumé or cover-letter assistance | Member 3 |
| R5 | Application tracker | Member 4 |
| R6 | Interview preparation | Member 3 |
| R7 | Visible next-action recommendation | Member 4 |
| R8 | Approval steps before consequential actions | Member 4 |
| R9 | Clear error and empty states | Member 5 |
| R10 | A way to reset or edit user data | Member 2 |

### Out of scope for the prototype

- Submitting applications or sending email for the user
- Live job-board integrations, unless the mock version already works
- Real accounts, or storing real student data
- The advisor dashboard and university billing

## Rules that apply to every feature

1. **Never invent anything:** no made-up experience, skills, listings or company facts.
2. **Ask before consequential actions:** approval comes before anything is finalized, sent or submitted.
3. **Label what things are:** facts, recommendations, AI-generated text and mock data must all look different from each other.
4. **Explain recommendations:** every score or suggestion says why.
5. **Make no guarantees:** never predict or promise an interview, offer or hiring result.
6. **Don't discriminate:** protected characteristics are never collected or used in ranking.
7. **Minimize data:** collect only what a feature needs, and use made-up data in the demo.

## Assumptions

Nothing below has been tested with real students or career centers yet.

| Assumption | How we would test it |
| --- | --- |
| Students find coordinating the whole process harder than any single step | Interview 5 to 10 students |
| Explanations make students trust rankings more | Show a score with and without an explanation |
| Career centers would pay for a tool like this | Talk to one career-center staff member |
| Students will type in enough profile detail to get good matches | Time a real student completing onboarding |

## Risks

| Risk | Impact | What we do about it |
| --- | --- | --- |
| Five workstreams don't fit together | Demo breaks | Agree on `docs/data-definitions.md` before writing features |
| Mock data is mistaken for real listings | Loss of trust, false demo claims | Label mock data on every screen where it appears |
| AI adds a false qualification | Harms the student and breaks a core promise | Flag any claim not found in the student's profile or résumé |
| Scope grows past the deadline | Unfinished demo | Finish the Maya demo before adding anything else |
| Résumés contain personal information | Privacy failure | Use fictional demo data and never commit real résumés |
| Live AI fails during the demo | Demo stalls | Keep a labeled fallback path, agreed with Member 5 |

## Open decisions

| Decision | Owner | Needed before |
| --- | --- | --- |
| Due date and competition judging criteria | Team | Scope is locked |
| Who takes Members 2 to 5 | Team | Anyone starting work |
| Which AI provider, if any, is used, and who pays for it | Team | Member 3 starts |

## Definition of done

The checklist in `docs/project-brief.md` is the definition of done. The final test is the 15-step Maya demo in that brief, run from start to finish.
