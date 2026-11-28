// Admin SEO tools: content title/description checks, page tag parsing, canonical verdicts and redirect safety rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalVerdict, contentSeoRow, isSafePath, parsePageSeo, redirectProblems, schemaMissing } from "../../src/lib/admin-seo-checks.ts";

const ORIGIN = "https://www.sarkariresultsnow.com";

test("content row uses the public title builder and flags problems", () => {
  const ok = contentSeoRow("results", { _id: "a1", title: "UP Police Constable Result 2026", organization: "UPPRPB", status: "published" });
  assert.match(ok.metaTitle, /UP Police Constable Result 2026/);
  assert.ok(ok.metaTitle.length <= 60);
  assert.deepEqual(ok.issues, []);

  const long = contentSeoRow("results", { _id: "a2", title: "A very long result title that keeps going well past the sixty character search limit", organization: "X" });
  assert.ok(long.issues.includes("title-cut"));
  assert.ok(long.metaTitle.length <= 60);

  const bad = contentSeoRow("admissions", { _id: "a3", title: "News", content: "", status: "draft" }, true);
  assert.deepEqual(bad.issues.sort(), ["description-short", "draft", "duplicate", "no-organization", "title-short"].sort());
});

test("expired is only flagged for published jobs past their last date", () => {
  const past = contentSeoRow("jobs", { _id: "j", title: "SSC CGL 2025 Online Form", organization: "SSC", status: "published", lastDateApplyOnline: "2025-01-01" });
  assert.ok(past.issues.includes("expired"));
  const future = contentSeoRow("jobs", { _id: "j", title: "SSC CGL 2099 Online Form", organization: "SSC", status: "published", lastDateApplyOnline: "2099-01-01" });
  assert.ok(!future.issues.includes("expired"));
});

test("page parser reads title, description, canonical, robots, viewport, h1, JSON-LD and internal links", () => {
  const html = `<html><head><title>Jobs &amp; Results | SRN</title>
    <meta name="description" content="Latest jobs">
    <meta name="robots" content="noindex, follow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="https://www.sarkariresultsnow.com/jobs"/>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"JobPosting","title":"X"},{"@type":"BreadcrumbList","itemListElement":[1]}]}</script>
    <script type="application/ld+json">{bad json</script>
    </head><body><h1>Latest <b>Jobs</b></h1>
    <a href="/jobs/a">a</a><a href="https://www.sarkariresultsnow.com/results?x=1">b</a><a href="https://other.com/x">c</a><a href="#top">d</a><a href="mailto:a@b.c">e</a>
    </body></html>`;
  const p = parsePageSeo(html, { status: 200, origin: ORIGIN });
  assert.equal(p.title, "Jobs & Results | SRN");
  assert.equal(p.description, "Latest jobs");
  assert.equal(p.canonical, "https://www.sarkariresultsnow.com/jobs");
  assert.equal(p.noindex, true);
  assert.equal(p.hasViewport, true);
  assert.deepEqual(p.h1, ["Latest Jobs"]);
  assert.deepEqual(p.internalLinks, ["/jobs/a", "/results"]);
  assert.equal(p.jsonLd.length, 3);
  assert.deepEqual(p.jsonLd[0].types, ["JobPosting"]);
  assert.deepEqual(p.jsonLd[0].missing, ["JobPosting.description", "JobPosting.datePosted", "JobPosting.hiringOrganization"]);
  assert.deepEqual(p.jsonLd[1].missing, []);
  assert.ok(p.jsonLd[2].error);
});

test("X-Robots-Tag header also counts as noindex", () => {
  assert.equal(parsePageSeo("<title>x</title>", { status: 200, origin: ORIGIN, xRobotsTag: "noindex" }).noindex, true);
  assert.equal(parsePageSeo("<title>x</title>", { status: 200, origin: ORIGIN }).noindex, false);
});

test("schemaMissing ignores unknown types", () => {
  assert.deepEqual(schemaMissing({ "@type": "Thing" }), []);
  assert.deepEqual(schemaMissing({ "@type": ["FAQPage"], mainEntity: [] }), ["FAQPage.mainEntity"]);
});

test("canonical verdict", () => {
  assert.equal(canonicalVerdict("/jobs/a", "https://www.sarkariresultsnow.com/jobs/a", ORIGIN), "self");
  assert.equal(canonicalVerdict("/jobs/a/", "/jobs/a", ORIGIN), "self");
  assert.equal(canonicalVerdict("/jobs/b", "/jobs/a", ORIGIN), "other");
  assert.equal(canonicalVerdict("/jobs/a", null, ORIGIN), "missing");
});

test("only same-site paths can be inspected", () => {
  assert.ok(isSafePath("/jobs?page=2"));
  for (const bad of ["jobs", "//evil.com/x", "/a b", "https://evil.com", "/\\evil.com", 5]) assert.equal(isSafePath(bad), false, String(bad));
});

test("redirect rules block homepage targets, self-redirects and chains", () => {
  const live = [{ from: "/latest-jobs", to: "/jobs" }];
  assert.deepEqual(redirectProblems({ from: "/test-series/police/x", to: "/test-series/ssc-exams/x" }, live), []);
  assert.ok(redirectProblems({ from: "/old", to: "/" }, live).some((p) => p.includes("homepage")));
  assert.ok(redirectProblems({ from: "/", to: "/jobs" }, live).some((p) => p.includes("homepage")));
  assert.ok(redirectProblems({ from: "/a", to: "/a/" }, live).some((p) => p.includes("same")));
  assert.ok(redirectProblems({ from: "/x", to: "/latest-jobs" }, live).some((p) => p.includes("chain")));
  assert.ok(redirectProblems({ from: "/jobs", to: "/results" }, live).some((p) => p.includes("chain")));
  assert.ok(redirectProblems({ from: "old", to: "https://evil.com" }, live).length >= 2);
});

test("word count reads only the main content", async () => {
  const { mainWordCount } = await import("../../src/lib/admin-seo-checks.ts");
  const html = `<header><nav>Home Jobs Results</nav></header><main><h1>Title here</h1><p>one two three</p><script>var a = "x y z";</script></main><footer>Footer words</footer>`;
  assert.equal(mainWordCount(html), 5);
  assert.equal(mainWordCount("<body><p>no main tag here</p><footer>skip</footer></body>"), 4);
});

test("page health flags indexing, viewport, graph and content problems", async () => {
  const { pageHealthIssues, markDuplicates, markGraphIssues } = await import("../../src/lib/admin-seo-checks.ts");
  const good = parsePageSeo(
    `<meta name="viewport" content="width=device-width, initial-scale=1"><title>A good title for a page | SRN</title><meta name="description" content="${"word ".repeat(20)}"><link rel="canonical" href="/a"><main><h1>A</h1>${"<p>text</p>".repeat(320)}</main>`,
    { status: 200, origin: ORIGIN },
  );
  assert.deepEqual(pageHealthIssues("/a", good, ORIGIN), []);
  const bad = parsePageSeo(`<meta name="robots" content="noindex"><main><p>short</p></main>`, { status: 200, origin: ORIGIN });
  assert.deepEqual(
    pageHealthIssues("/b", bad, ORIGIN).sort(),
    ["canonical-missing", "description-missing", "h1", "noindex-in-sitemap", "thin", "title-missing", "viewport-missing"].sort(),
  );
  assert.deepEqual(pageHealthIssues("/c", { ...good, status: 308 }, ORIGIN), ["redirect"]);
  assert.deepEqual(pageHealthIssues("/c", { ...good, status: 404 }, ORIGIN), ["not-200"]);

  const rows = markDuplicates([
    { path: "/a", page: good, issues: [] },
    { path: "/a2", page: good, issues: [] },
    { path: "/n", page: { ...good, noindex: true }, issues: [] },
  ]);
  assert.deepEqual(rows[0].issues.sort(), ["duplicate-description", "duplicate-title"]);
  assert.deepEqual(rows[2].issues, [], "noindex pages are not counted as duplicates");

  const graphRows = markGraphIssues([
    { path: "/", page: { ...good, internalLinks: ["/linked", "/dead"] }, issues: [] },
    { path: "/linked", page: { ...good, internalLinks: [] }, issues: [] },
    { path: "/orphan-page", page: { ...good, internalLinks: [] }, issues: [] },
    { path: "/dead", page: null, issues: ["not-200"] },
  ]);
  assert.ok(graphRows[0].issues.includes("broken-links"));
  assert.ok(!graphRows[1].issues.includes("orphan"));
  assert.ok(graphRows[2].issues.includes("orphan"));
});

test("utility pages are not flagged as low content", async () => {
  const { pageHealthIssues } = await import("../../src/lib/admin-seo-checks.ts");
  const page = parsePageSeo(`<meta name="viewport" content="width=device-width, initial-scale=1"><title>Contact Us | SRN</title><meta name="description" content="${"word ".repeat(20)}"><link rel="canonical" href="/contact"><main><h1>Contact</h1>${"<p>w</p>".repeat(200)}</main>`, { status: 200, origin: ORIGIN });
  assert.deepEqual(pageHealthIssues("/contact", page, ORIGIN), []);
  assert.deepEqual(pageHealthIssues("/results/x", { ...page, canonical: "/results/x" }, ORIGIN), ["low-content"]);
});
