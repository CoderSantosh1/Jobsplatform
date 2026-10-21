// Admin write-endpoint protection: server guard (requireAdmin) and the dashboard's auth header helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../../src/lib/admin-guard.ts";
import { ADMIN_LOGIN_PATH, ADMIN_TOKEN_KEY, adminFetch, withAdminAuth } from "../../src/lib/admin-fetch.ts";

const ENV = { JWT_SECRET: "test-secret", ADMIN_EMAIL: "admin@example.com" };

function request(authorization?: string) {
  return new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

test("requireAdmin lets a valid admin token through", () => {
  const token = jwt.sign({ email: ENV.ADMIN_EMAIL }, ENV.JWT_SECRET, { expiresIn: "1h" });
  assert.equal(requireAdmin(request(`Bearer ${token}`), ENV), null);
});

test("requireAdmin rejects a missing Authorization header with 401", async () => {
  const res = requireAdmin(request(), ENV);
  assert.ok(res);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { success: false, error: "Admin login required" });
});

test("requireAdmin rejects forged, expired and non-admin tokens with 401", async () => {
  const forged = jwt.sign({ email: ENV.ADMIN_EMAIL }, "wrong-secret");
  const expired = jwt.sign({ email: ENV.ADMIN_EMAIL, exp: Math.floor(Date.now() / 1000) - 60 }, ENV.JWT_SECRET);
  const otherUser = jwt.sign({ email: "someone@example.com" }, ENV.JWT_SECRET);
  for (const token of [forged, expired, otherUser, "not-a-jwt"]) {
    const res = requireAdmin(request(`Bearer ${token}`), ENV);
    assert.ok(res, token);
    assert.equal(res.status, 401);
    assert.equal((await res.json()).success, false);
  }
});

test("requireAdmin fails closed with 500 when admin auth is not configured", () => {
  const token = jwt.sign({ email: ENV.ADMIN_EMAIL }, ENV.JWT_SECRET);
  const res = requireAdmin(request(`Bearer ${token}`), { ADMIN_EMAIL: ENV.ADMIN_EMAIL });
  assert.ok(res);
  assert.equal(res.status, 500);
});

test("withAdminAuth adds the Bearer token and keeps existing headers and options", () => {
  const init = withAdminAuth({ method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }, "abc");
  const headers = new Headers(init.headers);
  assert.equal(init.method, "PUT");
  assert.equal(init.body, "{}");
  assert.equal(headers.get("authorization"), "Bearer abc");
  assert.equal(headers.get("content-type"), "application/json");
});

test("withAdminAuth leaves the headers alone without a token and does not force a Content-Type", () => {
  const headers = new Headers(withAdminAuth({ body: new FormData() }, null).headers);
  assert.equal(headers.get("authorization"), null);
  assert.equal(headers.get("content-type"), null);
});

test("adminFetch sends the stored token and sends the admin to the login page on a 401", async (t) => {
  const store = new Map([[ADMIN_TOKEN_KEY, "stored-token"]]);
  const alerts: string[] = [];
  const calls: { input: unknown; init: RequestInit }[] = [];
  let status = 200;
  const g = globalThis as Record<string, unknown>;
  const saved = { fetch: g.fetch, localStorage: g.localStorage, window: g.window };
  t.after(() => Object.assign(g, saved));
  Object.assign(g, {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      removeItem: (k: string) => void store.delete(k),
    },
    window: { alert: (m: string) => alerts.push(m), location: { href: "/admin" } },
    fetch: async (input: unknown, init: RequestInit) => {
      calls.push({ input, init });
      return new Response("{}", { status });
    },
  });

  const ok = await adminFetch("/api/jobs/1", { method: "DELETE" });
  assert.equal(ok.status, 200);
  assert.equal(new Headers(calls[0].init.headers).get("authorization"), "Bearer stored-token");
  assert.equal(alerts.length, 0);

  status = 401;
  const denied = await adminFetch("/api/jobs/1", { method: "DELETE" });
  assert.equal(denied.status, 401);
  assert.equal(alerts.length, 1);
  assert.equal(store.has(ADMIN_TOKEN_KEY), false);
  assert.equal((g.window as { location: { href: string } }).location.href, ADMIN_LOGIN_PATH);

  // Several requests failing together only prompt once.
  await adminFetch("/api/jobs/2", { method: "DELETE" });
  assert.equal(alerts.length, 1);
});
