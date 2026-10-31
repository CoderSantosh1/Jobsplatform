// Server-side check of Firebase ID tokens. Server only: never import this from a client component.
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import AuthUser from "@/lib/models/AuthUser";
import { bearerToken, cleanDisplayName } from "@/lib/auth-rules";
import { certificateMaxAgeSeconds, verifyFirebaseIdToken, type FirebaseTokenClaims } from "@/lib/firebase-token";

const CERTIFICATES_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certificates: Record<string, string> = {};
let certificatesExpireAt = 0;

/** Google's public signing certificates, cached for as long as Google allows. */
async function getCertificate(kid: string): Promise<string | null> {
  if (Date.now() >= certificatesExpireAt) {
    const res = await fetch(CERTIFICATES_URL);
    if (!res.ok) throw new Error(`Could not fetch Firebase certificates (${res.status})`);
    certificates = (await res.json()) as Record<string, string>;
    certificatesExpireAt = Date.now() + certificateMaxAgeSeconds(res.headers.get("cache-control")) * 1000;
  }
  return certificates[kid] ?? null;
}

/** The verified claims from a request, or null if the token is missing, invalid or expired. */
export async function verifyFirebaseRequest(authorization: string | null): Promise<FirebaseTokenClaims | null> {
  const token = bearerToken(authorization);
  if (!token) return null;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project id is not configured");
  // The local Auth Emulator issues unsigned tokens. Never accepted in a production build.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.NODE_ENV !== "production") {
    const claims = jwt.decode(token) as (FirebaseTokenClaims & { sub?: string }) | null;
    return claims?.sub ? { ...claims, uid: claims.sub } : null;
  }
  return verifyFirebaseIdToken(token, projectId, getCertificate);
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
export async function upsertAuthUser(decoded: FirebaseTokenClaims, givenName?: unknown): Promise<AuthUserRow> {
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
