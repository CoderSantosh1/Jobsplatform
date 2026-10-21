// Web push helpers shared by the admin UI and the API routes.
// Pure functions only (no database or Firebase imports), so unit tests can load this file directly.
import { detailPath, quizPath } from "./slug.ts";

export const PUSH_SITE_URL = "https://www.sarkariresultsnow.com";
export const PUSH_TITLE_MAX = 80;
export const PUSH_BODY_MAX = 200;

export const PUSH_CONTENT_TYPES = [
  "jobs",
  "results",
  "admit-cards",
  "answer-keys",
  "admissions",
  "news",
  "quizzes",
] as const;

export type PushContentType = (typeof PUSH_CONTENT_TYPES)[number];

const DEFAULTS: Record<PushContentType, { label: string; body: string }> = {
  jobs: {
    label: "New Job",
    body: "A new recruitment update is available. Check eligibility, dates, and application details.",
  },
  results: {
    label: "Result Declared",
    body: "A new exam result update is available. Open the result notice for details.",
  },
  "admit-cards": {
    label: "Admit Card",
    body: "Admit card information has been updated. Check the official notice and download instructions.",
  },
  "answer-keys": {
    label: "Answer Key",
    body: "A new answer key is available. Check the official notice for details.",
  },
  admissions: {
    label: "Admission",
    body: "A new admission notice is available. Check eligibility and important dates.",
  },
  news: {
    label: "Exam Update",
    body: "A new exam update is available. Open the notice for details.",
  },
  quizzes: {
    label: "Free Test Series",
    body: "A new free test series is available. Start practising on SarkariResultsNow.",
  },
};

export function isPushContentType(value: unknown): value is PushContentType {
  return typeof value === "string" && (PUSH_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

// Control characters, zero-width characters and bidi overrides (built from code points so the source contains no invisible characters).
const STRIP_CHARS = new RegExp(
  `[${[
    [0x00, 0x1f],
    [0x7f, 0x9f],
    [0x200b, 0x200f],
    [0x2028, 0x202e],
  ]
    .map(([from, to]) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`)
    .join("")}]`,
  "g",
);

/** Plain text for a notification: no HTML, no control characters, single spaces, at most `max` characters. */
export function sanitizePushText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(STRIP_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  const chars = Array.from(text);
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : text;
}

/** Default title and body for a content item, following the examples in the push brief. */
export function defaultPushMessage(type: PushContentType, itemTitle: string): { title: string; body: string } {
  const { label, body } = DEFAULTS[type];
  const cleanTitle = sanitizePushText(itemTitle, PUSH_TITLE_MAX);
  return {
    title: sanitizePushText(cleanTitle ? `${label}: ${cleanTitle}` : label, PUSH_TITLE_MAX),
    body,
  };
}

/** Site-relative page for a content item, e.g. /jobs/uco-bank-apprentice-2026-<id>. */
export function pushContentPath(type: PushContentType, doc: { _id: unknown; title?: string }): string {
  return type === "quizzes" ? quizPath(doc) : detailPath(type, doc);
}

/**
 * Absolute HTTPS URL on this site for a notification click, or null if `path` is not one of our content pages.
 * Rejects protocol-relative ("//evil.com"), absolute and backslash paths so a notification can never open another site.
 */
export function pushDestinationUrl(path: string, siteUrl = PUSH_SITE_URL): string | null {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  const prefix = path.split("/")[1];
  if (!isPushContentType(prefix)) return null;
  let url: URL;
  try {
    url = new URL(path, siteUrl);
  } catch {
    return null;
  }
  const site = new URL(siteUrl);
  if (url.origin !== site.origin || url.protocol !== "https:") return null;
  return url.toString();
}

export type PushSendInput = {
  type: PushContentType;
  id: string;
  title?: string;
  body?: string;
  resend: boolean;
};

/** Validates the admin send/preview request body. Title and body are optional overrides of the defaults. */
export function parsePushSendInput(raw: unknown): { ok: true; value: PushSendInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request body" };
  const input = raw as Record<string, unknown>;
  if (!isPushContentType(input.type)) return { ok: false, error: "Unknown content type" };
  if (!isObjectId(input.id)) return { ok: false, error: "Invalid content id" };

  const value: PushSendInput = { type: input.type, id: input.id, resend: input.resend === true };
  for (const key of ["title", "body"] as const) {
    if (input[key] === undefined || input[key] === null || input[key] === "") continue;
    if (typeof input[key] !== "string") return { ok: false, error: `Notification ${key} must be text` };
    const clean = sanitizePushText(input[key], key === "title" ? PUSH_TITLE_MAX : PUSH_BODY_MAX);
    if (!clean) return { ok: false, error: `Notification ${key} is empty` };
    value[key] = clean;
  }
  return { ok: true, value };
}

/**
 * Destination for an admin-written message: any page on this site, given as a path ("/jobs") or a full
 * https://www.sarkariresultsnow.com/... URL. Empty means the homepage. Anything pointing elsewhere is null.
 */
export function customPushDestinationUrl(input: string, siteUrl = PUSH_SITE_URL): string | null {
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) return new URL("/", siteUrl).toString();
  if (value.includes("\\") || /\s/.test(value)) return null;

  const site = new URL(siteUrl);
  let url: URL;
  try {
    if (value.startsWith("/")) {
      if (value.startsWith("//")) return null;
      url = new URL(value, siteUrl);
    } else {
      url = new URL(value);
      // Accept the bare domain too; it redirects to www anyway.
      if (url.protocol === "https:" && url.hostname === site.hostname.replace(/^www\./, "")) url.hostname = site.hostname;
    }
  } catch {
    return null;
  }
  if (url.origin !== site.origin || url.protocol !== "https:" || url.username || url.password) return null;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return null;
  return url.toString();
}

export type CustomPushInput = { title: string; body: string; url: string };

/** Validates a message the admin wrote from scratch: title and body are required, the link must stay on this site. */
export function parseCustomPushInput(raw: unknown): { ok: true; value: CustomPushInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request body" };
  const input = raw as Record<string, unknown>;
  if (typeof input.title !== "string" || typeof input.body !== "string") {
    return { ok: false, error: "Title and message are required" };
  }
  const title = sanitizePushText(input.title, PUSH_TITLE_MAX);
  const body = sanitizePushText(input.body, PUSH_BODY_MAX);
  if (!title) return { ok: false, error: "Title is required" };
  if (!body) return { ok: false, error: "Message is required" };
  if (input.url !== undefined && input.url !== null && typeof input.url !== "string") {
    return { ok: false, error: "Link must be text" };
  }
  const url = customPushDestinationUrl((input.url as string | undefined) ?? "");
  if (!url) return { ok: false, error: "Link must be a page on sarkariresultsnow.com" };
  return { ok: true, value: { title, body, url } };
}

/** Firebase Installation IDs are short URL-safe strings; anything else is rejected before touching the database. */
export function isValidFid(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

/** FCM error codes meaning the installation will never receive messages again, so its row can be deleted. */
const STALE_ERROR_CODES = new Set([
  "messaging/installation-id-not-registered",
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export function isStaleSubscriptionError(code: string | undefined): boolean {
  return !!code && STALE_ERROR_CODES.has(code);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
