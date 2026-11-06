/**
 * The five workflow sections. AppNav and the home page both read this list,
 * so add or rename a section here only.
 */
export interface Section {
  href: string;
  label: string;
  /** One-line description shown on the home page. */
  description: string;
  /** Which team member owns the feature work on this page. */
  owner: string;
}

export const SECTIONS: readonly Section[] = [
  {
    href: "/profile",
    label: "Profile",
    description: "Tell us your major, skills, experience and preferences.",
    owner: "Member 2",
  },
  {
    href: "/internships",
    label: "Internships",
    description: "See ranked internships and why each one matches.",
    owner: "Member 2",
  },
  {
    href: "/documents",
    label: "Résumé & cover letter",
    description: "Review tailored drafts. Nothing is used until you approve it.",
    owner: "Member 3",
  },
  {
    href: "/tracker",
    label: "Tracker",
    description: "Track deadlines, statuses and follow-ups.",
    owner: "Member 4",
  },
  {
    href: "/interview",
    label: "Interview prep",
    description: "Practice questions and STAR talking points for a role.",
    owner: "Member 3",
  },
] as const;
