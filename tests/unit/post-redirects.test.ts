// Post redirects approved in the admin Redirect Manager are served live by section + post id (src/lib/post-redirects.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildPostRedirectMap, dropRedirectedPosts, parsePostPath, postRedirectFor } from "../../src/lib/post-redirects.ts";

const require = createRequire(import.meta.url);
const audit = require("../../src/lib/admin-data/post-duplicate-audit.json") as {
  suggestions: { from: string; to: string; reason: string }[];
};

const DUP = "6ae2bccef231965137b40335";
const KEEP = "6aed6b3729fcc67efda37ca6";
const TARGET = `/jobs/tnpsc-group-iv-recruitment-2026-${KEEP}`;

test("parsePostPath reads section and id from slugged and bare post URLs only", () => {
  assert.deepEqual(parsePostPath(`/jobs/tnpsc-group-4-${DUP}`), { section: "jobs", id: DUP });
  assert.deepEqual(parsePostPath(`/admit-cards/${DUP.toUpperCase()}/`), { section: "admit-cards", id: DUP });
  assert.equal(parsePostPath(`/quizzes/x-${DUP}`), null);
  assert.equal(parsePostPath(`/jobs/x-${DUP}/instructions`), null);
  assert.equal(parsePostPath("/jobs"), null);
  assert.equal(parsePostPath("/test-series/police/bpsc-aedo"), null);
});

test("an approved redirect matches every slug and the bare id of that post, in that section only", () => {
  const map = buildPostRedirectMap([{ path: `/jobs/tnpsc-group-4-${DUP}`, target: TARGET }]);
  assert.equal(postRedirectFor(map, "jobs", `tnpsc-group-4-${DUP}`), TARGET);
  assert.equal(postRedirectFor(map, "jobs", `renamed-title-${DUP}`), TARGET);
  assert.equal(postRedirectFor(map, "jobs", DUP), TARGET);
  assert.equal(postRedirectFor(map, "results", DUP), null);
  assert.equal(postRedirectFor(map, "jobs", `x-${KEEP}`), null);
  assert.equal(postRedirectFor(map, "jobs", "not-an-id"), null);
});

test("non-post paths, unsafe targets and self-redirects are ignored", () => {
  const map = buildPostRedirectMap([
    { path: "/old-page", target: "/new-page" },
    { path: `/jobs/a-${DUP}`, target: "https://evil.example/x" },
    { path: `/jobs/b-${DUP}`, target: "//evil.example/x" },
    { path: `/jobs/c-${KEEP}`, target: `/jobs/new-slug-${KEEP}` },
  ]);
  assert.equal(map.size, 0);
});

test("dropRedirectedPosts removes only redirected posts of that section", () => {
  const map = buildPostRedirectMap([{ path: `/jobs/x-${DUP}`, target: TARGET }]);
  const rows = [{ _id: DUP }, { _id: KEEP }];
  assert.deepEqual(dropRedirectedPosts(map, "jobs", rows), [{ _id: KEEP }]);
  assert.deepEqual(dropRedirectedPosts(map, "results", rows), rows);
  assert.equal(dropRedirectedPosts(new Map(), "jobs", rows), rows);
});

test("audit suggestions are post URLs in one section, with no chains", () => {
  const froms = new Set(audit.suggestions.map((s) => parsePostPath(s.from)?.id));
  for (const s of audit.suggestions) {
    const from = parsePostPath(s.from);
    const to = parsePostPath(s.to);
    assert.ok(from && to, `${s.from} -> ${s.to} must both be post URLs`);
    assert.equal(from.section, to.section);
    assert.notEqual(from.id, to.id);
    assert.ok(!froms.has(to.id), `${s.to} is itself a suggested redirect`);
    assert.ok(s.reason.length > 10);
  }
  assert.equal(froms.size, audit.suggestions.length, "duplicate suggestions");
});
