/**
 * UserProfile creation, validation, and storage (Member 2).
 *
 * - createProfile(): build a clean UserProfile from raw form input.
 * - reviewProfile(): find errors, missing info (as follow-up questions), and conflicts.
 * - createProfileStore(): save / load / undo / reset, backed by localStorage
 *   in the browser or memory in tests. Data stays on the user's device.
 */
import { REMOTE_PREFERENCES } from '../models/schemas.js';
import { splitList, todayIso } from '../utils/text.js';

const toBoolOrNull = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);
const toNumberOrNull = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** Build a normalized UserProfile from raw input (e.g. form values). */
export function createProfile(input = {}, now = new Date()) {
  const wa = input.workAuthorization ?? {};
  return {
    id: input.id || `profile-${now.getTime()}`,
    name: String(input.name ?? '').trim(),
    school: String(input.school ?? '').trim(),
    major: String(input.major ?? '').trim(),
    graduationDate: String(input.graduationDate ?? '').trim(),
    gpa: toNumberOrNull(input.gpa),
    skills: splitList(input.skills),
    experience: (Array.isArray(input.experience) ? input.experience : [])
      .map((e) => ({
        title: String(e.title ?? '').trim(),
        organization: String(e.organization ?? '').trim(),
        type: ['work', 'volunteer', 'project'].includes(e.type) ? e.type : 'work',
        description: String(e.description ?? '').trim(),
        skills: splitList(e.skills),
      }))
      .filter((e) => e.title || e.organization),
    preferredIndustries: splitList(input.preferredIndustries),
    preferredLocations: splitList(input.preferredLocations),
    remotePreference: REMOTE_PREFERENCES.includes(input.remotePreference) ? input.remotePreference : 'any',
    availability: String(input.availability ?? '').trim(),
    minHourlyRate: toNumberOrNull(input.minHourlyRate),
    workAuthorization: {
      authorizedToWork: toBoolOrNull(wa.authorizedToWork),
      needsSponsorship: toBoolOrNull(wa.needsSponsorship),
    },
    careerGoals: String(input.careerGoals ?? '').trim(),
    resumeText: String(input.resumeText ?? ''),
    portfolioUrl: String(input.portfolioUrl ?? '').trim(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Review a profile. Only asks follow-up questions for info that matching
 * actually needs — optional fields (GPA, school, portfolio) are never demanded.
 * @returns {{ready: boolean, errors: {field:string,message:string}[], missing: {field:string,question:string}[], conflicts: {field:string,message:string}[]}}
 */
export function reviewProfile(profile, today = todayIso()) {
  const errors = [];
  const missing = [];
  const conflicts = [];

  if (!profile.name) missing.push({ field: 'name', question: 'What name should we use on your drafts?' });
  if (!profile.major) missing.push({ field: 'major', question: 'What is your major (or intended major)?' });
  if (profile.skills.length === 0) {
    missing.push({ field: 'skills', question: 'List a few skills you have used in class, work, or projects (e.g. Excel, Python, customer service).' });
  }
  if (profile.remotePreference !== 'remote' && profile.preferredLocations.length === 0) {
    missing.push({ field: 'preferredLocations', question: 'Which cities could you work in? (Or choose "remote only".)' });
  }
  if (profile.workAuthorization.needsSponsorship === null) {
    missing.push({ field: 'workAuthorization', question: 'Will you need visa sponsorship to work? (Used only to flag listings you may not be eligible for.)' });
  }

  if (profile.gpa !== null && (profile.gpa < 0 || profile.gpa > 4.0)) {
    errors.push({ field: 'gpa', message: 'GPA must be between 0.0 and 4.0, or left blank.' });
  }
  if (profile.minHourlyRate !== null && profile.minHourlyRate < 0) {
    errors.push({ field: 'minHourlyRate', message: 'Minimum pay cannot be negative.' });
  }
  if (profile.graduationDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(profile.graduationDate)) {
    errors.push({ field: 'graduationDate', message: 'Use YYYY-MM for graduation date (e.g. 2028-05).' });
  } else if (profile.graduationDate && profile.graduationDate < today.slice(0, 7)) {
    conflicts.push({ field: 'graduationDate', message: 'Your graduation date is in the past. Most internships require current students — is this correct?' });
  }
  if (profile.workAuthorization.authorizedToWork === false && profile.workAuthorization.needsSponsorship === false) {
    conflicts.push({ field: 'workAuthorization', message: 'You said you are not authorized to work and also do not need sponsorship. Please double-check one of these answers.' });
  }
  if (profile.remotePreference === 'remote' && profile.preferredLocations.length > 0) {
    conflicts.push({ field: 'remotePreference', message: 'You chose remote only but also listed cities. Should in-person roles in those cities be included? (If yes, choose "any".)' });
  }

  return { ready: errors.length === 0 && missing.length === 0, errors, missing, conflicts };
}

/** Memory-backed storage used in tests or when localStorage is unavailable. */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const KEY = 'careerlaunch.profile';
const PREV_KEY = 'careerlaunch.profile.previous';

/**
 * Profile storage with one level of undo.
 * @param {{getItem, setItem, removeItem}} storage  window.localStorage or memoryStorage()
 */
export function createProfileStore(storage = memoryStorage()) {
  const read = (key) => {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null; // corrupted or blocked storage → behave as empty
    }
  };
  const write = (key, value) => {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  return {
    load: () => read(KEY),
    /** Save a profile; the previous version is kept for undo. Returns false if storage failed. */
    save(profile) {
      const current = read(KEY);
      if (current) write(PREV_KEY, current);
      return write(KEY, profile);
    },
    canUndo: () => read(PREV_KEY) !== null,
    /** Restore the previous saved version. Returns the restored profile or null. */
    undo() {
      const prev = read(PREV_KEY);
      if (!prev) return null;
      write(KEY, prev);
      write(PREV_KEY, null);
      return prev;
    },
    /** Delete all saved profile data from this device. */
    reset() {
      write(KEY, null);
      write(PREV_KEY, null);
    },
  };
}
