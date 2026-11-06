/**
 * UserProfile creation, review, and storage (Member 2).
 *
 * - normalizeProfile(): build a valid UserProfile from form input or loosely
 *   shaped data (e.g. Member 3's Maya JSON, whose workAuthorization is a sentence).
 * - reviewProfile(): errors, follow-up questions for missing info, and conflicts.
 * - createProfileStore(): save / load / undo / delete, on localStorage in the
 *   browser or memory in tests. Data never leaves the user's device.
 */
import mayaFile from "@/data/resume-interview/mock-profile-maya.json";
import {
  EXPERIENCE_TYPES,
  REMOTE_PREFERENCES,
  type ExperienceItem,
  type ExperienceType,
  type RemotePreference,
  type UserProfile,
  type WorkAuthorization,
} from "@/types";
import { isoDate, normalize, splitList } from "./text";

type Loose = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const numOrUndefined = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const boolOrNull = (v: unknown): boolean | null =>
  v === true || v === "true" ? true : v === false || v === "false" ? false : null;

/** Accepts the shared object shape, form strings, or a plain-English sentence. */
export function normalizeWorkAuthorization(value: unknown): WorkAuthorization {
  if (value && typeof value === "object") {
    const v = value as Loose;
    return { authorizedToWork: boolOrNull(v.authorizedToWork), needsSponsorship: boolOrNull(v.needsSponsorship) };
  }
  const text = normalize(value);
  if (!text) return { authorizedToWork: null, needsSponsorship: null };
  const authorizedToWork = /\bnot authorized\b|\bunauthorized\b/.test(text)
    ? false
    : /\bauthorized\b/.test(text)
      ? true
      : null;
  const needsSponsorship = /\b(no|not|without|don't|doesn't)\b[^.]*\bsponsor/.test(text)
    ? false
    : /\bsponsor/.test(text)
      ? true
      : authorizedToWork === true
        ? false
        : null;
  return { authorizedToWork, needsSponsorship };
}

function normalizeExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw): ExperienceItem => {
      const e = (raw ?? {}) as Loose;
      const type = EXPERIENCE_TYPES.includes(e.type as ExperienceType) ? (e.type as ExperienceType) : "work";
      const item: ExperienceItem = { type, title: str(e.title), organization: str(e.organization) };
      if (str(e.startDate)) item.startDate = str(e.startDate);
      if (str(e.endDate)) item.endDate = str(e.endDate);
      if (str(e.description)) item.description = str(e.description);
      const skills = splitList(e.skills);
      if (skills.length) item.skills = skills;
      return item;
    })
    .filter((e) => e.title || e.organization);
}

/** Build a valid UserProfile from any loosely shaped input. */
export function normalizeProfile(input: Loose = {}, now: Date = new Date()): UserProfile {
  const stamp = now.toISOString();
  const remote = str(input.remotePreference) as RemotePreference;
  const profile: UserProfile = {
    id: str(input.id) || `profile-${now.getTime()}`,
    createdAt: str(input.createdAt) || stamp,
    updatedAt: stamp,
    name: str(input.name),
    school: str(input.school),
    major: str(input.major),
    graduationDate: str(input.graduationDate),
    skills: splitList(input.skills),
    experience: normalizeExperience(input.experience),
    preferredIndustries: splitList(input.preferredIndustries),
    preferredLocations: splitList(input.preferredLocations),
    remotePreference: REMOTE_PREFERENCES.includes(remote) ? remote : "no_preference",
    availability: str(input.availability),
    workAuthorization: normalizeWorkAuthorization(input.workAuthorization),
    careerGoals: str(input.careerGoals),
  };
  const gpa = numOrUndefined(input.gpa);
  if (gpa !== undefined) profile.gpa = gpa;
  const salary = numOrUndefined(input.salaryExpectation);
  if (salary !== undefined) profile.salaryExpectation = salary;
  if (typeof input.resumeText === "string" && input.resumeText) profile.resumeText = input.resumeText;
  if (str(input.portfolioUrl)) profile.portfolioUrl = str(input.portfolioUrl);
  return profile;
}

/** The one demo user (Member 3's Maya), converted to the shared UserProfile shape. */
export function demoProfile(now: Date = new Date()): UserProfile {
  const raw = (mayaFile as { userProfile: Loose }).userProfile;
  return { ...normalizeProfile(raw, now), createdAt: str(raw.createdAt) || now.toISOString() };
}

export interface ProfileIssue {
  field: keyof UserProfile | "workAuthorization";
  message: string;
}

export interface ProfileReview {
  /** True when matching can run: no errors and nothing required is missing. */
  ready: boolean;
  errors: ProfileIssue[];
  /** Follow-up questions, only for info that matching needs. */
  missing: ProfileIssue[];
  /** Answers that contradict each other. Shown, but don't block. */
  conflicts: ProfileIssue[];
}

/** Review a profile. Optional fields (GPA, school, portfolio) are never demanded. */
export function reviewProfile(profile: UserProfile, today: Date = new Date()): ProfileReview {
  const errors: ProfileIssue[] = [];
  const missing: ProfileIssue[] = [];
  const conflicts: ProfileIssue[] = [];

  if (!profile.name) missing.push({ field: "name", message: "What name should we use on your drafts?" });
  if (!profile.major) missing.push({ field: "major", message: "What is your major (or intended major)?" });
  if (profile.skills.length === 0) {
    missing.push({ field: "skills", message: "List a few skills you've used in class, work, or projects (for example: Excel, Python, customer service)." });
  }
  if (profile.remotePreference !== "remote" && profile.preferredLocations.length === 0) {
    missing.push({ field: "preferredLocations", message: 'Which cities could you work in? (Or choose "Remote only".)' });
  }
  if (profile.workAuthorization.needsSponsorship === null) {
    missing.push({ field: "workAuthorization", message: "Will you need visa sponsorship? We use this only to flag listings you may not be eligible for." });
  }

  if (profile.gpa !== undefined && (profile.gpa < 0 || profile.gpa > 4)) {
    errors.push({ field: "gpa", message: "GPA must be between 0.0 and 4.0, or left blank." });
  }
  if (profile.salaryExpectation !== undefined && profile.salaryExpectation < 0) {
    errors.push({ field: "salaryExpectation", message: "Minimum pay can't be negative." });
  }
  if (profile.graduationDate && !/^\d{4}-\d{2}-\d{2}$/.test(profile.graduationDate)) {
    errors.push({ field: "graduationDate", message: "Use a full date for graduation (YYYY-MM-DD)." });
  } else if (profile.graduationDate && profile.graduationDate < isoDate(today)) {
    conflicts.push({ field: "graduationDate", message: "Your graduation date is in the past. Most internships require current students. Is this right?" });
  }
  const wa = profile.workAuthorization;
  if (wa.authorizedToWork === false && wa.needsSponsorship === false) {
    conflicts.push({ field: "workAuthorization", message: "You said you aren't authorized to work and also don't need sponsorship. Please double-check one of these." });
  }
  if (profile.remotePreference === "remote" && profile.preferredLocations.length > 0) {
    conflicts.push({ field: "remotePreference", message: 'You chose remote only but also listed cities. To include on-site roles in those cities, choose "No preference".' });
  }

  return { ready: errors.length === 0 && missing.length === 0, errors, missing, conflicts };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

/** window.localStorage if usable (not in private mode / SSR), else memory. */
export function browserStorage(): KeyValueStorage {
  try {
    const ls = window.localStorage;
    ls.setItem("careerlaunch.probe", "1");
    ls.removeItem("careerlaunch.probe");
    return ls;
  } catch {
    return memoryStorage();
  }
}

export const STORAGE_KEYS = {
  profile: "careerlaunch.profile",
  previousProfile: "careerlaunch.profile.previous",
  /** Id of the internship the user picked on /internships. Members 3 and 4 read this. */
  selectedInternshipId: "careerlaunch.selectedInternshipId",
} as const;

/** Fired on window when the selected internship changes. detail: { internshipId: string | null } */
export const INTERNSHIP_SELECTED_EVENT = "careerlaunch:internship-selected";

export function createProfileStore(storage: KeyValueStorage = memoryStorage()) {
  const read = (key: string): UserProfile | null => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      // Re-normalize so old or hand-edited data can't crash the pages.
      const profile = normalizeProfile(parsed as Loose);
      profile.updatedAt = str((parsed as Loose).updatedAt) || profile.updatedAt;
      return profile;
    } catch {
      return null; // corrupted or blocked storage behaves as empty
    }
  };
  const write = (key: string, value: UserProfile | null): boolean => {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  return {
    load: () => read(STORAGE_KEYS.profile),
    /** Save; the previous version is kept for one undo. Returns false if storage failed. */
    save(profile: UserProfile): boolean {
      const current = read(STORAGE_KEYS.profile);
      if (current) write(STORAGE_KEYS.previousProfile, current);
      return write(STORAGE_KEYS.profile, profile);
    },
    canUndo: () => read(STORAGE_KEYS.previousProfile) !== null,
    /** Restore the previous version. Returns it, or null if there is none. */
    undo(): UserProfile | null {
      const prev = read(STORAGE_KEYS.previousProfile);
      if (!prev) return null;
      write(STORAGE_KEYS.profile, prev);
      write(STORAGE_KEYS.previousProfile, null);
      return prev;
    },
    /** Delete the profile, its undo copy, and the selected internship from this device. */
    reset(): void {
      write(STORAGE_KEYS.profile, null);
      write(STORAGE_KEYS.previousProfile, null);
      try {
        storage.removeItem(STORAGE_KEYS.selectedInternshipId);
      } catch {
        /* ignore */
      }
    },
  };
}

export type ProfileStore = ReturnType<typeof createProfileStore>;
