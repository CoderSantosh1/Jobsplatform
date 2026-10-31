// Validation and messages for Google / email login. Pure functions, so unit tests can load this file directly.

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Please enter your email address.";
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Please enter a valid email address.";
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > 128) return "Password is too long.";
  return null;
}

const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  // Firebase reports all three as a wrong login; one message avoids revealing which emails have accounts.
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with this email already exists. Please log in instead.",
  "auth/weak-password": `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "Network problem. Please check your connection and try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished. Please try again.",
  "auth/cancelled-popup-request": "Google sign-in was closed before it finished. Please try again.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Please allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "This email already uses a different sign-in method. Please log in with email and password.",
  "auth/unauthorized-domain":
    "Google sign-in is not allowed on this website address yet. Please continue with email or try again later.",
  "auth/operation-not-allowed": "This login option is turned off right now. Please use another login option.",
  "auth/configuration-not-found": "This login option is turned off right now. Please use another login option.",
  "auth/invalid-api-key": "Login is not set up correctly on this website. Please try again later.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Login is not set up correctly on this website. Please try again later.",
  "auth/web-storage-unsupported": "Please enable cookies and site data in your browser, then try again.",
};

export const GOOGLE_REDIRECT_LOST_MESSAGE =
  "Google sign-in could not finish in this browser. Please allow popups and try again, or continue with email.";

export function authErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}

/** Firebase errors that mean the popup cannot work here, so a full-page redirect is tried instead. */
export function shouldFallBackToRedirect(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  return code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment";
}

/** Apps like Instagram or Facebook open links in a built-in browser, where Google refuses to sign in. */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|Twitter|; wv\)/i.test(userAgent);
}

/** Token from an "Authorization: Bearer <token>" header, or null. */
export function bearerToken(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/** Name to show for a new account: the one given, else Google's, else the part of the email before the @. */
export function cleanDisplayName(given: unknown, tokenName: unknown, email: unknown): string {
  for (const candidate of [given, tokenName]) {
    if (typeof candidate !== "string") continue;
    const name = candidate.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 50).trim();
    if (name.length >= 2) return name;
  }
  const local = typeof email === "string" ? email.split("@")[0].replace(/[^\p{L}\p{N}._-]/gu, "").slice(0, 50) : "";
  return local.length >= 2 ? local : "Student";
}
