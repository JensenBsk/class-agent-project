import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { Welcome } from "@/app/_home/Welcome";
import { STORAGE_KEYS, createProfileStore } from "@/services/matching/profile";

beforeEach(() => {
  window.localStorage.clear();
  push.mockReset();
});
afterEach(cleanup);

describe("Welcome (starting page)", () => {
  it("has one main heading and links Get started to the profile", () => {
    render(<Welcome />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find internships that fit you");
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/profile");
    expect(screen.getByText(/fictional student/)).toBeInTheDocument();
  });

  it("Try the Maya demo saves the demo profile and opens ranked internships", () => {
    render(<Welcome />);
    fireEvent.click(screen.getByRole("button", { name: "Try the Maya demo" }));
    expect(createProfileStore(window.localStorage).load()?.id).toBe("mock-profile-maya");
    expect(push).toHaveBeenCalledWith("/internships");
  });

  it("shows an error instead of navigating if saving is blocked", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.profile) throw new Error("blocked");
    });
    render(<Welcome />);
    fireEvent.click(screen.getByRole("button", { name: "Try the Maya demo" }));
    expect(screen.getByRole("alert")).toHaveTextContent("blocked saving");
    expect(push).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
