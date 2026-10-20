// Regression: `\b${word}` in a template string is a backspace character, not a word boundary,
// so exam pages once matched no posts at all. These tests pin the real regexes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { searchWords, titleWordRegexes } from "../../src/lib/search.ts";

const matches = (term: string, title: string) =>
  titleWordRegexes(term).every((source) => new RegExp(source, "i").test(title));

test("search finds titles that contain every word", () => {
  assert.ok(matches("SSC CGL", "SSC CGL Result 2026 Out – Direct Link"));
  assert.ok(matches("UP Police", "UP Police Constable Admit Card 2026"));
  assert.ok(matches("ssc cgl", "Tier 1: SSC CGL Answer Key"));
});

test("search respects word starts", () => {
  assert.ok(!matches("SSC CGL", "ASSC CGLX notice"));
  assert.ok(!matches("SSC CGL", "SSC CHSL Result"));
});

test("regex sources contain a real backslash, never a control character", () => {
  for (const source of titleWordRegexes("SSC CGL 2026")) {
    assert.ok(source.startsWith("\\b"), source);
    assert.ok(!/[\u0000-\u001f]/.test(source), `control character in ${JSON.stringify(source)}`);
  }
  assert.deepEqual(searchWords("A SSC-CGL"), ["SSC", "CGL"]);
});

test("source files contain no control characters (e.g. a backspace from `\\b` in a template string)", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return walk(path);
      return /\.(ts|tsx|js|mjs)$/.test(name) ? [path] : [];
    });
  const bad = walk("src").filter((f) => /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(readFileSync(f, "utf8")));
  assert.deepEqual(bad, []);
});
