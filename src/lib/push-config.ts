// Public Firebase web config (safe to ship to browsers). Kept separate from push-client.ts so checking
// whether push is configured does not pull the Firebase SDK into every page bundle.

export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/** Names of public Firebase variables that were empty when this bundle was built (they are inlined at build time). */
export function missingPushPublicEnv(): string[] {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseWebConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseWebConfig.projectId,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseWebConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseWebConfig.appId,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: firebaseVapidKey,
  };
  return Object.entries(env)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export function isPushConfigured(): boolean {
  return missingPushPublicEnv().length === 0;
}

export function isPushSupportedBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}
