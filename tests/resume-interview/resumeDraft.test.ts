// Member 3: résumé draft generator and no-fabrication rules (spec tests T3–T7, T15).
import { describe, expect, it } from "vitest";
import {
  allSourceText,
  editDraft,
  generateResumeDraft,
  getDemoProfile,
  getMockInternships,
  metricSuggestions,
  MissingResumeError,
  parseResumeText,
  suggestMetric,
} from "@/services/resume-interview";

const maya = getDemoProfile();
const internships = getMockInternships("2026-11-06");
const [brightline, harborview] = internships;

describe("generateResumeDraft", () => {
  const draft = generateResumeDraft(maya, brightline);

  it("adds SQL and Tableau using Maya's own data, and explains each change", () => {
    expect(draft.content).toMatch(/Python, Excel, Git, customer service, SQL, Tableau/);
    expect(draft.changes.length).toBeGreaterThanOrEqual(2);
    for (const c of draft.changes) expect(c.reason.length).toBeGreaterThan(10);
    expect(draft.isAiGenerated).toBe(true);
    expect(draft.status).toBe("draft");
    expect(draft.version).toBe(1);
  });

  it("T3: every change has evidence quoted from Maya's own data", () => {
    const source = allSourceText(maya);
    draft.changes.forEach((_, i) => {
      expect(draft.changeEvidence[i].length).toBeGreaterThan(0);
      for (const e of draft.changeEvidence[i]) expect(source).toContain(e.quote);
    });
  });

  it("T3: every line of the draft is either from the original résumé or an explained change", () => {
    const original = new Set((maya.resumeText ?? "").split("\n").map((l) => l.trim()));
    const afters = draft.changes.map((c) => c.after);
    for (const line of draft.content.split("\n").map((l) => l.trim())) {
      if (original.has(line)) continue;
      expect(afters.some((a) => line.includes(a))).toBe(true);
    }
  });

  it("T4: employers, titles and dates all come from the original résumé", () => {
    const headings = (text: string) =>
      parseResumeText(text)
        .filter((l) => l.kind === "heading")
        .map((l) => l.text);
    expect(headings(draft.content)).toEqual(headings(maya.resumeText!));
  });

  it("T1/R3: never adds a skill Maya lacks, for any listing", () => {
    for (const internship of internships) {
      const d = generateResumeDraft(maya, internship);
      const missing = d.keywordAnalysis.filter((r) => r.action === "missing_skill");
      for (const r of missing) {
        for (const k of r.keywords) expect(d.content.toLowerCase()).not.toContain(k);
      }
      expect(d.verificationFlags).toEqual([]);
    }
    const d = generateResumeDraft(maya, harborview);
    expect(d.missingKeywords).toEqual(expect.arrayContaining(["java", "kubernetes"]));
    expect(d.content).not.toMatch(/java|kubernetes/i);
  });

  it("R10: never changes the original résumé text", () => {
    const before = maya.resumeText;
    generateResumeDraft(maya, brightline);
    expect(maya.resumeText).toBe(before);
  });
});

describe("rules on edited drafts", () => {
  const draft = generateResumeDraft(maya, brightline);

  it("T5: a metric idea uses a placeholder and blocks approval until it's filled", () => {
    const line = "Tutored middle school students in math";
    const idea = suggestMetric(line)!;
    expect(idea).toContain("[X]");
    expect(idea.match(/\d/)).toBeNull();

    const edited = editDraft(draft, draft.content.replace(line, idea), { profile: maya });
    const flag = edited.verificationFlags.find((f) => f.reason === "metric_placeholder");
    expect(flag).toMatchObject({ severity: "blocking", canConfirm: false, resolution: "pending" });
    expect(edited.claimsToVerify).toContain("[X]");
  });

  it("T5: a made-up number is flagged, but numbers from Maya's data are fine", () => {
    const edited = editDraft(draft, draft.content.replace("Train new baristas", "Trained 15 new baristas"), {
      profile: maya,
    });
    expect(edited.verificationFlags.map((f) => f.claim)).toContain("15");
    expect(draft.verificationFlags.some((f) => f.claim === "320" || f.claim === "2025")).toBe(false);
  });

  it("T6: changing 'Helped organize' to 'Led' raises a scope_escalation warning", () => {
    const edited = editDraft(draft, draft.content.replace("Helped organize", "Led"), { profile: maya });
    const flag = edited.verificationFlags.find((f) => f.reason === "scope_escalation");
    expect(flag).toMatchObject({ claim: "led", severity: "warning", canConfirm: true });
  });

  it("T7: Maya didn't share a GPA, so adding one is blocked", () => {
    expect(maya.gpa).toBeUndefined();
    expect(draft.content).not.toMatch(/gpa/i);
    const edited = editDraft(draft, `${draft.content}\nGPA: 3.4`, { profile: maya });
    expect(edited.verificationFlags.some((f) => f.claim === "GPA" && f.severity === "blocking")).toBe(true);
  });

  it("T7: with a shared GPA, it may appear", () => {
    const withGpa = { ...maya, gpa: 3.4 };
    const d = generateResumeDraft(withGpa, brightline);
    const edited = editDraft(d, `${d.content}\nGPA: 3.4`, { profile: withGpa });
    expect(edited.verificationFlags).toEqual([]);
  });

  it("R2: a changed employer or date line is flagged", () => {
    const edited = editDraft(
      draft,
      draft.content.replace("Bean Counter Café, Jan 2025–Present", "Starbucks, Jan 2022–Present"),
      { profile: maya },
    );
    expect(edited.verificationFlags.some((f) => f.claim.includes("Starbucks"))).toBe(true);
  });

  it("R3: adding a skill Maya lacks is blocked and can't just be confirmed", () => {
    const edited = editDraft(draft, `${draft.content}, dbt`, { profile: maya });
    const flag = edited.verificationFlags.find((f) => f.claim.toLowerCase() === "dbt");
    expect(flag).toMatchObject({ severity: "blocking", canConfirm: false });
  });

  it("suggests up to 3 experience bullets that could use a real number", () => {
    const ideas = metricSuggestions(draft);
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas.length).toBeLessThanOrEqual(3);
    for (const i of ideas) expect(i.suggestion).toContain("[X]");
  });
});

describe("T15: empty state", () => {
  it("won't create a draft without a résumé", () => {
    const empty = { ...maya, resumeText: "", experience: [] };
    expect(() => generateResumeDraft(empty, brightline)).toThrow(MissingResumeError);
    expect(() => generateResumeDraft(empty, brightline)).toThrow(/Add your résumé or experiences/);
  });
});
