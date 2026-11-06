# Profile & Internship Matching (Member 2)

Workstream: **Profile creation, internship data, matching and ranking.** Covers brief Stages 1–3.

Pages: `/profile` and `/internships`. Run with `npm run dev`; test with `npm test`.

## Files

| File | What it does |
| --- | --- |
| `src/app/profile/page.tsx`, `ProfileForm.tsx`, `ConfirmDialog.tsx`, `profile.module.css` | Profile form: follow-up questions, conflict checks, save / undo / load demo / delete my data (with confirmation) |
| `src/app/internships/page.tsx`, `InternshipsView.tsx`, `MatchCard.tsx`, `internships.module.css` | Ranked list, filters, explanations, next action, select an internship |
| `src/services/matching/profile.ts` | `normalizeProfile`, `demoProfile` (Member 3's Maya), `reviewProfile`, `createProfileStore`, storage keys |
| `src/services/matching/internships.ts` | `createInternshipService(source)`: search, filter, de-duplicate |
| `src/services/matching/match.ts` | `scoreInternship`, `rankInternships`: explainable scoring |
| `src/services/matching/text.ts` | Whole-word matching, Member 3's skill aliases, major abbreviations, dates |
| `src/data/internships.mock.ts` | 11 **fictional** listings with deadlines relative to today (1 duplicate, 1 expired on purpose) |
| `tests/matching/*` | 53 tests: services, fairness, and both pages |

All objects use the shared types in `src/types/index.ts` (`UserProfile`, `Internship`, `MatchScore`).

## How scoring works

Rule-based, so every point is explained. Weights add up to 100:

| Factor | Max | Rule |
| --- | --- | --- |
| Skills | 30 | Required qualifications count double, preferred single |
| Academics | 10 | Full points if your major is listed, or the role is open to any major |
| Interests | 10 | +6 preferred industry, +4 career goals mention a role tag |
| Experience | 10 | 0 items = none, 1–3 = some, 4+ = significant, compared to the role |
| Location | 15 | City match plus work-mode preference |
| Work authorization | 10 | Needs sponsorship and none offered: **blocked**, shown with a reason |
| Deadline | 5 | Sooner deadlines score a little higher; passed: **expired** |
| Compensation | 10 | Compared to `salaryExpectation`; unpaid or unlisted pay is flagged |

Labels: 75+ Strong, 60+ Good, 40+ Possible, else Weak. Order: eligible, then blocked, then expired; then score; then sooner deadline.

Missing qualifications are `critical` (required, not quickly learnable), `trainable` (required, learnable), or `nice_to_have` (preferred). Cards label **Facts** (why it matches) separately from **Recommendations** (what to do next). Suggestions never tell the user to claim a skill they don't have.

**Fairness:** only the fields in `MATCHING_PROFILE_FIELDS` reach the scorer. Name, school, GPA, and personal traits can't change a score (tested).

**Matching text:** whole words only, so "CS" doesn't match "statistics" and "java" doesn't match "javascript". Skill spellings come from Member 3's `src/data/resume-interview/skill-aliases.json`.

## For other workstreams

- **Member 3:** after the user selects a role, its id is in `localStorage["careerlaunch.selectedInternshipId"]` (`STORAGE_KEYS.selectedInternshipId`). A `careerlaunch:internship-selected` event fires on `window` with `detail.internshipId`. Load the listing with `createInternshipService().getById(id)`; ids `mock-int-001` to `mock-int-004` match your fixtures. Load the profile (including `resumeText`) with `createProfileStore(browserStorage()).load()`. `scoreInternship(profile, internship).missingQualifications` gives the gaps with severity.
- **Member 4:** selecting a role does **not** add it to the tracker. Your page should offer an explicit "Add to tracker". The `Internship` has `company`, `title`, `applicationDeadline`, `applicationUrl`. The next-action card on `/internships` links to `/tracker`.
- **Member 5:** pages use `PageHeader`, `StateMessage`, `MockDataLabel`, and the shared tokens. Page-only styles are in CSS modules, so `globals.css` wasn't changed.

## Replacing mock data

Write an `InternshipSource` (`name`, `isMock`, `listInternships()`) and pass it to `createInternshipService(source)`. Call real APIs from a server route and keep keys in `.env`.

## Known limitations

- Skill matching uses keywords plus the shared alias list; unlisted synonyms are missed.
- Experience level is estimated from the number of experience items.
- Locations match by city name only.
- Data is stored in this browser only, with one level of undo.
