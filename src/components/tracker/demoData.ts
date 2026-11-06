// MOCK DATA wiring for the tracker until Member 2's profile and ranked
// internships are on `main`. Swap these for the real profile id and the
// user's ranked internships when they exist.

import mockInternships from "@/data/resume-interview/mock-internships.json";
import mockProfile from "@/data/resume-interview/mock-profile-maya.json";
import type { InternshipRef } from "@/agents/tracker";

export const DEMO_USER_ID: string = mockProfile.userProfile.id;
export const DEMO_USER_NAME: string = mockProfile.userProfile.name;

export interface TrackableInternship extends InternshipRef {
  location?: string;
  isMock: boolean;
}

export const TRACKABLE_INTERNSHIPS: TrackableInternship[] = mockInternships.internships.map((i) => ({
  id: i.id,
  company: i.company,
  title: i.title,
  applicationDeadline: i.applicationDeadline,
  location: i.location,
  isMock: i.isMock,
}));
