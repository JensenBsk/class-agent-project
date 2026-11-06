// Member 3: the selected internship from Member 2's page (PR #13 review by laurentjedi).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InternshipPicker, resolveSelection, type DemoContext } from "@/app/_resume-interview/shared";
import { getDemoProfile, getMockInternships } from "@/services/resume-interview";

const internships = getMockInternships("2026-11-06");

describe("resolveSelection", () => {
  it("uses the saved internship when this page has it", () => {
    expect(resolveSelection("mock-int-002", internships)).toEqual({
      internship: internships[1],
      unavailableId: null,
    });
  });

  it("falls back to the first internship with no saved choice, without a warning", () => {
    expect(resolveSelection(null, internships)).toEqual({ internship: internships[0], unavailableId: null });
  });

  it("reports an unknown saved id instead of switching silently", () => {
    expect(resolveSelection("mock-int-006", internships)).toEqual({
      internship: internships[0],
      unavailableId: "mock-int-006",
    });
  });
});

describe("InternshipPicker", () => {
  const ctx = (unavailableId: string | null): DemoContext => ({
    profile: getDemoProfile(),
    internships,
    internship: internships[0],
    unavailableId,
    ready: true,
    selectInternship: () => {},
  });

  it("tells the student when their pick isn't available, and what is shown instead", () => {
    render(<InternshipPicker ctx={ctx("mock-int-006")} id="t" />);
    expect(screen.getByRole("alert")).toHaveTextContent("The internship you selected isn't available here yet");
    expect(screen.getByRole("alert")).toHaveTextContent("mock-int-006");
    expect(screen.getByRole("alert")).toHaveTextContent("Data Analyst Intern at Brightline Analytics (fictional)");
  });

  it("shows no warning for a normal selection", () => {
    render(<InternshipPicker ctx={ctx(null)} id="t" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
