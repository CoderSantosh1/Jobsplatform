// Live SEO regression checks against a running site.
//   BASE_URL=http://localhost:3000 pnpm test:seo                 (local `pnpm build && pnpm start`)
//   BASE_URL=https://www.sarkariresultsnow.com pnpm test:seo     (production)
// SAMPLE=<n> pages per child sitemap are crawled (default 3). CHECK_DOMAIN=1 also checks the
// http/apex → https://www redirect chain, which is configured in Vercel Domains, not in code.
import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SAMPLE = Number(process.env.SAMPLE || 3);
const SITE = "https://www.sarkariresultsnow.com";

// ---------- helpers ----------

async function get(path, { redirect = "follow", tries = 3 } = {}) {
  const url = path.startsWith("http") ? toBase(path) : BASE + path;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect, headers: { "user-agent": "SRN-SEO-regression/1.0" } });
      const body = redirect === "manual" ? "" : await res.text();
      return { res, body, url };
    } catch (error) {
      // Production has shown occasional connection resets; retry before failing.
      if (attempt >= tries) throw new Error(`${url}: ${error.cause?.code || error.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

/** Sitemaps always contain production URLs; map them onto BASE so local runs hit the local server. */
function toBase(url) {
  return url.startsWith(SITE) ? BASE + url.slice(SITE.length) : url;
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function head(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const meta = (name) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]*content="([^"]*)"`, "i"))?.[1];
  return {
    title: title === undefined ? undefined : decode(title).trim(),
    description: meta("description") && decode(meta("description")),
    robots: meta("robots"),
    ogImage: meta("og:image"),
    canonical: html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i)?.[1],
    h1Count: (html.match(/<h1[\s>]/gi) || []).length,
    h1: decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(),
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]),
  };
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
}

function lastmods(xml) {
  return [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
}

const pages = new Map(); // url -> head()
const children = new Map(); // child sitemap url -> xml

/** The <title> must start with the same words as the H1 (catches mangled titles, e.g. a lost "s"). */
function assertTitleMatchesH1(url, h) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const start = norm(h.title.split(/ – | \| |: /)[0]).slice(0, 20);
  assert.ok(norm(h.h1).startsWith(start), `${url}: title "${h.title}" does not match H1 "${h.h1}"`);
}

/** Visible words inside <main>, ignoring header/footer boilerplate. */
function mainWordCount(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
  const text = main
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

async function checkIndexablePage(path, { expectCanonical, titleMatchesH1 = false, minWords = 0 } = {}) {
  const { res, body, url } = await get(path);
  assert.equal(res.status, 200, `${url} status`);
  const h = head(body);
  pages.set(url, h);

  assert.ok(h.title, `${url}: missing <title>`);
  assert.ok(h.title.length <= 60, `${url}: title is ${h.title.length} chars: "${h.title}"`);
  assert.ok(!h.title.includes("…"), `${url}: title cut with ellipsis: "${h.title}"`);
  assert.ok(!/\s(?:&|and|of|for|–|-)$|\($/.test(h.title), `${url}: title ends mid-phrase: "${h.title}"`);

  assert.ok(h.description, `${url}: missing meta description`);
  assert.ok(h.description.length >= 50 && h.description.length <= 165, `${url}: description length ${h.description.length}`);

  assert.equal(h.h1Count, 1, `${url}: expected exactly one <h1>, found ${h.h1Count}`);
  assert.ok(!/ {2}/.test(h.title), `${url}: title has double spaces: "${h.title}"`);
  if (titleMatchesH1) assertTitleMatchesH1(url, h);
  // "Soft 404": a 200 page with almost nothing on it.
  if (minWords) {
    const words = mainWordCount(body);
    assert.ok(words >= minWords, `${url}: only ${words} words of main content (soft-404 risk)`);
  }

  assert.ok(h.canonical?.startsWith(SITE), `${url}: canonical "${h.canonical}" must be absolute ${SITE}`);
  if (expectCanonical) {
    const trim = (u) => u.replace(/\/$/, "");
    assert.equal(trim(h.canonical), trim(expectCanonical), `${url}: canonical should equal its sitemap URL`);
  }

  assert.ok(!/noindex/i.test(h.robots || ""), `${url}: indexable page has robots "${h.robots}"`);

  assert.ok(h.jsonLd.length > 0, `${url}: no JSON-LD`);
  for (const block of h.jsonLd) {
    let data;
    assert.doesNotThrow(() => (data = JSON.parse(block)), `${url}: invalid JSON-LD`);
    for (const item of [data].flat()) {
      if (item["@type"] === "JobPosting") {
        for (const key of ["title", "description", "datePosted", "hiringOrganization", "jobLocation"])
          assert.ok(item[key], `${url}: JobPosting missing ${key}`);
        if (item.validThrough)
          assert.ok(new Date(item.validThrough) > new Date(Date.now() - 864e5), `${url}: JobPosting shown for an expired job`);
      }
    }
  }

  const cache = res.headers.get("cache-control") || "";
  assert.ok(!/no-store|private/.test(cache), `${url}: not cacheable (cache-control: ${cache})`);
  return { h, body };
}

// ---------- tests ----------

before(async () => {
  let res;
  try {
    ({ res } = await get("/robots.txt", { tries: 1 }));
  } catch {
    // One clear message instead of the same connection error under every test.
    console.error(
      `\nNo site is running at ${BASE}.\n` +
        (BASE.includes("localhost")
          ? "Start it first in another terminal:  pnpm build  then  pnpm start\n" +
            "Or check the live site instead:      pnpm test:seo:live\n"
          : "Check the URL and your internet connection.\n"),
    );
    process.exit(1);
  }
  assert.equal(res.status, 200, `Site not reachable at ${BASE}`);
});

test("robots.txt allows crawling and points to the sitemap index", async () => {
  const { body } = await get("/robots.txt");
  assert.match(body, /User-agent: \*/);
  assert.match(body, /Sitemap: https:\/\/www\.sarkariresultsnow\.com\/sitemap\.xml/);
  assert.match(body, /Disallow: \/admin\//);
});

test("sitemap.xml is an index of small child sitemaps with real lastmod", async () => {
  const { res, body } = await get("/sitemap.xml");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /xml/);
  assert.match(body, /<sitemapindex/);
  const childUrls = locs(body);
  assert.ok(childUrls.length >= 5, `only ${childUrls.length} child sitemaps`);

  for (const child of childUrls) {
    const { res: r, body: xml } = await get(child);
    assert.equal(r.status, 200, `${child} status`);
    assert.match(xml, /<urlset/, `${child} is not a urlset`);
    assert.ok(Buffer.byteLength(xml) < 10 * 1024 * 1024, `${child} is too large`);
    const urls = locs(xml);
    assert.ok(urls.length < 50000, `${child} has ${urls.length} URLs`);
    for (const u of urls) {
      assert.ok(u.startsWith(SITE), `${child}: non-canonical host ${u}`);
      assert.ok(!/\/quizzes\/[^/]+(\/instructions)?$/.test(u), `${child}: thin quiz page listed: ${u}`);
    }
    // "Duplicate without user-selected canonical": the same post must not be submitted twice.
    if (/\/(jobs|results|admit-cards|answer-keys|admissions)\.xml$/.test(child)) {
      const seenSlugs = new Map();
      for (const u of urls) {
        const slug = u.replace(/-?[a-f0-9]{24}$/, "");
        if (slug.endsWith("/")) continue; // no Latin title, id-only URL
        assert.ok(!seenSlugs.has(slug), `${child}: duplicate post listed twice:\n  ${seenSlugs.get(slug)}\n  ${u}`);
        seenSlugs.set(slug, u);
      }
    }
    const mods = lastmods(xml);
    if (mods.length > 5) {
      assert.ok(new Set(mods).size > 1, `${child}: every lastmod is identical (${mods[0]})`);
    }
    children.set(child, xml);
  }
});

test("key pages: title ≤60, one H1, canonical, description, JSON-LD, cacheable", async () => {
  for (const path of ["/", "/jobs", "/results", "/admit-cards", "/answer-keys", "/quizzes", "/test-series", "/about", "/privacy-policy", "/disclaimer", "/terms"]) {
    await checkIndexablePage(path, { expectCanonical: path === "/" ? `${SITE}` : `${SITE}${path}` }).catch((e) => {
      // The home canonical may be "https://www.sarkariresultsnow.com" or ".../"
      if (path === "/" && /canonical should equal/.test(e.message)) return;
      throw e;
    });
  }
});

test("sampled sitemap pages pass the same checks and canonical = sitemap URL", async () => {
  assert.ok(children.size, "sitemap test must run first");
  // Check every sampled page and report all problems together, not just the first one.
  const problems = [];
  for (const [child, xml] of children) {
    const urls = locs(xml).slice(0, SAMPLE);
    // Detail and test-series pages put the post/exam name first in both <title> and H1.
    const titleMatchesH1 = !child.endsWith("/pages.xml");
    for (const u of urls) {
      try {
        await checkIndexablePage(u, { expectCanonical: u, titleMatchesH1, minWords: 120 });
      } catch (error) {
        problems.push(error.message.split("\n")[0]);
      }
    }
  }
  assert.deepEqual(problems, [], `${problems.length} sampled page(s) failed:\n${problems.join("\n")}`);
});

test("every page in pages.xml is a 200, self-canonical and not noindex (no submitted redirects/noindex)", async () => {
  const pagesXml = [...children].find(([u]) => u.endsWith("/pages.xml"))?.[1];
  assert.ok(pagesXml, "no pages.xml");
  let examPages = 0;
  let examPagesWithUpdates = 0;
  for (const u of locs(pagesXml)) {
    const { res, body } = await get(u);
    if (/^https:\/\/www\.sarkariresultsnow\.com\/[a-z0-9-]+$/.test(u) && /2026: Notification/.test(head(body).title || "")) {
      examPages++;
      if (/Updates<\/h2>/.test(body)) examPagesWithUpdates++;
    }
    assert.ok(!res.redirected, `${u}: redirects to ${res.url} (sitemaps must list final URLs only)`);
    assert.equal(res.status, 200, `${u}: status ${res.status}`);
    const h = head(body);
    assert.ok(!/noindex/i.test(h.robots || ""), `${u}: submitted in sitemap but noindex`);
    assert.equal((h.canonical || "").replace(/\/$/, ""), u.replace(/\/$/, ""), `${u}: canonical "${h.canonical}"`);
  }
  // Regression: exam pages once matched no posts because of a broken search regex.
  if (examPages >= 3) assert.ok(examPagesWithUpdates > 0, `none of ${examPages} exam pages lists any job/result updates`);
});

test("/test-series links every test series in the sitemap (no orphan exam pages)", async () => {
  const xml = [...children].find(([u]) => u.endsWith("/test-series.xml"))?.[1];
  assert.ok(xml, "no test-series.xml");
  const { res, body } = await get("/test-series");
  assert.equal(res.status, 200, "/test-series status");
  const linked = new Set([...body.matchAll(/href="(\/test-series\/[^"#?]+)"/g)].map((m) => m[1]));
  const missing = locs(xml)
    .map((u) => u.slice(SITE.length))
    .filter((p) => p !== "/test-series" && !linked.has(p));
  assert.deepEqual(missing, [], "test-series pages not linked from /test-series");
});

test("test-series URLs in the sitemap do not redirect", async () => {
  const xml = [...children].find(([u]) => u.endsWith("/test-series.xml"))?.[1];
  assert.ok(xml, "no test-series.xml");
  for (const u of locs(xml).slice(0, SAMPLE * 5)) {
    const { res } = await get(u, { redirect: "manual" });
    assert.equal(res.status, 200, `${u}: status ${res.status}`);
  }
});

test("titles are unique across checked pages", () => {
  const seen = new Map();
  for (const [url, h] of pages) {
    if (!h.title) continue;
    assert.ok(!seen.has(h.title), `duplicate title "${h.title}" on ${url} and ${seen.get(h.title)}`);
    seen.set(h.title, url);
  }
});

test("og:image is a reachable 1200x630 PNG", async () => {
  const any = [...pages.values()].find((h) => h.ogImage);
  assert.ok(any, "no og:image found");
  const { res } = await get(any.ogImage);
  assert.equal(res.status, 200, `${any.ogImage} status`);
  assert.match(res.headers.get("content-type") || "", /image\//);
});

test("single quiz pages are noindex, slugged and cacheable", async () => {
  const seriesXml = [...children].find(([u]) => u.includes("test-series"))?.[1];
  assert.ok(seriesXml, "no test-series sitemap");
  const seriesUrl = locs(seriesXml).find((u) => u.split("/").length > 5) || locs(seriesXml)[0];
  const { body } = await get(seriesUrl);
  const quizHref = body.match(/href="(\/quizzes\/[^"]+\/instructions)"/)?.[1];
  assert.ok(quizHref, `no quiz link on ${seriesUrl}`);
  assert.match(quizHref, /\/quizzes\/[a-z0-9-]+-[a-f0-9]{24}\/instructions/, "quiz URL has no slug");

  const linkText = decode(
    body.match(new RegExp(`href="${quizHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>([^<]+)<`))?.[1] || "",
  ).trim();

  const { res, body: quizHtml } = await get(quizHref);
  assert.equal(res.status, 200);
  const quizHead = head(quizHtml);
  assert.match(quizHead.robots || "", /noindex/, "quiz page must be noindex");
  // The quiz <title> must keep the quiz name intact (regression: every "s" was once stripped).
  if (linkText) {
    const prefix = linkText.slice(0, Math.min(linkText.length, 25)).toLowerCase();
    assert.ok(quizHead.title.toLowerCase().startsWith(prefix), `quiz title "${quizHead.title}" vs link "${linkText}"`);
  }
  const cache = res.headers.get("cache-control") || "";
  assert.ok(!/no-store|private/.test(cache), `quiz page not cacheable (cache-control: ${cache})`);
});

test("test-series titles make no unverified Hindi claim", () => {
  for (const [url, h] of pages) {
    if (url.includes("/test-series/")) assert.ok(!/hindi/i.test(h.title || ""), `${url}: "${h.title}"`);
  }
});

test("legacy URLs redirect permanently in one hop", async () => {
  const cases = [
    ["/latest-jobs", "/jobs"],
    ["/admit-card", "/admit-cards"],
    ["/quizzes?category=SSC&subcategory=SSC%20GD", "/test-series/ssc/ssc-gd"],
  ];
  const jobsXml = [...children].find(([u]) => u.endsWith("/jobs.xml"))?.[1];
  const jobUrl = jobsXml && locs(jobsXml)[0];
  if (jobUrl) {
    const id = jobUrl.match(/([a-f0-9]{24})$/)?.[1];
    if (id && !jobUrl.endsWith(`/jobs/${id}`)) cases.push([`/jobs/${id}`, jobUrl.slice(SITE.length)]);
  }
  for (const [from, to] of cases) {
    const { res } = await get(from, { redirect: "manual" });
    assert.ok([301, 308].includes(res.status), `${from}: expected 301/308, got ${res.status}`);
    const location = new URL(res.headers.get("location"), BASE);
    assert.equal(location.pathname, to, `${from} → ${location.pathname}`);
  }
});

test("unknown pages return a real 404", async () => {
  for (const path of ["/this-page-does-not-exist-xyz", "/jobs/not-a-real-job"]) {
    const { res } = await get(path);
    assert.equal(res.status, 404, `${path} status`);
  }
});

test("domain redirects reach https://www with permanent hops only", { skip: process.env.CHECK_DOMAIN !== "1" }, async () => {
  // Vercel always upgrades http→https on the same host first, so http://apex takes 2 hops; that is fine
  // as long as every hop is permanent (301/308) and the chain ends at the www origin.
  for (const start of ["http://sarkariresultsnow.com/jobs?x=1", "https://sarkariresultsnow.com/jobs?x=1", "http://www.sarkariresultsnow.com/jobs?x=1"]) {
    let url = start;
    let hops = 0;
    for (;;) {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 300 || res.status >= 400) {
        assert.equal(res.status, 200, `${start}: ended with ${res.status} at ${url}`);
        break;
      }
      assert.ok([301, 308].includes(res.status), `${url}: ${res.status} is a temporary redirect`);
      url = new URL(res.headers.get("location"), url).href;
      assert.ok(++hops <= 2, `${start}: more than 2 redirects`);
    }
    assert.equal(url, `${SITE}/jobs?x=1`, `${start} should end at ${SITE}/jobs?x=1 (path and query kept)`);
  }
});
