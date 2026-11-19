import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeMongoError } from "../../src/lib/mongo-error.ts";

test("Mongo errors retain nested connection diagnostics and redact credentials", () => {
  const serverError = Object.assign(
    new Error("connection timed out for mongodb+srv://atlas-user:s3cret@cluster.example/db"),
    { code: "ETIMEDOUT" },
  );
  const error = Object.assign(
    new Error("server selection failed for mongodb+srv://atlas-user:s3cret@cluster.example/db token=abc123"),
    {
      name: "MongoServerSelectionError",
      code: "SELECTION_TIMEOUT",
      cause: Object.assign(new Error("TLS connection reset"), { code: "ECONNRESET" }),
      reason: {
        type: "ReplicaSetNoPrimary",
        servers: new Map([
          ["node-a.example:27017", { type: "Unknown", error: serverError }],
        ]),
      },
    },
  );

  const serialized = JSON.stringify(serializeMongoError(error));

  assert.match(serialized, /MongoServerSelectionError/);
  assert.match(serialized, /SELECTION_TIMEOUT/);
  assert.match(serialized, /TLS connection reset/);
  assert.match(serialized, /ReplicaSetNoPrimary/);
  assert.match(serialized, /node-a\.example:27017/);
  assert.match(serialized, /ETIMEDOUT/);
  assert.match(serialized, /stack/);
  assert.match(serialized, /redacted MongoDB URI/);
  assert.match(serialized, /token=\[redacted\]/);
  assert.doesNotMatch(serialized, /atlas-user|s3cret|abc123/);
});

test("Mongo error serializer handles circular and non-Error values", () => {
  const error: Record<string, unknown> = { name: "DriverError", message: "lookup failed" };
  error.cause = error;

  const serialized = JSON.stringify(serializeMongoError(error));
  assert.match(serialized, /DriverError/);
  assert.match(serialized, /circular reference/);
});
