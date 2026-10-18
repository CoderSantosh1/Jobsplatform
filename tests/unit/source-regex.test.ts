// Guards against regex literals that lost their backslash (e.g. /s+/ for /\s+/, /^(d{2})/ for /^(\d{2})/).
// Such typos compile fine but silently corrupt text, so scan the source for them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : files(path);
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [path] : [];
  });
}

// A regex literal passed to replace/match/split/search, or assigned to a variable.
const REGEX_LITERAL = /(?:\.(?:replace|replaceAll|match|matchAll|split|search)\(|\b(?:const|let|var)\s+\w+\s*=\s*)\/((?:[^/\n\\]|\\.)+)\/[a-z]*/g;
// \s \d \w written without the backslash, followed by a quantifier.
const MISSING_ESCAPE = /(^|[^\\a-zA-Z0-9])[sdw](?:\+|\*|\{\d)/;

test("no regex literal is missing a backslash before s/d/w", () => {
  const problems: string[] = [];
  for (const file of files("src")) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(REGEX_LITERAL)) {
      if (MISSING_ESCAPE.test(m[1])) {
        const line = text.slice(0, m.index).split("\n").length;
        problems.push(`${file}:${line}  /${m[1]}/`);
      }
    }
  }
  assert.deepEqual(problems, [], `Suspicious regexes:\n${problems.join("\n")}`);
});

test("the scanner itself catches the original bug", () => {
  const bad = 'const t = x.replace(/s+/g, " ");';
  assert.ok([...bad.matchAll(REGEX_LITERAL)].some((m) => MISSING_ESCAPE.test(m[1])));
  const good = 'const t = x.replace(/\\s+/g, " ");';
  assert.ok(![...good.matchAll(REGEX_LITERAL)].some((m) => MISSING_ESCAPE.test(m[1])));
});
