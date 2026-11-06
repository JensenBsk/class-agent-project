import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SECTIONS } from "@/lib/sections";

describe("SECTIONS", () => {
  it("has a page file for every section", () => {
    for (const section of SECTIONS) {
      const page = join(process.cwd(), "src/app", section.href, "page.tsx");
      expect(existsSync(page), `missing ${page}`).toBe(true);
    }
  });

  it("has unique routes", () => {
    const hrefs = SECTIONS.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
