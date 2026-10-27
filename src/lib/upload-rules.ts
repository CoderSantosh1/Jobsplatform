// Validation for files and ids that visitors send. Pure functions, so unit tests can load this file directly.

export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type ImageKind = "jpg" | "png" | "webp";

/**
 * The real image type from the file's first bytes. The browser-supplied name and MIME type are not trusted:
 * an ".svg" or ".html" file renamed to ".png" would otherwise be served from our domain (stored XSS).
 */
export function sniffImageType(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** A MongoDB ObjectId in its 24-hex-character string form (also rules out "../" style path tricks). */
export function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

/** Indian 10-digit mobile number, the id test attempts are stored under. */
export function isMobileNumber(value: unknown): value is string {
  return typeof value === "string" && /^[6-9]\d{9}$/.test(value);
}

/** Answers sent with a test attempt: one entry per question, each an option index or -1 for "not answered". */
export function isValidAnswerList(value: unknown, questionCount: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= questionCount &&
    value.every((a) => Number.isInteger(a) && a >= -1 && a < 26)
  );
}
