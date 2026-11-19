type ErrorLike = Error & {
  code?: unknown;
  codeName?: unknown;
  cause?: unknown;
  reason?: unknown;
};

const MAX_DEPTH = 5;
const MAX_SERVERS = 12;
const MAX_TEXT_LENGTH = 6000;
const SAFE_ERROR_KEYS = [
  "name",
  "message",
  "stack",
  "code",
  "codeName",
  "type",
  "address",
  "hostname",
  "syscall",
  "errno",
  "setName",
  "cause",
  "reason",
  "error",
  "servers",
  "roundTripTime",
  "minWireVersion",
  "maxWireVersion",
] as const;

function redactText(value: string): string {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "[redacted MongoDB URI]")
    .replace(/\b(password|passwd|pwd|token|secret|api[_-]?key)\s*[=:]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1=[redacted]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .slice(0, MAX_TEXT_LENGTH);
}

function safeRead(value: object, key: string): unknown {
  try {
    return (value as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function serializeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (typeof value === "string") return redactText(value);
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return value === undefined ? undefined : String(value);
  if (depth >= MAX_DEPTH) return "[maximum error detail depth reached]";
  if (seen.has(value)) return "[circular reference]";
  seen.add(value);

  if (value instanceof Map) {
    return [...value.entries()].slice(0, MAX_SERVERS).map(([key, entry]) => ({
      address: redactText(String(key)),
      ...serializeObject(entry, seen, depth + 1),
    }));
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_SERVERS).map((entry) => serializeValue(entry, seen, depth + 1));
  }

  return serializeObject(value, seen, depth + 1);
}

function serializeObject(value: object, seen: WeakSet<object>, depth: number): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const key of SAFE_ERROR_KEYS) {
    const entry = safeRead(value, key);
    if (entry === undefined || typeof entry === "function") continue;
    const serialized = serializeValue(entry, seen, depth + 1);
    if (serialized !== undefined) output[key] = serialized;
  }
  return output;
}

/** Keep Mongo error internals useful in Workers logs without emitting credentials or full connection strings. */
export function serializeMongoError(error: unknown): unknown {
  if (error instanceof Error) {
    const source = error as ErrorLike;
    const serialized: Record<string, unknown> = {
      name: redactText(source.name),
      message: redactText(source.message),
    };
    if (source.stack) serialized.stack = redactText(source.stack);
    if (source.code !== undefined) serialized.code = serializeValue(source.code, new WeakSet(), 0);
    if (source.codeName !== undefined) serialized.codeName = redactText(String(source.codeName));
    if (source.cause !== undefined) serialized.cause = serializeValue(source.cause, new WeakSet([error]), 0);
    if (source.reason !== undefined) serialized.reason = serializeValue(source.reason, new WeakSet([error]), 0);
    return serialized;
  }
  return serializeValue(error, new WeakSet(), 0);
}

/** Cloudflare records a single console argument reliably; emit the exception fields as one JSON log line. */
export function logMongoError(
  event: string,
  error: unknown,
  context: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, typeof value === "string" ? redactText(value) : value]),
  );
  console.error(JSON.stringify({ event, ...safeContext, error: serializeMongoError(error) }));
}
