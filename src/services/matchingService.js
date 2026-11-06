/**
 * Explainable internship matching (Member 2).
 *
 * scoreInternship(profile, internship) → MatchScore (see src/models/schemas.js)
 * rankInternships(profile, internships) → MatchScore[] sorted best-first
 *
 * Rules:
 * - Deterministic and rule-based, so every point can be explained. No AI call.
 * - Reads ONLY the fields in MATCHING_PROFILE_FIELDS. Name, school, GPA, and
 *   protected characteristics can never change a score.
 * - "factors" and "reasons" are calculated FACTS. "nextSteps" are RECOMMENDATIONS.
 * - Suggestions never tell the user to claim a skill they don't have.
 */
import { EXPERIENCE_LEVELS, MATCHING_PROFILE_FIELDS } from '../models/schemas.js';
import { daysBetween, normalize, normalizeSkill, sameCity, todayIso } from '../utils/text.js';

/** Max points per factor. Sums to 100. */
export const WEIGHTS = Object.freeze({
  skills: 30,
  academics: 10,
  interests: 10,
  experience: 10,
  location: 15,
  workAuthorization: 10,
  deadline: 5,
  compensation: 10,
});

const LABELS = {
  skills: 'Skills match',
  academics: 'Major / academic background',
  interests: 'Career interests',
  experience: 'Experience level',
  location: 'Location & remote preference',
  workAuthorization: 'Work authorization',
  deadline: 'Deadline urgency',
  compensation: 'Compensation',
};

/** Copy only the fields matching is allowed to use. */
export function pickMatchingFields(profile) {
  const safe = {};
  for (const f of MATCHING_PROFILE_FIELDS) safe[f] = profile?.[f];
  safe.skills ??= [];
  safe.experience ??= [];
  safe.preferredIndustries ??= [];
  safe.preferredLocations ??= [];
  safe.workAuthorization ??= { authorizedToWork: null, needsSponsorship: null };
  safe.remotePreference ??= 'any';
  safe.minHourlyRate ??= null;
  return safe;
}

/** Map a profile's experience count to an EXPERIENCE_LEVELS value. */
export function userExperienceLevel(profile) {
  const n = (profile.experience ?? []).length;
  return n === 0 ? 'none' : n <= 3 ? 'some' : 'significant';
}

function buildContext(p) {
  const skills = new Set(p.skills.map(normalizeSkill));
  for (const e of p.experience) for (const s of e.skills ?? []) skills.add(normalizeSkill(s));
  return {
    p,
    skills,
    major: normalize(p.major),
    goals: normalize(p.careerGoals),
    industries: p.preferredIndustries.map(normalize),
  };
}

/** Does the user meet one qualification? Returns evidence text or null. */
export function findEvidence(qualification, ctx) {
  for (const raw of qualification.keywords) {
    const kw = normalizeSkill(raw);
    if (ctx.skills.has(kw)) return `You listed "${kw}" as a skill.`;
    if (qualification.type === 'education' && ctx.major && (ctx.major.includes(kw) || kw.includes(ctx.major))) {
      return `Your major (${ctx.p.major}) covers this.`;
    }
    if (qualification.type === 'experience' || qualification.type === 'other') {
      const exp = ctx.p.experience.find((e) => normalize(`${e.title} ${e.organization} ${e.description}`).includes(kw));
      if (exp) return `Your experience "${exp.title}" shows this.`;
    }
    if (qualification.type === 'other' && (ctx.goals.includes(kw) || ctx.industries.includes(kw))) {
      return 'Your stated career interests show this.';
    }
  }
  return null;
}

function severityOf(qualification, required) {
  if (!required) return 'nice-to-have';
  return qualification.trainable ? 'trainable' : 'critical';
}

function suggestionFor(qualification, severity) {
  if (severity === 'critical') {
    return `"${qualification.label}" is a core requirement that usually takes a full course or more to gain. If you have it, add it to your profile; if not, treat this as a stretch application.`;
  }
  if (severity === 'trainable') {
    return `"${qualification.label}" can often be learned quickly (short course or small project). Only add it to your résumé after you've actually done it.`;
  }
  return `"${qualification.label}" is preferred, not required. Mention related experience if you truly have it.`;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const factor = (key, points, explanation) => ({
  key,
  label: LABELS[key],
  weight: WEIGHTS[key],
  points: Math.max(0, Math.min(WEIGHTS[key], Math.round(points * 10) / 10)),
  explanation: capitalize(explanation),
});

function scoreSkills(internship, ctx, matched, missing) {
  const quals = [
    ...internship.requiredQualifications.map((q) => ({ q, required: true })),
    ...internship.preferredQualifications.map((q) => ({ q, required: false })),
  ];
  if (quals.length === 0) return factor('skills', WEIGHTS.skills, 'This listing does not specify qualifications.');

  let earned = 0;
  let total = 0;
  for (const { q, required } of quals) {
    const w = required ? 2 : 1;
    total += w;
    const evidence = findEvidence(q, ctx);
    if (evidence) {
      earned += w;
      matched.push({ label: q.label, required, evidence });
    } else {
      const severity = severityOf(q, required);
      missing.push({ label: q.label, required, severity, suggestion: suggestionFor(q, severity) });
    }
  }
  const reqTotal = internship.requiredQualifications.length;
  const reqMet = matched.filter((m) => m.required).length;
  const prefMet = matched.length - reqMet;
  return factor(
    'skills',
    (WEIGHTS.skills * earned) / total,
    `You meet ${reqMet} of ${reqTotal} required and ${prefMet} of ${internship.preferredQualifications.length} preferred qualifications.`,
  );
}

function scoreAcademics(internship, ctx) {
  const majors = internship.relevantMajors ?? [];
  if (majors.length === 0) return factor('academics', WEIGHTS.academics, 'Open to students from any major.');
  if (!ctx.major) return factor('academics', WEIGHTS.academics * 0.3, 'Add your major to check academic fit.');
  const hit = majors.find((m) => ctx.major.includes(m) || m.includes(ctx.major));
  if (hit) return factor('academics', WEIGHTS.academics, `Your major (${ctx.p.major}) is one the employer lists.`);
  return factor('academics', WEIGHTS.academics * 0.3, `Listed majors are ${majors.join(', ')}; yours is ${ctx.p.major}.`);
}

function scoreInterests(internship, ctx) {
  if (ctx.industries.length === 0 && !ctx.goals) {
    return factor('interests', WEIGHTS.interests * 0.5, 'Add preferred industries or career goals to personalize this.');
  }
  let pts = 0;
  const notes = [];
  if (ctx.industries.includes(normalize(internship.industry))) {
    pts += 6;
    notes.push(`${internship.industry} is one of your preferred industries`);
  }
  const tags = (internship.careerTags ?? []).filter((t) => ctx.goals.includes(normalize(t)));
  if (tags.length) {
    pts += 4;
    notes.push(`your goals mention ${tags.join(', ')}`);
  }
  return factor('interests', pts, notes.length ? `${notes.join('; ')}.` : `${internship.industry} is not in your listed interests.`);
}

function scoreExperience(internship, ctx) {
  const userLvl = userExperienceLevel(ctx.p);
  const gap = EXPERIENCE_LEVELS.indexOf(internship.experienceLevel) - EXPERIENCE_LEVELS.indexOf(userLvl);
  const want = { none: 'no prior experience', some: 'some prior experience', significant: 'significant prior experience' }[internship.experienceLevel];
  if (gap <= 0) return factor('experience', WEIGHTS.experience, `Role expects ${want}; you have ${ctx.p.experience.length} experience item(s).`);
  if (gap === 1) return factor('experience', WEIGHTS.experience * 0.5, `Role expects ${want}; you may be slightly under that level.`);
  return factor('experience', 0, `Role expects ${want}; this is likely a reach for now.`);
}

function scoreLocation(internship, ctx) {
  const pref = ctx.p.remotePreference;
  if (internship.workMode === 'remote') {
    if (pref === 'in-person') return factor('location', 8, 'Fully remote, but you prefer in-person work.');
    if (pref === 'hybrid') return factor('location', 12, 'Fully remote; you prefer hybrid.');
    return factor('location', WEIGHTS.location, 'Fully remote — matches your preference.');
  }
  if (pref === 'remote') return factor('location', 0, `Requires ${internship.workMode} work in ${internship.location}; you want remote only.`);
  const cityMatch = ctx.p.preferredLocations.some((loc) => sameCity(loc, internship.location));
  if (!cityMatch) return factor('location', 3, `${internship.location} is not one of your preferred locations.`);
  if (pref === 'any' || pref === internship.workMode) {
    return factor('location', WEIGHTS.location, `${internship.workMode} in ${internship.location} — matches your preference.`);
  }
  return factor('location', 11, `In ${internship.location} (your area) but ${internship.workMode}, not ${pref}.`);
}

function scoreWorkAuth(internship, ctx, eligibility) {
  const { authorizedToWork, needsSponsorship } = ctx.p.workAuthorization;
  if ((needsSponsorship === true || authorizedToWork === false) && !internship.sponsorshipAvailable) {
    eligibility.status = 'blocked';
    eligibility.reasons.push('The listing says sponsorship is not available, and your profile says you need it.');
    return factor('workAuthorization', 0, 'Sponsorship is not offered for this role.');
  }
  if (needsSponsorship === null) {
    return factor('workAuthorization', WEIGHTS.workAuthorization * 0.5, 'Answer the sponsorship question in your profile to confirm eligibility.');
  }
  return factor('workAuthorization', WEIGHTS.workAuthorization, 'No work-authorization conflict found.');
}

function scoreDeadline(internship, today, eligibility) {
  const days = daysBetween(today, internship.deadline);
  if (days < 0) {
    eligibility.status = 'expired';
    eligibility.reasons.push(`The deadline (${internship.deadline}) has passed.`);
    return { days, f: factor('deadline', 0, `Deadline passed on ${internship.deadline}.`) };
  }
  if (days <= 14) return { days, f: factor('deadline', 5, `Due in ${days} day(s) — act soon.`) };
  if (days <= 45) return { days, f: factor('deadline', 4, `Due in ${days} days.`) };
  return { days, f: factor('deadline', 3, `Due in ${days} days — plenty of time.`) };
}

function scoreCompensation(internship, ctx) {
  const c = internship.compensation;
  if (!c || c.hourlyMax == null) return factor('compensation', 4, 'Pay is not listed.');
  const range = c.hourlyMin === c.hourlyMax ? `$${c.hourlyMax}/hr` : `$${c.hourlyMin}–$${c.hourlyMax}/hr`;
  const min = ctx.p.minHourlyRate;
  if (min == null) return factor('compensation', WEIGHTS.compensation, `Paid ${range}; you have no minimum set.`);
  if (c.hourlyMax >= min) return factor('compensation', WEIGHTS.compensation, `Pays ${range}, meets your $${min}/hr minimum.`);
  if (c.hourlyMax >= min * 0.85) return factor('compensation', 5, `Pays ${range}, slightly below your $${min}/hr minimum.`);
  return factor('compensation', 1, `Pays ${range}, well below your $${min}/hr minimum.`);
}

export function labelFor(score) {
  if (score >= 75) return 'Strong match';
  if (score >= 60) return 'Good match';
  if (score >= 40) return 'Possible match';
  return 'Weak match';
}

function buildNextSteps({ eligibility, missing, days, internship }) {
  const steps = [];
  if (eligibility.status === 'expired') {
    return ['This deadline has passed. Look for a future posting from this employer or similar roles.'];
  }
  if (eligibility.status === 'blocked') {
    steps.push('Confirm the employer\'s work-authorization policy before spending time on this application.');
  }
  const critical = missing.filter((m) => m.severity === 'critical');
  const trainable = missing.filter((m) => m.severity === 'trainable');
  if (critical.length) {
    steps.push(`Check whether you meet: ${critical.map((m) => m.label).join(', ')}. If not, treat this as a stretch application.`);
  }
  if (trainable.length) {
    steps.push(`Build these trainable skills before applying: ${trainable.map((m) => m.label).join(', ')}.`);
  }
  if (!critical.length && eligibility.status === 'eligible') {
    steps.push('Tailor your résumé and cover letter for this role (Résumé Assistant).');
  }
  if (days <= 14) steps.push(`Deadline is in ${days} day(s) — add it to your application tracker today.`);
  if (!internship.compensation) steps.push('Pay is not listed — ask the employer before committing.');
  return steps;
}

/**
 * Score one internship for one profile.
 * @param {object} profile     UserProfile
 * @param {object} internship  Internship
 * @param {{today?: string}} [options]
 * @returns {object} MatchScore
 */
export function scoreInternship(profile, internship, options = {}) {
  const today = options.today ?? todayIso();
  const ctx = buildContext(pickMatchingFields(profile));
  const matched = [];
  const missing = [];
  const eligibility = { status: 'eligible', reasons: [] };

  const { days, f: deadlineFactor } = scoreDeadline(internship, today, eligibility);
  const factors = [
    scoreSkills(internship, ctx, matched, missing),
    scoreAcademics(internship, ctx),
    scoreInterests(internship, ctx),
    scoreExperience(internship, ctx),
    scoreLocation(internship, ctx),
    scoreWorkAuth(internship, ctx, eligibility),
    deadlineFactor,
    scoreCompensation(internship, ctx),
  ];
  // An expired listing keeps "expired" status even if also blocked.
  if (eligibility.reasons.some((r) => r.startsWith('The deadline'))) eligibility.status = 'expired';

  const score = Math.round(factors.reduce((sum, f) => sum + f.points, 0));
  const reasons = factors
    .filter((f) => f.points / f.weight >= 0.7)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((f) => f.explanation);

  return {
    internshipId: internship.id,
    score,
    label: labelFor(score),
    eligibility,
    factors,
    matchedQualifications: matched,
    missingQualifications: missing,
    reasons,
    nextSteps: buildNextSteps({ eligibility, missing, days, internship }),
  };
}

const STATUS_ORDER = { eligible: 0, blocked: 1, expired: 2 };

/**
 * Rank internships best-first. Eligible listings come before blocked or
 * expired ones; ties are broken by the sooner deadline.
 * @returns {{internship: object, match: object}[]}
 */
export function rankInternships(profile, internships, options = {}) {
  return internships
    .map((internship) => ({ internship, match: scoreInternship(profile, internship, options) }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.match.eligibility.status] - STATUS_ORDER[b.match.eligibility.status] ||
        b.match.score - a.match.score ||
        a.internship.deadline.localeCompare(b.internship.deadline),
    );
}
