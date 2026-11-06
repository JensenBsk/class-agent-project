# Profile & Internship Matching (Member 2)

Workstream: **Profile creation, internship data, matching and ranking.**
Covers brief Stages 1–3 (Profile → Discovery → Explainable ranking).

## Run it

```bash
npm start      # http://localhost:8000/ → opens the profile & matching page
npm test       # unit tests (Node's built-in runner, no install needed)
```

Requires Node 20+. No dependencies, no API keys.

## Files

| File | What it does |
| --- | --- |
| `src/models/schemas.js` | `UserProfile`, `Internship`, `MatchScore` shapes (JSDoc) + allowed values + `MATCHING_PROFILE_FIELDS` allow-list |
| `src/data/internships.mock.js` | 11 **fictional** listings (1 duplicate, 1 expired on purpose) + `mockInternshipSource` |
| `src/data/sampleProfile.mock.js` | `MAYA_PROFILE` demo persona |
| `src/services/profileService.js` | `createProfile`, `reviewProfile` (missing/conflicting info), `createProfileStore` (save/undo/reset) |
| `src/services/internshipService.js` | `createInternshipService(source)`: search, filter, de-duplicate |
| `src/services/matchingService.js` | `scoreInternship`, `rankInternships`: explainable scoring |
| `src/utils/text.js` | normalize, skill aliases, dates, `escapeHtml` |
| `src/pages/matching.html` / `matchingPage.js` / `matching.css` | Onboarding form + ranked results UI |
| `tests/*.test.js` | 29 tests for profile, discovery, matching, fairness |

## How scoring works

Rule-based and deterministic, so every point is explainable. Weights sum to 100:

| Factor | Max | Rule |
| --- | --- | --- |
| Skills match | 30 | Required qualifications count double, preferred count single |
| Major / academics | 10 | Full points if the major is listed or the role is open to any major |
| Career interests | 10 | +6 preferred industry, +4 career goals mention a role tag |
| Experience level | 10 | User level from experience count (0 = none, 1–3 = some, 4+ = significant) vs. role |
| Location & remote | 15 | City match + work-mode preference |
| Work authorization | 10 | Needs sponsorship + none offered → **blocked** (shown, not hidden) |
| Deadline urgency | 5 | Sooner deadlines score slightly higher; passed → **expired** |
| Compensation | 10 | Compared to the user's minimum; unlisted pay is flagged |

Labels: ≥75 Strong, ≥60 Good, ≥40 Possible, else Weak. Ranking order: eligible → blocked → expired, then score, then sooner deadline.

Missing qualifications are tagged:
- **critical**: required and not quickly learnable (e.g. a degree or core coursework)
- **trainable**: required but learnable before starting
- **nice-to-have**: preferred only

Output separates **facts** (`factors`, `reasons`, `matchedQualifications` with evidence) from **recommendations** (`nextSteps`, `suggestion`). Suggestions never tell the user to claim a skill they don't have.

### Fairness

`pickMatchingFields()` passes only the fields in `MATCHING_PROFILE_FIELDS` to the scorer. Name, school, GPA, and any protected characteristic cannot affect a score; a test checks this. Work authorization is used only as an explicit, explained eligibility check based on what the employer states.

## Interfaces for other workstreams

- **Member 1 (data definitions):** `src/models/schemas.js` is a *proposal*. If you rename fields, tell me, or update them here and in `tests/`.
- **Member 3 (résumé / interview):** after the user selects an internship:
  - `localStorage['careerlaunch.selectedInternshipId']` holds the id. Use `createInternshipService().getById(id)` to load the listing.
  - A `careerlaunch:internship-selected` event fires on `window` with `detail = { internship, match }`.
  - `match.missingQualifications` (with severity) and `match.matchedQualifications` (with evidence) are ready for keyword and gap analysis.
  - `profile.resumeText` is collected on the profile form. Load it with `createProfileStore(localStorage).load()`.
- **Member 4 (tracker):** `Internship` has `company`, `title`, `deadline`, `applicationUrl`. `match.nextSteps` can seed the "next action". Selecting an internship does **not** add it to the tracker; that should be an explicit user action in your feature.
- **Member 5 (integration):** the page is self-contained. CSS uses `:root` tokens with dark mode. Swap in the shared layout and keep the `#results`, `#profile-form`, and `#next-action` ids, or call the services directly.

## Replacing mock data with a real source

Write an object with `name`, `isMock: false`, and `async listInternships()` returning `Internship[]`, then pass it to `createInternshipService(realSource)`. Keep API keys in `.env` (git-ignored) and call the API from a server, never from the browser.

## Known limitations

- Skill matching is keyword-based plus a small alias list ("JS" → "javascript"). Synonyms not in the list are missed.
- Experience level is estimated from the number of experience items, not their length or depth.
- Locations match by city name only (no "within 25 miles").
- Profile storage is per-browser `localStorage` with one level of undo. There are no accounts, so data never leaves the device.
