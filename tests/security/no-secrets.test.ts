/**
 * Fails the test run if anything that looks like a real secret is in the repo.
 * If this test fails: remove the secret, put it in .env.local (git-ignored),
 * and rotate the key, because it may already have been pushed.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out", ".vercel"]);
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html|ya?ml|txt|env.*)$|^\.env/;

const PATTERNS: [string, RegExp][] = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI-style key", /\bsk-(proj-)?[A-Za-z0-9]{32,}/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Private key", /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (TEXT_EXT.test(name) && stat.size < 1_000_000) yield path;
  }
}

describe("secrets", () => {
  it("no committed file contains an API key or private key", () => {
    const hits: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file);
      if (rel === "tests/security/no-secrets.test.ts") continue;
      const text = readFileSync(file, "utf8");
      for (const [name, pattern] of PATTERNS) {
        if (pattern.test(text)) hits.push(`${rel}: ${name}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it(".gitignore keeps env files out of git", () => {
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.\*$/m);
  });

  it(".env.example has no real values for secrets", () => {
    const example = readFileSync(join(ROOT, ".env.example"), "utf8");
    expect(example).toMatch(/^AI_API_KEY=$/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_.*KEY/m);
  });
});
