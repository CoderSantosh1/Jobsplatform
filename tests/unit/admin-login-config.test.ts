import { test } from "node:test";
import assert from "node:assert/strict";
import { getAdminLoginConfig, getMissingAdminLoginConfig } from "../../src/lib/admin-login-config.ts";

test("admin login configuration is read from the supplied runtime environment", () => {
  const env = { ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "password-value", JWT_SECRET: "secret-value" };
  assert.deepEqual(getAdminLoginConfig(env), env);
  assert.deepEqual(getMissingAdminLoginConfig(env), []);
});

test("missing admin login diagnostics report names and never credential values", () => {
  const config = { ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "", JWT_SECRET: undefined };
  const missing = getMissingAdminLoginConfig(config);
  assert.deepEqual(missing, ["ADMIN_PASSWORD", "JWT_SECRET"]);
  assert.equal(JSON.stringify(missing).includes("admin@example.com"), false);
  assert.equal(JSON.stringify(missing).includes("password"), false);
});
