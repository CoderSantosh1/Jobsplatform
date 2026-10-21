// AdSense must stay out of the admin dashboard.
import { test } from "node:test";
import assert from "node:assert/strict";
import { HIDE_ADS_CSS, isAdFreePath } from "../../src/lib/ads.ts";

test("admin pages are ad-free", () => {
  for (const path of ["/admin", "/admin/", "/admin/login", "/admin/quizzes/123/edit"]) {
    assert.equal(isAdFreePath(path), true, path);
  }
});

test("public pages keep ads", () => {
  for (const path of ["/", "/jobs", "/jobs/ssc-gd-2026-abc", "/administration-jobs", "/quizzes", null, undefined]) {
    assert.equal(isAdFreePath(path), false, String(path));
  }
});

test("admin CSS hides manual, auto and anchor ad units", () => {
  for (const selector of ["ins.adsbygoogle", ".google-auto-placed", ".adsbygoogle-noablate"]) {
    assert.ok(HIDE_ADS_CSS.includes(selector), selector);
  }
  assert.ok(HIDE_ADS_CSS.endsWith("{display:none!important}"));
});
