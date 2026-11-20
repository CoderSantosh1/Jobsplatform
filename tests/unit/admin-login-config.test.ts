import { test } from "node:test";
import assert from "node:assert/strict";
import { getAdminLoginConfig, getMissingAdminLoginConfig, resolveAdminLoginConfig } from "../../src/lib/admin-login-config.ts";

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

test("Cloudflare Worker bindings take precedence over local process environment", () => {
  const workerEnv = { ADMIN_EMAIL: "worker@example.com", ADMIN_PASSWORD: "worker-password", JWT_SECRET: "worker-secret" };
  const processEnv = { ADMIN_EMAIL: "local@example.com", ADMIN_PASSWORD: "local-password", JWT_SECRET: "local-secret" };
  assert.deepEqual(resolveAdminLoginConfig(workerEnv, processEnv), workerEnv);
});

test("local process environment remains a fallback when a Worker binding is absent", () => {
  const processEnv = { ADMIN_EMAIL: "local@example.com", ADMIN_PASSWORD: "local-password", JWT_SECRET: "local-secret" };
  assert.deepEqual(resolveAdminLoginConfig({ ADMIN_EMAIL: "worker@example.com" }, processEnv), {
    ...processEnv,
    ADMIN_EMAIL: "worker@example.com",
  });
});
