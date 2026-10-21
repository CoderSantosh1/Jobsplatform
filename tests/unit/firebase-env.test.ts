// Firebase server setup diagnostics shown in the admin push dialog: names and hints only, never values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { firebaseAdminEnvProblems, pushErrorDetail } from "../../src/lib/firebase-admin.ts";

const KEY_BODY = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASC";
const GOOD = {
  FIREBASE_PROJECT_ID: "demo-project",
  FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-x@demo-project.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----\\n${KEY_BODY}\\n-----END PRIVATE KEY-----\\n`,
};

test("a complete setup has no problems (escaped \\n, real newlines or surrounding quotes)", () => {
  assert.deepEqual(firebaseAdminEnvProblems(GOOD), []);
  const realNewlines = GOOD.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  assert.deepEqual(firebaseAdminEnvProblems({ ...GOOD, FIREBASE_PRIVATE_KEY: realNewlines }), []);
  assert.deepEqual(firebaseAdminEnvProblems({ ...GOOD, FIREBASE_PRIVATE_KEY: `"${GOOD.FIREBASE_PRIVATE_KEY}"` }), []);
});

test("missing variables are named", () => {
  assert.deepEqual(firebaseAdminEnvProblems({}), [
    "FIREBASE_PROJECT_ID is missing",
    "FIREBASE_CLIENT_EMAIL is missing",
    "FIREBASE_PRIVATE_KEY is missing",
  ]);
  assert.deepEqual(firebaseAdminEnvProblems({ ...GOOD, FIREBASE_PRIVATE_KEY: "  " }), ["FIREBASE_PRIVATE_KEY is missing"]);
});

test("malformed values are reported without echoing them", () => {
  const truncated = { ...GOOD, FIREBASE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----\\n${KEY_BODY}` };
  const problems = firebaseAdminEnvProblems(truncated);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^FIREBASE_PRIVATE_KEY is not a complete PEM key/);
  assert.ok(!problems.join(" ").includes(KEY_BODY));

  assert.match(firebaseAdminEnvProblems({ ...GOOD, FIREBASE_CLIENT_EMAIL: "someone@gmail.com" })[0], /not a service account email/);
  assert.match(
    firebaseAdminEnvProblems({ ...GOOD, FIREBASE_PROJECT_ID: "other-project" })[0],
    /different project than FIREBASE_PROJECT_ID/
  );
});

test("pushErrorDetail includes the Firebase error code and caps the length", () => {
  const err = Object.assign(new Error("Failed to parse private key"), { code: "app/invalid-credential" });
  assert.equal(pushErrorDetail(err), "app/invalid-credential: Failed to parse private key");
  assert.equal(pushErrorDetail(new Error("x".repeat(500))).length, 300);
  assert.equal(pushErrorDetail("boom"), "boom");
});
