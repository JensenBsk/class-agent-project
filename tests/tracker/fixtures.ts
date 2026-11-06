// MOCK DATA for tests only. Fictional companies.
import type { InternshipRef } from "../../src/agents/tracker";

export const MAYA = "user-maya";
export const OTHER_USER = "user-other";
export const TODAY = "2026-11-06";

export const BRIGHTLINE: InternshipRef = {
  id: "mock-int-001",
  company: "Brightline Analytics (fictional)",
  title: "Data Analyst Intern",
  applicationDeadline: "2027-01-15",
};

export const URGENT: InternshipRef = {
  id: "mock-int-002",
  company: "Harbor Health (fictional)",
  title: "Operations Intern",
  applicationDeadline: "2026-11-09",
};

export const NO_DEADLINE: InternshipRef = {
  id: "mock-int-003",
  company: "Mesa Labs (fictional)",
  title: "Software Intern",
};
