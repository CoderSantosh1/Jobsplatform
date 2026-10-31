// Firebase ID token checks: only a token signed by Google's key, for this project, may identify a user.
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { certificateMaxAgeSeconds, verifyFirebaseIdToken } from "../../src/lib/firebase-token.ts";

const PROJECT = "demo-project";
const NOW = 1_800_000_000;
const pair = () =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
const google = pair();
const attacker = pair();
const certs = async (kid: string) => (kid === "key1" ? google.publicKey : null);

const claims = (over: Record<string, unknown> = {}) => ({
  iss: `https://securetoken.google.com/${PROJECT}`,
  aud: PROJECT,
  sub: "firebase-uid-1",
  auth_time: NOW - 100,
  iat: NOW - 100,
  exp: NOW + 3000,
  email: "a@example.com",
  email_verified: true,
  name: "Asha",
  firebase: { sign_in_provider: "google.com" },
  ...over,
});
const sign = (payload: object, key = google.privateKey, kid = "key1") =>
  jwt.sign(payload, key, { algorithm: "RS256", keyid: kid });
const verify = (token: string) => verifyFirebaseIdToken(token, PROJECT, certs, NOW);

test("a valid token gives the user's claims", async () => {
  assert.deepEqual(await verify(sign(claims())), {
    uid: "firebase-uid-1",
    email: "a@example.com",
    email_verified: true,
    name: "Asha",
    firebase: { sign_in_provider: "google.com" },
  });
});

test("forged tokens are rejected", async () => {
  assert.equal(await verify(sign(claims(), attacker.privateKey)), null, "signed with another key");
  assert.equal(await verify(sign(claims(), attacker.privateKey, "unknown")), null, "unknown key id");
  const unsigned = jwt.sign(claims(), "", { algorithm: "none", keyid: "key1" } as jwt.SignOptions);
  assert.equal(await verify(unsigned), null, "alg none");
  const hs = jwt.sign(claims(), google.publicKey.replace(/\s/g, ""), { algorithm: "HS256", keyid: "key1" });
  assert.equal(await verify(hs), null, "HS256 using the public key as a secret");
  assert.equal(await verify("garbage"), null);
  const parts = sign(claims()).split(".");
  const tampered = Buffer.from(JSON.stringify(claims({ sub: "someone-else" }))).toString("base64url");
  assert.equal(await verify(`${parts[0]}.${tampered}.${parts[2]}`), null, "changed claims");
});

test("tokens for another project, expired or with bad claims are rejected", async () => {
  assert.equal(await verify(sign(claims({ aud: "other" }))), null, "audience");
  assert.equal(await verify(sign(claims({ iss: "https://securetoken.google.com/other" }))), null, "issuer");
  assert.equal(await verify(sign(claims({ exp: NOW - 60 }))), null, "expired");
  assert.equal(await verify(sign(claims({ sub: "" }))), null, "empty subject");
  assert.equal(await verify(sign(claims({ sub: "x".repeat(129) }))), null, "long subject");
  assert.equal(await verify(sign(claims({ auth_time: NOW + 600 }))), null, "future auth_time");
  assert.equal(await verify(sign(claims({ auth_time: undefined }))), null, "no auth_time");
});

test("a certificate outage is an error, not a failed login", async () => {
  const down = async () => {
    throw new Error("network down");
  };
  await assert.rejects(verifyFirebaseIdToken(sign(claims()), PROJECT, down, NOW), /network down/);
});

test("certificate cache time comes from Cache-Control", () => {
  assert.equal(certificateMaxAgeSeconds("public, max-age=19302, must-revalidate"), 19302);
  assert.equal(certificateMaxAgeSeconds(null), 0);
});

test("routes do not load firebase-admin/auth, whose dependency crashes on some Node versions", () => {
  for (const file of ["src/lib/firebase-auth-server.ts", "src/lib/firebase-token.ts"]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /from ["']firebase-admin\/auth["']/, file);
  }
});
