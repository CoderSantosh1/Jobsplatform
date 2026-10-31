// Server-side check of Firebase ID tokens. Server only: never import this from a client component.
// Its own Admin app, separate from the one that sends notifications. Verifying a token needs only the project id.
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { connectToDatabase } from "@/lib/db";
import AuthUser from "@/lib/models/AuthUser";
import { bearerToken, cleanDisplayName } from "@/lib/auth-rules";

const APP_NAME = "srn-auth";

function adminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project id is not configured");
  const app = getApps().find((a) => a.name === APP_NAME) ?? initializeApp({ projectId }, APP_NAME);
  return getAuth(app);
}

/** The verified token from a request, or null if it is missing, invalid or expired. */
export async function verifyFirebaseRequest(authorization: string | null): Promise<DecodedIdToken | null> {
  const token = bearerToken(authorization);
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.startsWith("auth/")) return null;
    throw error;
  }
}

export type AuthUserRow = {
  _id: unknown;
  firebaseUid: string;
  name: string;
  email?: string;
  provider?: string;
  emailVerified?: boolean;
};

/** Finds or creates the profile for a verified token. The unique firebaseUid means one record per account. */
export async function upsertAuthUser(decoded: DecodedIdToken, givenName?: unknown): Promise<AuthUserRow> {
  await connectToDatabase();
  const update = {
    $set: {
      email: decoded.email,
      emailVerified: !!decoded.email_verified,
      provider: decoded.firebase?.sign_in_provider,
      lastLoginAt: new Date(),
    },
    $setOnInsert: {
      firebaseUid: decoded.uid,
      name: cleanDisplayName(givenName, decoded.name, decoded.email),
    },
  };
  try {
    return await AuthUser.findOneAndUpdate({ firebaseUid: decoded.uid }, update, { upsert: true, new: true }).lean<AuthUserRow>() as AuthUserRow;
  } catch (error) {
    // Two first logins at the same moment: the unique index lets one create the record; use that one.
    if ((error as { code?: number }).code === 11000) {
      const existing = await AuthUser.findOne({ firebaseUid: decoded.uid }).lean<AuthUserRow>();
      if (existing) return existing;
    }
    throw error;
  }
}
