/**
 * MOCK DATA. Every company and listing below is FICTIONAL (Member 2).
 *
 * - Uses the shared `Internship` type (src/types, docs/data-definitions.md).
 * - Deadlines and check dates are computed relative to `today`, so the demo
 *   never shows everything as expired.
 * - mock-int-001..004 keep Member 3's ids, companies, and requirements from
 *   src/data/resume-interview/mock-internships.json, rewritten as
 *   `Qualification` objects, so résumé/interview features line up with ranking.
 * - mock-int-010 is expired and mock-int-011 duplicates mock-int-005 on
 *   purpose, to show expired-listing handling and de-duplication.
 *
 * To use a real job board later, write another `InternshipSource` (see
 * src/services/matching/internships.ts). Keep API keys on the server.
 */
import type { Compensation, Internship, Qualification, QualificationType } from "@/types";
import { addDays } from "@/services/matching/text";

const q = (label: string, type: QualificationType, keywords: string[], trainable: boolean): Qualification => ({
  label,
  type,
  keywords,
  trainable,
});
const pay = (hourlyMin: number, hourlyMax: number): Compensation => ({ hourlyMin, hourlyMax, note: "Paid hourly" });

type Template = Omit<Internship, "applicationDeadline" | "lastCheckedAt" | "createdAt" | "updatedAt" | "source" | "isMock"> & {
  /** Deadline = today + this many days (negative = already passed). */
  deadlineInDays: number;
  /** Listing was last checked this many days ago. */
  checkedDaysAgo: number;
  source?: string;
};

const TEMPLATES: Template[] = [
  {
    id: "mock-int-001",
    company: "Brightline Analytics (fictional)",
    title: "Data Analyst Intern",
    location: "San Diego, CA",
    workMode: "hybrid",
    compensation: pay(24, 24),
    requiredQualifications: [
      q("Pursuing a degree in Information Systems, Statistics, Computer Science, or related", "education", ["information systems", "statistics", "computer science", "data science"], false),
      q("Writing SQL queries", "skill", ["sql"], true),
      q("Python for data analysis", "skill", ["python"], true),
      q("Dashboards in Tableau or similar", "skill", ["tableau", "dashboards"], true),
      q("Excel", "skill", ["excel"], true),
    ],
    preferredQualifications: [
      q("Exposure to dbt", "skill", ["dbt"], true),
      q("Understanding of A/B testing", "skill", ["ab-testing"], true),
      q("Strong written communication", "skill", ["communication"], true),
    ],
    relevantMajors: ["information systems", "statistics", "computer science", "data science"],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 70,
    checkedDaysAgo: 0,
    applicationUrl: "https://example.com/mock/brightline/data-analyst-intern",
    industry: "Technology",
    careerTags: ["data", "analytics", "dashboards"],
    description: "Clean and query sales data with SQL, automate small reports in Python, and build Tableau dashboards for client teams. 12-week summer internship, hybrid, 3 days a week in San Diego.",
  },
  {
    id: "mock-int-002",
    company: "Harborview Robotics (fictional)",
    title: "Software Engineering Intern, Cloud Platform",
    location: "Remote (US)",
    workMode: "remote",
    compensation: pay(32, 32),
    requiredQualifications: [
      q("Pursuing a degree in Computer Science or related", "education", ["computer science", "software engineering", "computer engineering"], false),
      q("Proficiency in Java", "skill", ["java"], true),
      q("Kubernetes or container orchestration", "skill", ["kubernetes"], true),
      q("Data structures and algorithms", "education", ["data-structures-algorithms"], false),
      q("Git", "skill", ["git"], true),
    ],
    preferredQualifications: [
      q("Python scripting", "skill", ["python"], true),
      q("A public cloud provider", "skill", ["cloud"], true),
      q("Interest in robotics", "other", ["robotics"], true),
    ],
    relevantMajors: ["computer science", "software engineering", "computer engineering"],
    experienceLevel: "some",
    sponsorshipAvailable: true,
    deadlineInDays: 25,
    checkedDaysAgo: 1,
    applicationUrl: "https://example.com/mock/harborview/swe-cloud-intern",
    industry: "Technology",
    careerTags: ["software", "cloud", "robotics"],
    description: "Help the platform team keep robot-fleet services running in the cloud. Remote within the US.",
  },
  {
    id: "mock-int-003",
    company: "Greenleaf Community Health (fictional)",
    title: "Operations Intern",
    location: "San Diego, CA",
    workMode: "in_person",
    compensation: pay(20, 20),
    requiredQualifications: [
      q("Strong Excel skills", "skill", ["excel"], true),
      q("Scheduling or coordinating people", "skill", ["scheduling"], true),
      q("Clear, friendly communication", "skill", ["communication"], true),
      q("Reliable and detail-oriented", "other", ["detail-oriented", "detail oriented"], true),
    ],
    preferredQualifications: [
      q("Tableau or other reporting tools", "skill", ["tableau", "dashboards"], true),
      q("Customer-service experience", "experience", ["customer-service"], true),
      q("Interest in healthcare", "other", ["healthcare"], true),
    ],
    relevantMajors: [],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 85,
    checkedDaysAgo: 2,
    applicationUrl: "https://example.com/mock/greenleaf/operations-intern",
    industry: "Healthcare",
    careerTags: ["operations", "healthcare", "scheduling"],
    description: "Coordinate clinic schedules, keep patient-flow spreadsheets current, and help front-desk staff on busy days.",
  },
  {
    id: "mock-int-004",
    company: "Cobalt Learning Labs (fictional)",
    title: "Product Marketing Intern",
    location: "Los Angeles, CA",
    workMode: "in_person",
    compensation: { hourlyMin: 0, hourlyMax: 0, note: "Unpaid, academic credit" },
    requiredQualifications: [
      q("Pursuing a degree in Marketing, Communications, or related", "education", ["marketing", "communications"], false),
      q("Google Analytics", "skill", ["google-analytics"], true),
      q("Knowledge of SEO", "skill", ["seo"], true),
      q("Strong copywriting portfolio", "skill", ["copywriting"], false),
    ],
    preferredQualifications: [
      q("Managing social media accounts", "experience", ["social-media"], true),
      q("Figma", "skill", ["figma"], true),
    ],
    relevantMajors: ["marketing", "communications"],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 14,
    checkedDaysAgo: 0,
    applicationUrl: "https://example.com/mock/cobalt/product-marketing-intern",
    industry: "Education",
    careerTags: ["marketing", "education", "content"],
    description: "Write launch copy and track campaign results for a learning app used by middle schools.",
  },
  {
    id: "mock-int-005",
    company: "Northwind Analytics (fictional)",
    title: "Data Analyst Intern",
    location: "Chicago, IL",
    workMode: "hybrid",
    compensation: pay(22, 26),
    requiredQualifications: [
      q("SQL", "skill", ["sql"], true),
      q("Excel or Google Sheets", "skill", ["excel"], true),
    ],
    preferredQualifications: [
      q("Tableau or Power BI", "skill", ["tableau", "dashboards"], true),
      q("Python", "skill", ["python"], true),
    ],
    relevantMajors: ["information systems", "statistics", "data science", "economics", "computer science", "business analytics"],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 12,
    checkedDaysAgo: 1,
    applicationUrl: "https://example.com/mock/northwind/data-analyst-intern",
    industry: "Technology",
    careerTags: ["data", "analytics", "business intelligence"],
    description: "Clean data, write SQL queries, and build weekly dashboards for operations managers.",
  },
  {
    id: "mock-int-006",
    company: "Tidewater Health Data (fictional)",
    title: "Healthcare Data Intern",
    location: "Remote (US)",
    workMode: "remote",
    compensation: pay(21, 23),
    requiredQualifications: [
      q("SQL", "skill", ["sql"], true),
      q("Excel", "skill", ["excel"], true),
    ],
    preferredQualifications: [
      q("Python", "skill", ["python"], true),
      q("HIPAA privacy training", "other", ["hipaa"], true),
    ],
    relevantMajors: [],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 40,
    checkedDaysAgo: 3,
    applicationUrl: "https://example.com/mock/tidewater/healthcare-data-intern",
    industry: "Healthcare",
    careerTags: ["data", "healthcare", "analytics"],
    description: "Check the quality of de-identified clinic data and summarize trends for a small analytics team.",
  },
  {
    id: "mock-int-007",
    company: "Quantum Ridge Labs (fictional)",
    title: "Machine Learning Research Intern",
    location: "Boston, MA",
    workMode: "in_person",
    compensation: pay(45, 50),
    requiredQualifications: [
      q("Python", "skill", ["python"], true),
      q("Machine learning coursework or research", "education", ["machine learning", "deep learning"], false),
      q("Linear algebra and statistics", "education", ["linear algebra"], false),
    ],
    preferredQualifications: [
      q("PyTorch or TensorFlow", "skill", ["pytorch", "tensorflow"], true),
      q("Published research", "experience", ["publication", "research paper"], false),
    ],
    relevantMajors: ["computer science", "mathematics", "data science", "statistics"],
    experienceLevel: "significant",
    sponsorshipAvailable: true,
    deadlineInDays: 30,
    checkedDaysAgo: 4,
    applicationUrl: "https://example.com/mock/quantumridge/ml-research-intern",
    industry: "Technology",
    careerTags: ["machine learning", "research", "ai"],
    description: "Help a research team evaluate models. Meant for students with prior ML research experience.",
  },
  {
    id: "mock-int-008",
    company: "CivicBridge Nonprofit (fictional)",
    title: "Program Data Intern",
    location: "San Diego, CA",
    workMode: "in_person",
    requiredQualifications: [
      q("Excel", "skill", ["excel"], true),
      q("Experience working with the public", "experience", ["customer-service", "tutor", "volunteer"], true),
    ],
    preferredQualifications: [q("Spanish", "skill", ["spanish"], false)],
    relevantMajors: [],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 110,
    checkedDaysAgo: 9,
    applicationUrl: "https://example.com/mock/civicbridge/program-data-intern",
    industry: "Nonprofit",
    careerTags: ["nonprofit", "data", "community"],
    description: "Track attendance and outcomes for after-school programs. Pay is not listed.",
  },
  {
    id: "mock-int-009",
    company: "Atlas Freight Logistics (fictional)",
    title: "Supply Chain Analyst Intern",
    location: "Dallas, TX",
    workMode: "in_person",
    compensation: pay(21, 23),
    requiredQualifications: [
      q("Excel", "skill", ["excel"], true),
      q("Supply chain or operations coursework", "education", ["supply chain", "operations management", "logistics"], false),
    ],
    preferredQualifications: [q("SQL", "skill", ["sql"], true)],
    relevantMajors: ["supply chain management", "business", "industrial engineering"],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 60,
    checkedDaysAgo: 6,
    applicationUrl: "https://example.com/mock/atlas/supply-chain-intern",
    industry: "Logistics",
    careerTags: ["supply chain", "operations", "logistics"],
    description: "Analyze shipment delays and suggest routing improvements to the regional team.",
  },
  {
    id: "mock-int-010",
    company: "Summit Retail Group (fictional)",
    title: "Retail Analytics Intern",
    location: "San Diego, CA",
    workMode: "hybrid",
    compensation: pay(19, 19),
    requiredQualifications: [q("Excel", "skill", ["excel"], true)],
    preferredQualifications: [q("Retail or customer-service experience", "experience", ["customer-service", "retail"], true)],
    relevantMajors: [],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: -5,
    checkedDaysAgo: 12,
    applicationUrl: "https://example.com/mock/summit/retail-analytics-intern",
    industry: "Retail",
    careerTags: ["retail", "analytics", "data"],
    description: "Deadline has passed. Kept to show how expired listings are handled.",
  },
  {
    id: "mock-int-011",
    company: "Northwind Analytics (fictional)",
    title: "Data Analyst Intern",
    location: "Chicago, IL",
    workMode: "hybrid",
    compensation: pay(22, 26),
    requiredQualifications: [q("SQL", "skill", ["sql"], true)],
    preferredQualifications: [],
    relevantMajors: [],
    experienceLevel: "none",
    sponsorshipAvailable: false,
    deadlineInDays: 12,
    checkedDaysAgo: 15,
    applicationUrl: "https://example.com/mock/northwind/data-analyst-intern-repost",
    industry: "Technology",
    careerTags: ["data"],
    description: "Duplicate re-post of mock-int-005 from another (mock) board, checked less recently.",
    source: "mock (fictional re-post)",
  },
];

/** Build the mock dataset with dates relative to `today`. */
export function buildMockInternships(today: Date = new Date()): Internship[] {
  return TEMPLATES.map(({ deadlineInDays, checkedDaysAgo, source, ...rest }) => {
    const checked = `${addDays(today, -checkedDaysAgo)}T00:00:00Z`;
    return {
      ...structuredClone(rest),
      applicationDeadline: addDays(today, deadlineInDays),
      lastCheckedAt: checked,
      createdAt: checked,
      updatedAt: checked,
      source: source ?? "mock (fictional listing)",
      isMock: true,
    };
  });
}
