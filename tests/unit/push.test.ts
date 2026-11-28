// Web push: notification validation, destinations, permission prompting, admin authorization and rate limiting.
import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  chunk,
  customPushDestinationUrl,
  parseCustomPushInput,
  defaultPushMessage,
  isStaleSubscriptionError,
  isValidFid,
  parsePushSendInput,
  PUSH_TITLE_MAX,
  pushContentPath,
  pushDestinationUrl,
  sanitizePushText,
} from "../../src/lib/push.ts";
import {
  PUSH_DISMISS_COOLDOWN_MS,
  PUSH_RESYNC_MS,
  pushErrorMessage,
  shouldSaveFid,
  shouldShowPushPrompt,
} from "../../src/lib/push-prompt.ts";
import { verifyAdminAuthorization } from "../../src/lib/admin-auth.ts";
import { createRateLimiter } from "../../src/lib/rate-limit.ts";

const ID = "6a0000000000000000000abc";
const ENV = { JWT_SECRET: "test-secret", ADMIN_EMAIL: "admin@example.com" };

test("sanitizePushText strips HTML, control characters and extra spaces, and clips", () => {
  assert.equal(sanitizePushText("  <b>SSC</b>\nGD\u0000  Result ", 50), "SSC GD Result");
  assert.equal(sanitizePushText("<script>alert(1)</script>Hi", 50), "alert(1) Hi");
  assert.equal(sanitizePushText(42, 50), "");
  const clipped = sanitizePushText("x".repeat(100), 10);
  assert.equal(Array.from(clipped).length, 10);
  assert.ok(clipped.endsWith("…"));
});

test("defaultPushMessage uses the type label and stays within the title limit", () => {
  const msg = defaultPushMessage("results", "UP Police Constable Result 2026");
  assert.equal(msg.title, "Result Declared: UP Police Constable Result 2026");
  assert.match(msg.body, /result/i);
  assert.ok(Array.from(defaultPushMessage("jobs", "A".repeat(300)).title).length <= PUSH_TITLE_MAX);
  assert.equal(defaultPushMessage("quizzes", "").title, "Free Test Series");
});

test("pushContentPath builds the public page for each type", () => {
  assert.equal(pushContentPath("jobs", { _id: ID, title: "UCO Bank Apprentice 2026" }), `/jobs/uco-bank-apprentice-2026-${ID}`);
  assert.equal(pushContentPath("admit-cards", { _id: ID, title: "हिंदी" }), `/admit-cards/${ID}`);
  assert.equal(pushContentPath("quizzes", { _id: ID, title: "SSC GD Mock 1" }), `/quizzes/ssc-gd-mock-1-${ID}/instructions`);
});

test("pushDestinationUrl only allows HTTPS content pages on this site", () => {
  assert.equal(pushDestinationUrl(`/results/x-${ID}`), `https://www.sarkariresultsnow.com/results/x-${ID}`);
  assert.equal(pushDestinationUrl("//evil.com/jobs/x"), null);
  assert.equal(pushDestinationUrl("https://evil.com/jobs/x"), null);
  assert.equal(pushDestinationUrl("/\\evil.com"), null);
  assert.equal(pushDestinationUrl("/admin"), null);
  assert.equal(pushDestinationUrl("javascript:alert(1)"), null);
  assert.equal(pushDestinationUrl("/jobs/x", "http://insecure.example"), null);
});

test("parsePushSendInput validates type, id and optional overrides", () => {
  assert.deepEqual(parsePushSendInput({ type: "jobs", id: ID }), { ok: true, value: { type: "jobs", id: ID, resend: false } });
  const ok = parsePushSendInput({ type: "admissions", id: ID, title: " <i>Hi</i> ", body: "Body", resend: true });
  assert.ok(ok.ok && ok.value.title === "Hi" && ok.value.body === "Body" && ok.value.resend);
  assert.equal(parsePushSendInput({ type: "users", id: ID }).ok, false);
  assert.equal(parsePushSendInput({ type: "news", id: ID }).ok, false, "the News section was removed");
  assert.equal(parsePushSendInput({ type: "jobs", id: "not-an-id" }).ok, false);
  assert.equal(parsePushSendInput({ type: "jobs", id: ID, title: "<b></b>" }).ok, false);
  assert.equal(parsePushSendInput({ type: "jobs", id: ID, body: 5 }).ok, false);
  assert.equal(parsePushSendInput({ type: "jobs", id: ID, resend: "yes" }).ok && true, true);
  assert.equal(parsePushSendInput(null).ok, false);
});

test("isValidFid accepts FID-shaped strings only", () => {
  assert.equal(isValidFid("cKw1Zr5mQ0e9bX3fT7yU2a"), true);
  assert.equal(isValidFid("short"), false);
  assert.equal(isValidFid("has spaces in it here!!"), false);
  assert.equal(isValidFid({ $ne: null }), false);
});

test("only permanent FCM errors remove a subscription", () => {
  assert.equal(isStaleSubscriptionError("messaging/installation-id-not-registered"), true);
  assert.equal(isStaleSubscriptionError("messaging/registration-token-not-registered"), true);
  assert.equal(isStaleSubscriptionError("messaging/internal-error"), false);
  assert.equal(isStaleSubscriptionError(undefined), false);
});

test("chunk splits into FCM-sized batches", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 500), []);
});

test("prompt shows only for supported, undecided visitors who have not recently dismissed it", () => {
  const base = { supported: true, configured: true, permission: "default" as const, dismissedAt: null, now: 1e12, pathname: "/" };
  assert.equal(shouldShowPushPrompt(base), true);
  assert.equal(shouldShowPushPrompt({ ...base, supported: false }), false);
  assert.equal(shouldShowPushPrompt({ ...base, configured: false }), false);
  assert.equal(shouldShowPushPrompt({ ...base, permission: "granted" }), false);
  assert.equal(shouldShowPushPrompt({ ...base, permission: "denied" }), false);
  assert.equal(shouldShowPushPrompt({ ...base, pathname: "/admin/login" }), false);
  assert.equal(shouldShowPushPrompt({ ...base, dismissedAt: base.now - 1000 }), false);
  assert.equal(shouldShowPushPrompt({ ...base, dismissedAt: base.now - PUSH_DISMISS_COOLDOWN_MS }), true);
});

test("FID is re-sent when it changes or once a day", () => {
  const now = 1e12;
  assert.equal(shouldSaveFid("a", null, null, now), true);
  assert.equal(shouldSaveFid("a", "a", now - 1000, now), false);
  assert.equal(shouldSaveFid("b", "a", now - 1000, now), true);
  assert.equal(shouldSaveFid("a", "a", now - PUSH_RESYNC_MS, now), true);
});

test("pushErrorMessage maps permission and SDK errors to friendly text", () => {
  assert.match(pushErrorMessage({ code: "messaging/permission-blocked" }), /blocked/);
  assert.match(pushErrorMessage({ code: "messaging/unsupported-browser" }), /does not support/);
  assert.match(pushErrorMessage(new Error("boom")), /try again/);
});

test("admin authorization requires a valid, unexpired token for the admin email", () => {
  const good = jwt.sign({ email: ENV.ADMIN_EMAIL }, ENV.JWT_SECRET, { expiresIn: "1h" });
  assert.deepEqual(verifyAdminAuthorization(`Bearer ${good}`, ENV), { ok: true, email: ENV.ADMIN_EMAIL });

  assert.equal(verifyAdminAuthorization(null, ENV).ok, false);
  assert.equal(verifyAdminAuthorization(good, ENV).ok, false); // missing "Bearer"
  const otherUser = jwt.sign({ email: "someone@example.com" }, ENV.JWT_SECRET);
  assert.equal(verifyAdminAuthorization(`Bearer ${otherUser}`, ENV).ok, false);
  const wrongSecret = jwt.sign({ email: ENV.ADMIN_EMAIL }, "other-secret");
  assert.equal(verifyAdminAuthorization(`Bearer ${wrongSecret}`, ENV).ok, false);
  const expired = jwt.sign({ email: ENV.ADMIN_EMAIL, exp: Math.floor(Date.now() / 1000) - 60 }, ENV.JWT_SECRET);
  assert.equal(verifyAdminAuthorization(`Bearer ${expired}`, ENV).ok, false);
  const unsigned = jwt.sign({ email: ENV.ADMIN_EMAIL }, "", { algorithm: "none" } as jwt.SignOptions);
  assert.equal(verifyAdminAuthorization(`Bearer ${unsigned}`, ENV).ok, false);

  const misconfigured = verifyAdminAuthorization(`Bearer ${good}`, { JWT_SECRET: ENV.JWT_SECRET });
  assert.deepEqual(misconfigured.ok ? null : misconfigured.status, 500);
});

test("rate limiter allows `limit` hits per window per key", () => {
  const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(allow("ip", 0), true);
  assert.equal(allow("ip", 10), true);
  assert.equal(allow("ip", 20), false);
  assert.equal(allow("other", 20), true);
  assert.equal(allow("ip", 1000), true);
});

test("customPushDestinationUrl allows any page on this site and nothing else", () => {
  assert.equal(customPushDestinationUrl(""), "https://www.sarkariresultsnow.com/");
  assert.equal(customPushDestinationUrl("/jobs"), "https://www.sarkariresultsnow.com/jobs");
  assert.equal(customPushDestinationUrl("/test-series/ssc?x=1"), "https://www.sarkariresultsnow.com/test-series/ssc?x=1");
  assert.equal(customPushDestinationUrl("https://www.sarkariresultsnow.com/results/abc"), "https://www.sarkariresultsnow.com/results/abc");
  assert.equal(customPushDestinationUrl("https://sarkariresultsnow.com/jobs"), "https://www.sarkariresultsnow.com/jobs");
  assert.equal(customPushDestinationUrl("http://www.sarkariresultsnow.com/jobs"), null);
  assert.equal(customPushDestinationUrl("https://evil.com/jobs"), null);
  assert.equal(customPushDestinationUrl("https://www.sarkariresultsnow.com.evil.com/"), null);
  assert.equal(customPushDestinationUrl("//evil.com"), null);
  assert.equal(customPushDestinationUrl("/\\evil.com"), null);
  assert.equal(customPushDestinationUrl("javascript:alert(1)"), null);
  assert.equal(customPushDestinationUrl("/admin"), null);
  assert.equal(customPushDestinationUrl("/api/push/subscribe"), null);
});

test("parseCustomPushInput requires title and message and sanitizes them", () => {
  const ok = parseCustomPushInput({ title: " <b>SSC CGL</b> out ", body: "Apply now", url: "/jobs" });
  assert.deepEqual(ok, { ok: true, value: { title: "SSC CGL out", body: "Apply now", url: "https://www.sarkariresultsnow.com/jobs" } });
  assert.equal(parseCustomPushInput({ title: "Hi", body: "There" }).ok, true);
  assert.equal(parseCustomPushInput({ title: "", body: "x" }).ok, false);
  assert.equal(parseCustomPushInput({ title: "x", body: "<p></p>" }).ok, false);
  assert.equal(parseCustomPushInput({ title: "x", body: "y", url: "https://evil.com" }).ok, false);
  assert.equal(parseCustomPushInput({ title: "x", body: "y", url: 5 }).ok, false);
  assert.equal(parseCustomPushInput(null).ok, false);
});
