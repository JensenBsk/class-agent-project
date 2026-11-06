import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InternshipsView } from "@/app/internships/InternshipsView";
import { ProfileForm } from "@/app/profile/ProfileForm";
import { createInternshipService } from "@/services/matching/internships";
import { INTERNSHIP_SELECTED_EVENT, STORAGE_KEYS, createProfileStore, demoProfile } from "@/services/matching/profile";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("ProfileForm", () => {
  it("asks follow-up questions when required fields are missing", async () => {
    render(<ProfileForm />);
    fireEvent.click(await screen.findByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("A few questions before we can match you")).toBeInTheDocument();
    expect(screen.getByText("What is your major (or intended major)?")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See ranked internships" })).not.toBeInTheDocument();
  });

  it("shows an error for an invalid GPA and does not save", async () => {
    render(<ProfileForm />);
    fireEvent.change(await screen.findByLabelText(/GPA/), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GPA must be between 0.0 and 4.0");
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });

  it("loads Maya, saves her, and links to ranked internships", async () => {
    render(<ProfileForm />);
    fireEvent.click(await screen.findByRole("button", { name: "Load Maya demo profile" }));
    expect(await screen.findByText("Maya's demo profile is loaded and saved.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See ranked internships" })).toHaveAttribute("href", "/internships");
    expect(screen.getByLabelText(/^Major/)).toHaveValue("Management Information Systems");
    expect(createProfileStore(window.localStorage).load()?.id).toBe("mock-profile-maya");
  });

  it("asks for approval before deleting, and deletes only after confirming", async () => {
    createProfileStore(window.localStorage).save(demoProfile());
    render(<ProfileForm />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete my data" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete your data?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Delete my data" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Delete your data?" })).getByRole("button", { name: "Delete everything" }));
    expect(await screen.findByText("Your data was deleted from this device.")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.profile)).toBeNull();
  });
});

describe("InternshipsView", () => {
  it("shows an empty state that links to the profile when there is no profile", async () => {
    render(<InternshipsView />);
    expect(await screen.findByText("Create your profile first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create profile" })).toHaveAttribute("href", "/profile");
  });

  it("ranks internships for Maya with explanations and mock-data labels", async () => {
    createProfileStore(window.localStorage).save(demoProfile());
    render(<InternshipsView />);
    const list = await screen.findByRole("list", { name: /Ranked internships/ });
    const cards = within(list).getAllByRole("article");
    expect(cards.length).toBe(9); // 11 listings - 1 duplicate - 1 expired
    expect(within(cards[0]).getByRole("heading", { level: 2 })).toHaveTextContent("Data Analyst Intern");
    expect(within(cards[0]).getByText(/Brightline Analytics/)).toBeInTheDocument();
    expect(within(cards[0]).getByText("Mock data")).toBeInTheDocument();
    expect(within(cards[0]).getByText("Why it matches")).toBeInTheDocument();
    expect(screen.getByText(/1 duplicate listing\(s\) hidden/)).toBeInTheDocument();
  });

  it("selecting an internship saves the choice, fires the shared event, and updates the next action", async () => {
    createProfileStore(window.localStorage).save(demoProfile());
    const onSelect = vi.fn();
    window.addEventListener(INTERNSHIP_SELECTED_EVENT, onSelect);
    render(<InternshipsView />);
    const list = await screen.findByRole("list", { name: /Ranked internships/ });
    fireEvent.click(within(list).getAllByRole("button", { name: "Select this internship" })[0]);
    expect(window.localStorage.getItem(STORAGE_KEYS.selectedInternshipId)).toBe("mock-int-001");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/You selected Data Analyst Intern/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tailor résumé and cover letter" })).toHaveAttribute("href", "/documents");
    window.removeEventListener(INTERNSHIP_SELECTED_EVENT, onSelect);
  });

  it("shows an empty state with a clear-filters button when nothing matches", async () => {
    createProfileStore(window.localStorage).save(demoProfile());
    render(<InternshipsView />);
    await screen.findByRole("list", { name: /Ranked internships/ });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz-no-match" } });
    expect(await screen.findByText("No internships match these filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByRole("list", { name: /Ranked internships/ })).toBeInTheDocument();
  });

  it("shows an error state with Try again when the data source fails", async () => {
    createProfileStore(window.localStorage).save(demoProfile());
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    let fail = true;
    const service = createInternshipService({
      name: "Flaky",
      isMock: true,
      listInternships: async () => {
        if (fail) throw new Error("network down");
        const { buildMockInternships } = await import("@/data/internships.mock");
        return buildMockInternships();
      },
    });
    render(<InternshipsView service={service} />);
    expect(await screen.findByText("We couldn't load internships right now.")).toBeInTheDocument();
    fail = false;
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    await waitFor(() => expect(screen.getByRole("list", { name: /Ranked internships/ })).toBeInTheDocument());
    spy.mockRestore();
  });
});
