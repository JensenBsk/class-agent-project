/**
 * Explainable internship matching (Member 2).
 *
 *   scoreInternship(profile, internship) -> MatchScore
 *   rankInternships(profile, internships) -> { internship, match }[] best first
 *
 * Rules:
 * - Rule-based and deterministic, so every point can be explained and tested.
 * - Reads ONLY the fields in MATCHING_PROFILE_FIELDS. Name, school, GPA, and
 *   protected characteristics can never change a score.
 * - `factors` and `reasons` are FACTS. `nextSteps` and `suggestion` are RECOMMENDATIONS.
 * - Suggestions never tell the user to claim a skill they don't have.
 */
import {
  EXPERIENCE_LEVELS,
  type EligibilityStatus,
  type Internship,
  type MatchFactor,
  type MatchFactorKey,
  type MatchLabel,
  type MatchScore,
  type MatchedQualification,
  type MissingQualification,
  type MissingQualificationSeverity,
  type Qualification,
  type UserProfile,
} from "@/types";
import { canonicalSkill, containsPhrase, daysBetween, majorsMatch, normalize, sameCity, skillVariants } from "./text";

/** Max points per factor. Adds up to 100. */
export const WEIGHTS: Readonly<Record<MatchFactorKey, number>> = {
  skills: 30,
  academics: 10,
  interests: 10,
  experience: 10,
  location: 15,
  workAuthorization: 10,
  deadline: 5,
  compensation: 10,
};

const LABELS: Record<MatchFactorKey, string> = {
  skills: "Skills match",
  academics: "Major / academic background",
  interests: "Career interests",
  experience: "Experience level",
  location: "Location & remote preference",
  workAuthorization: "Work authorization",
  deadline: "Deadline urgency",
  compensation: "Compensation",
};

/**
 * The only profile fields matching may read. Anything else (name, school,
 * GPA, contact info, or any protected characteristic) can't affect ranking.
 * Work authorization is used only as an explicit, explained check against
 * what the employer states.
 */
export const MATCHING_PROFILE_FIELDS = [
  "major",
  "skills",
  "experience",
  "preferredIndustries",
  "preferredLocations",
  "remotePreference",
  "salaryExpectation",
  "workAuthorization",
  "careerGoals",
] as const satisfies readonly (keyof UserProfile)[];

export type MatchingInput = Pick<UserProfile, (typeof MATCHING_PROFILE_FIELDS)[number]>;

export function pickMatchingFields(profile: Partial<UserProfile>): MatchingInput {
  return {
    major: profile.major ?? "",
    skills: profile.skills ?? [],
    experience: profile.experience ?? [],
    preferredIndustries: profile.preferredIndustries ?? [],
    preferredLocations: profile.preferredLocations ?? [],
    remotePreference: profile.remotePreference ?? "no_preference",
    salaryExpectation: profile.salaryExpectation,
    workAuthorization: profile.workAuthorization ?? { authorizedToWork: null, needsSponsorship: null },
    careerGoals: profile.careerGoals ?? "",
  };
}

/** 0 items = none, 1–3 = some, 4+ = significant. */
export function userExperienceLevel(p: Pick<UserProfile, "experience">) {
  const n = p.experience.length;
  return n === 0 ? "none" : n <= 3 ? "some" : "significant";
}

interface Context {
  p: MatchingInput;
  /** canonical skill -> what the user actually typed */
  skills: Map<string, string>;
  experienceText: { title: string; text: string }[];
  goals: string;
  industries: string[];
}

function buildContext(p: MatchingInput): Context {
  const skills = new Map<string, string>();
  for (const s of [...p.skills, ...p.experience.flatMap((e) => e.skills ?? [])]) {
    if (!skills.has(canonicalSkill(s))) skills.set(canonicalSkill(s), s);
  }
  return {
    p,
    skills,
    experienceText: p.experience.map((e) => ({ title: e.title, text: normalize(`${e.title} ${e.organization} ${e.description ?? ""}`) })),
    goals: normalize(p.careerGoals),
    industries: p.preferredIndustries.map(normalize),
  };
}

/** Evidence that the user meets a qualification, or null. */
export function findEvidence(qualification: Qualification, ctx: Context): string | null {
  for (const raw of qualification.keywords) {
    const kw = canonicalSkill(raw);
    const listed = ctx.skills.get(kw);
    if (listed) return `You listed "${listed}" as a skill.`;
    if (qualification.type === "education" && majorsMatch(ctx.p.major, raw)) {
      return `Your major (${ctx.p.major}) covers this.`;
    }
    const variants = skillVariants(kw);
    const exp = ctx.experienceText.find((e) => variants.some((v) => containsPhrase(e.text, v)));
    if (exp) return `Your experience "${exp.title}" shows this.`;
    if (qualification.type === "other" && (variants.some((v) => containsPhrase(ctx.goals, v)) || ctx.industries.includes(kw))) {
      return "Your career interests show this.";
    }
  }
  return null;
}

function severityOf(q: Qualification, required: boolean): MissingQualificationSeverity {
  if (!required) return "nice_to_have";
  return q.trainable ? "trainable" : "critical";
}

function suggestionFor(q: Qualification, severity: MissingQualificationSeverity): string {
  if (severity === "critical") {
    return `"${q.label}" is a core requirement that usually takes a full course or more to gain. If you already have it, add it to your profile. If not, treat this as a stretch application.`;
  }
  if (severity === "trainable") {
    return `"${q.label}" can often be learned quickly with a short course or small project. Only add it to your résumé after you've actually done it.`;
  }
  return `"${q.label}" is preferred, not required. Mention related experience only if you truly have it.`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function factor(key: MatchFactorKey, points: number, explanation: string): MatchFactor {
  return {
    key,
    label: LABELS[key],
    weight: WEIGHTS[key],
    points: Math.max(0, Math.min(WEIGHTS[key], Math.round(points * 10) / 10)),
    explanation: capitalize(explanation),
  };
}

function scoreSkills(i: Internship, ctx: Context, matched: MatchedQualification[], missing: MissingQualification[]) {
  const quals = [
    ...i.requiredQualifications.map((q) => ({ q, required: true })),
    ...i.preferredQualifications.map((q) => ({ q, required: false })),
  ];
  if (quals.length === 0) return factor("skills", WEIGHTS.skills, "this listing doesn't list qualifications.");
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
  const reqMet = matched.filter((m) => m.required).length;
  return factor(
    "skills",
    (WEIGHTS.skills * earned) / total,
    `you meet ${reqMet} of ${i.requiredQualifications.length} required and ${matched.length - reqMet} of ${i.preferredQualifications.length} preferred qualifications.`,
  );
}

function scoreAcademics(i: Internship, ctx: Context) {
  const majors = i.relevantMajors ?? [];
  if (majors.length === 0) return factor("academics", WEIGHTS.academics, "open to students from any major.");
  if (!ctx.p.major) return factor("academics", WEIGHTS.academics * 0.3, "add your major to check academic fit.");
  if (majors.some((m) => majorsMatch(ctx.p.major, m))) {
    return factor("academics", WEIGHTS.academics, `your major (${ctx.p.major}) is one the employer lists.`);
  }
  return factor("academics", WEIGHTS.academics * 0.3, `listed majors are ${majors.join(", ")}; yours is ${ctx.p.major}.`);
}

function scoreInterests(i: Internship, ctx: Context) {
  if (ctx.industries.length === 0 && !ctx.goals) {
    return factor("interests", WEIGHTS.interests * 0.5, "add preferred industries or career goals to personalize this.");
  }
  let pts = 0;
  const notes: string[] = [];
  if (ctx.industries.includes(normalize(i.industry))) {
    pts += 6;
    notes.push(`${i.industry} is one of your preferred industries`);
  }
  const tags = (i.careerTags ?? []).filter((t) => containsPhrase(ctx.goals, t));
  if (tags.length) {
    pts += 4;
    notes.push(`your goals mention ${tags.join(", ")}`);
  }
  return factor("interests", pts, notes.length ? `${notes.join("; ")}.` : `${i.industry} isn't in your listed interests.`);
}

function scoreExperience(i: Internship, ctx: Context) {
  const wanted = i.experienceLevel ?? "none";
  const gap = EXPERIENCE_LEVELS.indexOf(wanted) - EXPERIENCE_LEVELS.indexOf(userExperienceLevel(ctx.p));
  const want = { none: "no prior experience", some: "some prior experience", significant: "significant prior experience" }[wanted];
  if (gap <= 0) return factor("experience", WEIGHTS.experience, `role expects ${want}; you have ${ctx.p.experience.length} experience item(s).`);
  if (gap === 1) return factor("experience", WEIGHTS.experience * 0.5, `role expects ${want}; you may be a little under that level.`);
  return factor("experience", 0, `role expects ${want}; this is likely a reach for now.`);
}

const MODE_TEXT = { remote: "remote", hybrid: "hybrid", in_person: "in person", no_preference: "no preference" } as const;

function scoreLocation(i: Internship, ctx: Context) {
  const pref = ctx.p.remotePreference;
  if (i.workMode === "remote") {
    if (pref === "in_person") return factor("location", 8, "fully remote, but you prefer in-person work.");
    if (pref === "hybrid") return factor("location", 12, "fully remote; you prefer hybrid.");
    return factor("location", WEIGHTS.location, "fully remote, which matches your preference.");
  }
  if (pref === "remote") return factor("location", 0, `${MODE_TEXT[i.workMode]} in ${i.location}; you want remote only.`);
  if (!ctx.p.preferredLocations.some((loc) => sameCity(loc, i.location))) {
    return factor("location", 3, `${i.location} isn't one of your preferred locations.`);
  }
  if (pref === "no_preference" || pref === i.workMode) {
    return factor("location", WEIGHTS.location, `${MODE_TEXT[i.workMode]} in ${i.location}, which matches your preference.`);
  }
  return factor("location", 11, `in ${i.location} (your area) but ${MODE_TEXT[i.workMode]}, not ${MODE_TEXT[pref]}.`);
}

interface Eligibility {
  status: EligibilityStatus;
  reasons: string[];
}

function scoreWorkAuth(i: Internship, ctx: Context, eligibility: Eligibility) {
  const { authorizedToWork, needsSponsorship } = ctx.p.workAuthorization;
  const needs = needsSponsorship === true || authorizedToWork === false;
  if (needs && i.sponsorshipAvailable === false) {
    eligibility.status = "blocked";
    eligibility.reasons.push("The listing says sponsorship isn't available, and your profile says you need it.");
    return factor("workAuthorization", 0, "sponsorship isn't offered for this role.");
  }
  if (needs && i.sponsorshipAvailable === undefined) {
    return factor("workAuthorization", WEIGHTS.workAuthorization * 0.5, "the listing doesn't say whether it sponsors visas. Ask before applying.");
  }
  if (needsSponsorship === null) {
    return factor("workAuthorization", WEIGHTS.workAuthorization * 0.5, "answer the sponsorship question in your profile to confirm eligibility.");
  }
  return factor("workAuthorization", WEIGHTS.workAuthorization, "no work-authorization conflict found.");
}

function scoreDeadline(i: Internship, today: Date, eligibility: Eligibility) {
  if (!i.applicationDeadline) return { days: Infinity, f: factor("deadline", 2, "no deadline listed. Check the employer's site.") };
  const days = daysBetween(today, i.applicationDeadline);
  if (days < 0) {
    eligibility.status = "expired";
    eligibility.reasons.push(`The deadline (${i.applicationDeadline}) has passed.`);
    return { days, f: factor("deadline", 0, `deadline passed on ${i.applicationDeadline}.`) };
  }
  if (days <= 14) return { days, f: factor("deadline", 5, `due in ${days} day(s). Act soon.`) };
  if (days <= 45) return { days, f: factor("deadline", 4, `due in ${days} days.`) };
  return { days, f: factor("deadline", 3, `due in ${days} days, plenty of time.`) };
}

function scoreCompensation(i: Internship, ctx: Context) {
  const c = i.compensation;
  if (!c || c.hourlyMax === undefined) return factor("compensation", 4, "pay isn't listed.");
  if (c.hourlyMax <= 0) return factor("compensation", ctx.p.salaryExpectation ? 0 : 3, `unpaid (${c.note}).`);
  const range = c.hourlyMin !== undefined && c.hourlyMin !== c.hourlyMax ? `$${c.hourlyMin}–$${c.hourlyMax}/hr` : `$${c.hourlyMax}/hr`;
  const min = ctx.p.salaryExpectation;
  if (min === undefined) return factor("compensation", WEIGHTS.compensation, `pays ${range}; you haven't set a minimum.`);
  if (c.hourlyMax >= min) return factor("compensation", WEIGHTS.compensation, `pays ${range}, meets your $${min}/hr minimum.`);
  if (c.hourlyMax >= min * 0.85) return factor("compensation", 5, `pays ${range}, a little below your $${min}/hr minimum.`);
  return factor("compensation", 1, `pays ${range}, well below your $${min}/hr minimum.`);
}

export function labelFor(score: number): MatchLabel {
  if (score >= 75) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Possible match";
  return "Weak match";
}

function buildNextSteps(eligibility: Eligibility, missing: MissingQualification[], days: number, i: Internship): string[] {
  if (eligibility.status === "expired") {
    return ["This deadline has passed. Look for a future posting from this employer or similar roles."];
  }
  const steps: string[] = [];
  if (eligibility.status === "blocked") steps.push("Confirm the employer's work-authorization policy before spending time on this application.");
  const critical = missing.filter((m) => m.severity === "critical");
  const trainable = missing.filter((m) => m.severity === "trainable");
  if (critical.length) steps.push(`Check whether you meet: ${critical.map((m) => m.label).join("; ")}. If not, treat this as a stretch application.`);
  if (trainable.length) steps.push(`Build these trainable skills before applying: ${trainable.map((m) => m.label).join("; ")}.`);
  if (!critical.length && eligibility.status === "eligible") steps.push("Tailor your résumé and cover letter for this role.");
  if (days <= 14) steps.push(`The deadline is in ${days} day(s). Add it to your tracker today.`);
  if (!i.compensation) steps.push("Pay isn't listed. Ask the employer before committing.");
  return steps;
}

/** Score one internship for one profile. */
export function scoreInternship(profile: UserProfile, internship: Internship, today: Date = new Date()): MatchScore {
  const ctx = buildContext(pickMatchingFields(profile));
  const matched: MatchedQualification[] = [];
  const missing: MissingQualification[] = [];
  const eligibility: Eligibility = { status: "eligible", reasons: [] };

  const workAuth = scoreWorkAuth(internship, ctx, eligibility);
  const { days, f: deadline } = scoreDeadline(internship, today, eligibility); // expired wins over blocked
  const factors = [
    scoreSkills(internship, ctx, matched, missing),
    scoreAcademics(internship, ctx),
    scoreInterests(internship, ctx),
    scoreExperience(internship, ctx),
    scoreLocation(internship, ctx),
    workAuth,
    deadline,
    scoreCompensation(internship, ctx),
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.points, 0));
  const reasons = factors
    .filter((f) => f.points / f.weight >= 0.7)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((f) => f.explanation);
  const stamp = today.toISOString();

  return {
    id: `match-${profile.id}-${internship.id}`,
    createdAt: stamp,
    updatedAt: stamp,
    userProfileId: profile.id,
    internshipId: internship.id,
    score,
    label: labelFor(score),
    eligibility,
    factors,
    matchedQualifications: matched,
    missingQualifications: missing,
    reasons,
    nextSteps: buildNextSteps(eligibility, missing, days, internship),
  };
}

export interface RankedInternship {
  internship: Internship;
  match: MatchScore;
}

const STATUS_ORDER: Record<EligibilityStatus, number> = { eligible: 0, blocked: 1, expired: 2 };

/** Best first: eligible before blocked before expired, then score, then sooner deadline. */
export function rankInternships(profile: UserProfile, internships: Internship[], today: Date = new Date()): RankedInternship[] {
  return internships
    .map((internship) => ({ internship, match: scoreInternship(profile, internship, today) }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.match.eligibility.status] - STATUS_ORDER[b.match.eligibility.status] ||
        b.match.score - a.match.score ||
        (a.internship.applicationDeadline ?? "9999").localeCompare(b.internship.applicationDeadline ?? "9999"),
    );
}
