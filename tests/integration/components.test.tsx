import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiGeneratedLabel, MockDataLabel } from "@/components/Labels";
import { StateMessage } from "@/components/StateMessage";

vi.mock("next/navigation", () => ({ usePathname: () => "/tracker" }));

describe("StateMessage", () => {
  it("announces errors immediately with role=alert", () => {
    render(<StateMessage variant="error" title="Could not load internships" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load internships");
  });

  it.each(["loading", "empty", "success"] as const)("uses role=status for %s", (variant) => {
    render(<StateMessage variant={variant} title={`A ${variant} state`} />);
    expect(screen.getByRole("status")).toHaveTextContent(`A ${variant} state`);
  });

  it("marks loading as busy and renders an action", () => {
    render(
      <StateMessage variant="loading" title="Loading" action={<button type="button">Cancel</button>} />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

describe("trust labels", () => {
  it("labels mock data and AI-generated text", () => {
    render(
      <>
        <MockDataLabel />
        <AiGeneratedLabel />
      </>,
    );
    expect(screen.getByText("Mock data")).toBeInTheDocument();
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
  });
});

describe("AppNav", () => {
  it("links every section and marks the current page", async () => {
    const { AppNav } = await import("@/components/AppNav");
    render(<AppNav />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/profile",
      "/internships",
      "/documents",
      "/tracker",
      "/interview",
    ]);
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", "/tracker");
  });
});
