/**
 * MOCK DATA — "Maya" is the fictional demo persona from docs/project-brief.md.
 * Used for the demo scenario and for tests. Not a real person.
 */
export const MAYA_PROFILE = Object.freeze({
  id: 'demo-maya',
  name: 'Maya Rivera',
  school: 'Lakeshore State University (fictional)',
  major: 'Computer Information Systems',
  graduationDate: '2028-05',
  gpa: null,
  skills: ['Python', 'SQL', 'Excel', 'Tableau', 'Communication'],
  experience: [
    {
      title: 'Shift Lead (part-time)',
      organization: 'Corner Market',
      type: 'work',
      description: 'Lead a team of 4 on evening shifts; handle customer issues and nightly sales counts.',
      skills: ['customer service', 'retail', 'leadership'],
    },
    {
      title: 'Class project: Campus Dining Dashboard',
      organization: 'CIS 310 Databases',
      type: 'project',
      description: 'Built a SQL database and Tableau dashboard of dining-hall traffic.',
      skills: ['sql', 'tableau', 'data visualization'],
    },
    {
      title: 'Math Tutor (volunteer)',
      organization: 'Eastside Library Homework Help',
      type: 'volunteer',
      description: 'Tutor middle-school students in algebra twice a week.',
      skills: ['tutoring', 'communication'],
    },
  ],
  preferredIndustries: ['Technology', 'Healthcare'],
  preferredLocations: ['Chicago, IL'],
  remotePreference: 'hybrid',
  availability: 'Summer 2027, up to 40 hrs/week',
  minHourlyRate: 18,
  workAuthorization: { authorizedToWork: true, needsSponsorship: false },
  careerGoals: 'Become a data analyst who builds dashboards that help teams make decisions.',
  resumeText: '',
  portfolioUrl: '',
  updatedAt: '2026-11-06T00:00:00.000Z',
});
