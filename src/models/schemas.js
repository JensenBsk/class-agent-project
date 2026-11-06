/**
 * Shared data shapes owned by Member 2 (profile + matching).
 *
 * PROPOSAL: Member 1 owns the final shared data definitions. These are the
 * smallest shapes Member 2 needs to build matching. If Member 1 changes a
 * field name, update it here and in tests/ — everything else reads these
 * constants or JSDoc types.
 */

/** Values allowed for UserProfile.remotePreference and Internship.workMode. */
export const WORK_MODES = Object.freeze(['remote', 'hybrid', 'in-person']);
export const REMOTE_PREFERENCES = Object.freeze([...WORK_MODES, 'any']);

/** Internship.experienceLevel, ordered from least to most experience. */
export const EXPERIENCE_LEVELS = Object.freeze(['none', 'some', 'significant']);

/** Qualification.type */
export const QUALIFICATION_TYPES = Object.freeze(['skill', 'education', 'experience', 'other']);

/**
 * The ONLY profile fields the matching engine may read. Name, school, GPA,
 * contact details, and anything that could reveal a protected characteristic
 * (age, gender, race, religion, disability, etc.) are deliberately excluded so
 * they cannot influence ranking. Work authorization is included because it is
 * a legal job requirement stated by the employer, and it is shown to the user
 * as an explicit, explained eligibility check — never a hidden penalty.
 */
export const MATCHING_PROFILE_FIELDS = Object.freeze([
  'major',
  'skills',
  'experience',
  'preferredIndustries',
  'preferredLocations',
  'remotePreference',
  'minHourlyRate',
  'workAuthorization',
  'careerGoals',
]);

/**
 * @typedef {Object} ExperienceItem
 * @property {string} title          e.g. "Shift Lead"
 * @property {string} organization   e.g. "Corner Market"
 * @property {'work'|'volunteer'|'project'} type
 * @property {string} [description]
 * @property {string[]} [skills]     skills used in this experience
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} name
 * @property {string} [school]
 * @property {string} major
 * @property {string} [graduationDate]      "YYYY-MM"
 * @property {number|null} [gpa]            optional, 0.0–4.0; never used for ranking
 * @property {string[]} skills
 * @property {ExperienceItem[]} experience
 * @property {string[]} preferredIndustries
 * @property {string[]} preferredLocations  e.g. ["Chicago, IL"]
 * @property {'remote'|'hybrid'|'in-person'|'any'} remotePreference
 * @property {string} [availability]        free text, e.g. "Summer 2027, 20 hrs/week"
 * @property {number|null} minHourlyRate    USD/hour; null = no preference
 * @property {{authorizedToWork: boolean|null, needsSponsorship: boolean|null}} workAuthorization
 * @property {string} [careerGoals]
 * @property {string} [resumeText]          pasted résumé; Member 3 consumes this
 * @property {string} [portfolioUrl]
 * @property {string} updatedAt             ISO timestamp
 */

/**
 * @typedef {Object} Qualification
 * @property {string} label          human-readable, e.g. "SQL"
 * @property {'skill'|'education'|'experience'|'other'} type
 * @property {string[]} keywords     lowercase terms that satisfy this requirement
 * @property {boolean} trainable     true if a student could reasonably learn it before starting
 */

/**
 * @typedef {Object} Internship
 * @property {string} id
 * @property {string} company
 * @property {string} title
 * @property {string} location               "City, ST" or "Remote"
 * @property {'remote'|'hybrid'|'in-person'} workMode
 * @property {{hourlyMin: number|null, hourlyMax: number|null, note: string}|null} compensation  null = not listed
 * @property {Qualification[]} requiredQualifications
 * @property {Qualification[]} preferredQualifications
 * @property {string[]} relevantMajors       lowercase; empty = any major
 * @property {'none'|'some'|'significant'} experienceLevel
 * @property {boolean} sponsorshipAvailable
 * @property {string} deadline               "YYYY-MM-DD"
 * @property {string} applicationUrl
 * @property {string} industry
 * @property {string[]} careerTags           lowercase interest tags
 * @property {string} description
 * @property {string} source                 e.g. "MOCK DATA"
 * @property {string} lastChecked            "YYYY-MM-DD"
 * @property {boolean} isMock
 */

/**
 * @typedef {Object} MatchFactor
 * @property {string} key          e.g. "skills"
 * @property {string} label        e.g. "Skills match"
 * @property {number} weight       max points
 * @property {number} points       earned points (0..weight)
 * @property {string} explanation  calculated fact, plain English
 */

/**
 * @typedef {Object} MatchScore
 * @property {string} internshipId
 * @property {number} score            0–100 integer
 * @property {string} label            "Strong match" | "Good match" | "Possible match" | "Weak match"
 * @property {{status: 'eligible'|'blocked'|'expired', reasons: string[]}} eligibility
 * @property {MatchFactor[]} factors   FACTS: how each point was earned
 * @property {{label: string, required: boolean, evidence: string}[]} matchedQualifications
 * @property {{label: string, required: boolean, severity: 'critical'|'trainable'|'nice-to-have', suggestion: string}[]} missingQualifications
 * @property {string[]} reasons        FACTS: why it matches, top factors first
 * @property {string[]} nextSteps      RECOMMENDATIONS: what the user could do next
 */

export {};
