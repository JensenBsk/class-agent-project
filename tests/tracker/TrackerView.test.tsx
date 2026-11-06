// The /tracker page UI: add, change status, approval gate, remove, reset.
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACKER_STORAGE_KEY } from "@/agents/tracker";
import { TrackerView } from "@/components/tracker/TrackerView";
import { HomeNextAction } from "@/components/tracker/HomeNextAction";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const user = {
  click: async (el: HTMLElement) => {
    await act(async () => {
      fireEvent.click(el);
    });
  },
  selectOptions: async (el: HTMLElement, value: string) => {
    await act(async () => {
      fireEvent.change(el, { target: { value } });
    });
  },
};

async function renderTracker() {
  render(<TrackerView />);
  await screen.findByRole("heading", { name: /Your applications/ });
  return user;
}

async function addFirstInternship(u: typeof user) {
  await u.selectOptions(screen.getByLabelText("Internship"), "mock-int-001");
  await u.click(screen.getByRole("button", { name: "Add to tracker" }));
}

describe("TrackerView", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("shows an empty state, then adds an internship and saves it", async () => {
    const user = await renderTracker();
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
    expect(screen.getByText("Mock data")).toBeInTheDocument();

    await addFirstInternship(user);

    expect(screen.getByRole("heading", { name: "Your applications (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText(/Added Data Analyst Intern/)).toBeInTheDocument();
    expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toContain("mock-int-001");
  });

  it("only offers allowed status changes", async () => {
    const user = await renderTracker();
    await addFirstInternship(user);
    const select = screen.getByLabelText("Move to");
    const options = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Choose a status…", "Preparing", "Withdrawn"]);

    await user.selectOptions(select, "preparing");
    await user.click(screen.getByRole("button", { name: "Update status" }));
    expect(screen.getByText("Moved to “Preparing”.")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Move to")).getByRole("option", { name: "Ready for review" })).toBeInTheDocument();
  });

  it("does not copy a follow-up email until the student approves it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const user = await renderTracker();
    await addFirstInternship(user);
    for (const status of ["preparing", "ready_for_review", "applied"]) {
      await user.selectOptions(screen.getByLabelText("Move to"), status);
      await user.click(screen.getByRole("button", { name: "Update status" }));
    }

    await user.click(screen.getByRole("button", { name: "Draft a follow-up email" }));
    expect(screen.getByRole("heading", { name: "Waiting for your approval (1)" })).toBeInTheDocument();
    expect(screen.getByLabelText("Follow-up email draft")).toHaveTextContent("Maya Rivera");
    expect(writeText).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Approve and copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0][0]).toContain("Following up: Data Analyst Intern application");
    expect(screen.getByRole("heading", { name: "Waiting for your approval (0)" })).toBeInTheDocument();
  });

  it("copies nothing when the student rejects the draft", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const user = await renderTracker();
    await addFirstInternship(user);
    for (const status of ["preparing", "ready_for_review", "applied"]) {
      await user.selectOptions(screen.getByLabelText("Move to"), status);
      await user.click(screen.getByRole("button", { name: "Update status" }));
    }
    await user.click(screen.getByRole("button", { name: "Draft a follow-up email" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByText("Rejected. Nothing was copied or sent.")).toBeInTheDocument();
    expect(screen.getByText(/You declined/)).toBeInTheDocument();
  });

  it("asks for confirmation before removing an application", async () => {
    const user = await renderTracker();
    await addFirstInternship(user);
    await user.click(screen.getByRole("button", { name: "Remove from tracker" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Your applications (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove from tracker" }));
    await user.click(screen.getByRole("button", { name: "Yes, remove it" }));
    expect(screen.getByRole("heading", { name: "Your applications (0)" })).toBeInTheDocument();
  });

  it("shows an error with a way out when saved data is corrupt", async () => {
    localStorage.setItem(TRACKER_STORAGE_KEY, "{broken");
    render(<TrackerView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't be read");
    await user.click(screen.getByRole("button", { name: "Start fresh" }));
    await user.click(screen.getByRole("button", { name: "Yes, start fresh" }));
    expect(await screen.findByText("No applications yet")).toBeInTheDocument();
  });
});

describe("HomeNextAction", () => {
  beforeEach(() => localStorage.clear());

  it("shows the fallback when nothing is tracked", async () => {
    await act(async () => {
      render(<HomeNextAction fallback={<p>Create your profile</p>} />);
    });
    expect(screen.getByText("Create your profile")).toBeInTheDocument();
  });

  it("shows the top recommendation once something is tracked", async () => {
    const user = await renderTracker();
    await addFirstInternship(user);
    render(<HomeNextAction fallback={<p>Create your profile</p>} />);
    expect(await screen.findByRole("link", { name: "Open tracker" })).toHaveAttribute("href", "/tracker");
    expect(screen.queryByText("Create your profile")).not.toBeInTheDocument();
  });
});
