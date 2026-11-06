// Loading Member 3's mock data with the shared types, and parsing résumé text.

import mayaData from "@/data/resume-interview/mock-profile-maya.json";
import internshipData from "@/data/resume-interview/mock-internships.json";
import questionBankData from "@/data/resume-interview/interview-question-bank.json";
import { addDays, todayString } from "@/agents/tracker";
import type { Internship, UserProfile } from "@/types";
import type { EvidenceRef, ResumeLine } from "./types";

export type QuestionBank = typeof questionBankData;

/** Maya, the one demo user (fictional). */
export function getDemoProfile(): UserProfile {
  return structuredClone(mayaData.userProfile) as UserProfile;
}

/**
 * The fictional mock internships, with each deadline moved to
 * today + its offset so listings never expire before the demo.
 */
export function getMockInternships(today: string = todayString()): Internship[] {
  const offsets = internshipData._meta.deadlineOffsetDays as Record<string, number>;
  return (structuredClone(internshipData.internships) as Internship[]).map((internship) => {
    const offset = offsets[internship.id];
    return offset === undefined ? internship : { ...internship, applicationDeadline: addDays(today, offset) };
  });
}

export function getQuestionBank(): QuestionBank {
  return questionBankData;
}

const SECTION_HEADERS: Record<string, ResumeLine["section"]> = {
  education: "education",
  experience: "experience",
  "work experience": "experience",
  "volunteer experience": "experience",
  projects: "projects",
  skills: "skills",
};

/**
 * Parse plain résumé text into lines. Recognizes ALL-CAPS section headers
 * (EDUCATION, EXPERIENCE, PROJECTS, SKILLS), "- " bullets, and heading lines
 * such as "Shift Lead — Bean Counter Café, Jan 2025–Present".
 */
export function parseResumeText(resumeText: string | undefined): ResumeLine[] {
  if (!resumeText?.trim()) return [];
  const lines: ResumeLine[] = [];
  let section: ResumeLine["section"] = "header";
  let heading: string | undefined;
  resumeText.split("\n").forEach((raw, lineIndex) => {
    const text = raw.trim();
    if (!text) return;
    const header = SECTION_HEADERS[text.toLowerCase()];
    if (header && text === text.toUpperCase()) {
      section = header;
      heading = undefined;
      return;
    }
    const isBullet = /^[-•*]\s+/.test(text);
    const body = text.replace(/^[-•*]\s+/, "");
    const looksLikeHeading = !isBullet && /\s[—–-]\s/.test(body) && section !== "skills";
    if (looksLikeHeading) heading = body;
    lines.push({
      id: `rl-${lines.length + 1}`,
      lineIndex,
      section,
      heading: looksLikeHeading ? undefined : heading,
      text: body,
      kind: looksLikeHeading ? "heading" : isBullet ? "bullet" : "text",
    });
  });
  return lines;
}

/** Every piece of the student's own data that can back a claim, with where it came from. */
export function profileSources(profile: UserProfile): EvidenceRef[] {
  const sources: EvidenceRef[] = [];
  const add = (sourceId: string, quote: string | undefined) => {
    if (quote?.trim()) sources.push({ sourceType: "profile_field", sourceId, quote });
  };
  add("major", profile.major);
  add("school", profile.school);
  profile.skills.forEach((s, i) => add(`skills[${i}]`, s));
  profile.experience.forEach((e, i) => {
    add(`experience[${i}].title`, e.title);
    add(`experience[${i}].organization`, e.organization);
    add(`experience[${i}].description`, e.description);
    e.skills?.forEach((s, j) => add(`experience[${i}].skills[${j}]`, s));
  });
  add("careerGoals", profile.careerGoals);
  return sources;
}

/** All of the student's own text (résumé + profile), for "is this in their material?" checks. */
export function allSourceText(profile: UserProfile): string {
  return [
    profile.resumeText ?? "",
    profile.name,
    profile.graduationDate,
    profile.availability,
    profile.gpa === undefined ? "" : String(profile.gpa),
    ...profileSources(profile).map((s) => s.quote),
  ].join("\n");
}
