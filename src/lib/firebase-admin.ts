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

/**
 * What is wrong with the server-only Firebase variables, shown to the admin. Names and format hints only,
 * never values. Empty when every variable is set and looks well-formed.
 */
export function firebaseAdminEnvProblems(env: Record<string, string | undefined> = process.env): string[] {
  const problems: string[] = [];
  for (const name of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
    if (!env[name]?.trim()) problems.push(`${name} is missing`);
  }
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const email = env.FIREBASE_CLIENT_EMAIL?.trim();
  if (email && !/^[^@\s"]+@[^@\s"]+\.iam\.gserviceaccount\.com$/.test(email)) {
    problems.push("FIREBASE_CLIENT_EMAIL is not a service account email (…@….iam.gserviceaccount.com)");
  } else if (email && projectId && !email.includes(`@${projectId}.iam.`)) {
    problems.push("FIREBASE_CLIENT_EMAIL belongs to a different project than FIREBASE_PROJECT_ID");
  }
  const key = env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  if (key && !/^"?-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n?"?$/.test(key)) {
    problems.push(
      "FIREBASE_PRIVATE_KEY is not a complete PEM key (it must run from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY----- with \\n line breaks)"
    );
  }
  return problems;
}

/** Firebase/Google error code and message for the admin (e.g. "app/invalid-credential: …"). Never includes env values. */
export function pushErrorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error).slice(0, 300);
  const code = (error as { code?: unknown }).code;
  return `${typeof code === "string" ? `${code}: ` : ""}${error.message}`.slice(0, 300);
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
