// Firebase Admin SDK for sending push notifications. Server only: never import this from a client component.
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

const APP_NAME = "srn-push";

/** Names (never values) of the server-only Firebase variables that are not set. */
export function missingFirebaseAdminEnv(): string[] {
  const env = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };
  return Object.entries(env)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
}

export function isFirebaseAdminConfigured(): boolean {
  return missingFirebaseAdminEnv().length === 0;
}

export function getAdminMessaging(): Messaging {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin is not configured (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
  }
  const app = getApps().some((a) => a.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(
        {
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Vercel stores the PEM on one line with literal "\n" sequences.
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          }),
        },
        APP_NAME,
      );
  return getMessaging(app);
}
