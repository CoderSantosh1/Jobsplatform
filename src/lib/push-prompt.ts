// Decides when the "Get exam alerts" prompt may appear. Pure functions, so unit tests can load this file directly.

export const PUSH_DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const PUSH_DISMISSED_KEY = "srn-push-dismissed-at";
export const PUSH_SYNCED_KEY = "srn-push-synced-at";
export const PUSH_FID_KEY = "srn-push-fid";
export const PUSH_RESYNC_MS = 24 * 60 * 60 * 1000;

export type PushPermission = "default" | "granted" | "denied";

export function shouldShowPushPrompt(opts: {
  supported: boolean;
  configured: boolean;
  permission: PushPermission;
  dismissedAt: number | null;
  now: number;
  pathname: string;
}): boolean {
  if (!opts.supported || !opts.configured) return false;
  if (opts.pathname.startsWith("/admin")) return false;
  // Granted visitors are already subscribed; denied ones can only change it in browser settings.
  if (opts.permission !== "default") return false;
  if (opts.dismissedAt !== null && opts.now - opts.dismissedAt < PUSH_DISMISS_COOLDOWN_MS) return false;
  return true;
}

/** The FID is sent to the server when it changes, and otherwise at most once a day to keep lastSeenAt fresh. */
export function shouldSaveFid(fid: string, storedFid: string | null, syncedAt: number | null, now: number): boolean {
  return fid !== storedFid || syncedAt === null || now - syncedAt >= PUSH_RESYNC_MS;
}

export function parseStoredTime(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Friendly text for errors from Notification.requestPermission, the service worker or the FCM SDK. */
export function pushErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  switch (code) {
    case "messaging/permission-blocked":
    case "messaging/permission-default":
      return "Notifications are blocked. You can allow them from your browser's site settings.";
    case "messaging/unsupported-browser":
      return "This browser does not support exam alerts.";
    case "messaging/failed-service-worker-registration":
      return "Could not start alerts in this browser. Please try again later.";
    case "messaging/token-subscribe-failed":
    case "messaging/registration-failed":
      return "Could not subscribe right now. Please check your connection and try again.";
    default:
      return "Something went wrong while enabling alerts. Please try again later.";
  }
}
