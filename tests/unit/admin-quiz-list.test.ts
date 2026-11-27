// Admin Quiz Management list: paginated query parameters, filter and category facets (src/lib/admin-quiz-list.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuizFacets, parseQuizListParams, quizListFilter, quizListPipeline } from "../../src/lib/admin-quiz-list.ts";

test("parseQuizListParams clamps page and limit and ignores unknown status", () => {
  const p = parseQuizListParams(new URLSearchParams("page=-3&limit=5000&status=deleted&category=%20SSC%20Exams%20"));
  assert.equal(p.page, 1);
  assert.equal(p.limit, 100);
  assert.equal(p.status, "");
  assert.equal(p.category, "SSC Exams");
  assert.equal(parseQuizListParams(new URLSearchParams("")).limit, 24);
  assert.equal(parseQuizListParams(new URLSearchParams("page=3&limit=12")).page, 3);
});

test("quizListFilter matches category and subcategory exactly and escapes the search", () => {
  const f = quizListFilter({ category: "SSC Exams", subcategory: "SSC GD", q: "c++ (mock)", status: "published" });
  assert.equal(f.category, "SSC Exams");
  assert.equal(f.subcategory, "SSC GD");
  assert.equal(f.status, "published");
  const or = f.$or as { title: { $regex: string } }[];
  assert.equal(or[0].title.$regex, "c\\+\\+ \\(mock\\)");
  assert.deepEqual(quizListFilter({ category: "", subcategory: "", q: "", status: "" }), {});
});

test("quizListPipeline skips to the page and never returns question bodies", () => {
  const pipeline = quizListPipeline({ page: 3, limit: 24, category: "", subcategory: "", q: "", status: "" });
  const facet = (pipeline[2] as { $facet: { items: Record<string, unknown>[] } }).$facet;
  assert.deepEqual(facet.items[0], { $skip: 48 });
  assert.deepEqual(facet.items[1], { $limit: 24 });
  const project = (facet.items[2] as { $project: Record<string, unknown> }).$project;
  assert.equal(project.questions, undefined);
  assert.ok(project.questionCount);
});

test("buildQuizFacets totals categories, merges subcategories and sorts both", () => {
  const facets = buildQuizFacets([
    { _id: { c: "SSC Exams", s: "SSC GD" }, count: 20 },
    { _id: { c: "Banking Exams", s: "SBI PO" }, count: 15 },
    { _id: { c: "SSC Exams", s: "SSC CGL" }, count: 10 },
    { _id: { c: " SSC Exams ", s: "SSC GD" }, count: 2 },
    { _id: { c: "", s: "Orphan" }, count: 4 },
    { _id: { c: "Police", s: null }, count: 3 },
  ]);
  assert.deepEqual(facets.map((f) => [f.name, f.count]), [["Banking Exams", 15], ["Police", 3], ["SSC Exams", 32]]);
  assert.deepEqual(facets[2].subcategories, [{ name: "SSC CGL", count: 10 }, { name: "SSC GD", count: 22 }]);
  assert.deepEqual(facets[1].subcategories, []);
});
