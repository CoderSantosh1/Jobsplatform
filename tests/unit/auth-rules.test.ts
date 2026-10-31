// Google / email login: validation, friendly errors and how the server reads tokens and names.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authErrorMessage,
  bearerToken,
  cleanDisplayName,
  isInAppBrowser,
  shouldFallBackToRedirect,
  validateEmail,
  validateNewPassword,
} from "../../src/lib/auth-rules.ts";

test("validateEmail accepts real addresses and explains bad ones", () => {
  assert.equal(validateEmail("student@example.com"), null);
  assert.equal(validateEmail("  student@example.co.in "), null);
  assert.match(validateEmail("") ?? "", /enter your email/);
  for (const bad of ["student", "student@", "@example.com", "a b@example.com", "a@b", `${"x".repeat(250)}@example.com`]) {
    assert.match(validateEmail(bad) ?? "", /valid email/, bad);
  }
});

test("validateNewPassword enforces a length range", () => {
  assert.equal(validateNewPassword("12345678"), null);
  assert.match(validateNewPassword("1234567") ?? "", /at least 8/);
  assert.match(validateNewPassword("x".repeat(129)) ?? "", /too long/);
});

test("wrong email and wrong password give the same message, so accounts cannot be discovered", () => {
  const messages = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].map((code) =>
    authErrorMessage({ code }),
  );
  assert.equal(new Set(messages).size, 1);
  assert.equal(messages[0], "Incorrect email or password.");
});

test("Firebase errors become readable messages and unknown ones stay generic", () => {
  assert.match(authErrorMessage({ code: "auth/email-already-in-use" }), /already exists/);
  assert.match(authErrorMessage({ code: "auth/popup-closed-by-user" }), /closed/);
  assert.match(authErrorMessage({ code: "auth/popup-blocked" }), /blocked/);
  assert.match(authErrorMessage({ code: "auth/configuration-not-found" }), /not enabled/);
  const generic = authErrorMessage({ code: "auth/secret-internal", message: "stack trace" });
  assert.equal(generic, "Something went wrong. Please try again.");
  assert.equal(authErrorMessage(new Error("boom")), generic);
});

test("only a blocked or unsupported popup falls back to redirect", () => {
  assert.equal(shouldFallBackToRedirect({ code: "auth/popup-blocked" }), true);
  assert.equal(shouldFallBackToRedirect({ code: "auth/operation-not-supported-in-this-environment" }), true);
  assert.equal(shouldFallBackToRedirect({ code: "auth/popup-closed-by-user" }), false);
  assert.equal(shouldFallBackToRedirect(null), false);
});

test("in-app browsers are detected, normal mobile browsers are not", () => {
  assert.equal(isInAppBrowser("Mozilla/5.0 (Linux; Android 13) Instagram 300.0"), true);
  assert.equal(isInAppBrowser("Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/400.0]"), true);
  assert.equal(isInAppBrowser("Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36"), true);
  assert.equal(isInAppBrowser("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"), false);
  assert.equal(isInAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17.0 Mobile/15E148 Safari/604.1"), false);
});

test("bearerToken reads only a well-formed header", () => {
  assert.equal(bearerToken("Bearer abc.def"), "abc.def");
  assert.equal(bearerToken("bearer abc"), "abc");
  assert.equal(bearerToken("abc"), null);
  assert.equal(bearerToken("Bearer a b"), null);
  assert.equal(bearerToken(null), null);
});

test("cleanDisplayName prefers the given name, then Google's, then the email", () => {
  assert.equal(cleanDisplayName(" Asha  Kumari ", "Google Name", "a@x.com"), "Asha Kumari");
  assert.equal(cleanDisplayName(undefined, "Google Name", "a@x.com"), "Google Name");
  assert.equal(cleanDisplayName("<b></b>", undefined, "asha.k@x.com"), "asha.k");
  assert.equal(cleanDisplayName(5, null, null), "Student");
  assert.equal(cleanDisplayName("<script>x</script>Asha", null, null), "x Asha");
  assert.equal(cleanDisplayName("y".repeat(99), null, null).length, 50);
});
