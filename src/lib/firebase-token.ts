// Verifies Firebase ID tokens the way Firebase documents for third-party JWT libraries.
// Used instead of firebase-admin/auth, whose dependency (jose) cannot be loaded on every Node version and took down
// the routes importing it. Certificate lookup is passed in, so unit tests can load this file directly.
import jwt from "jsonwebtoken";

export type FirebaseTokenClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  firebase?: { sign_in_provider?: string };
};

const CLOCK_TOLERANCE_SECONDS = 5;

/**
 * The claims of a valid token, or null if the token is malformed, expired, for another project or badly signed.
 * Throws only if the certificates cannot be fetched, so an outage is not mistaken for a bad login.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  getCertificate: (kid: string) => Promise<string | null>,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<FirebaseTokenClaims | null> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === "string") return null;
  const { alg, kid } = decoded.header;
  if (alg !== "RS256" || typeof kid !== "string") return null;

  const certificate = await getCertificate(kid);
  if (!certificate) return null;

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, certificate, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      clockTimestamp: nowSeconds,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
  } catch {
    return null;
  }
  if (typeof payload === "string") return null;

  const { sub, auth_time: authTime, email, email_verified: emailVerified, name, firebase } = payload;
  if (typeof sub !== "string" || sub.length === 0 || sub.length > 128) return null;
  if (typeof authTime !== "number" || authTime > nowSeconds + CLOCK_TOLERANCE_SECONDS) return null;

  return {
    uid: sub,
    email: typeof email === "string" ? email : undefined,
    email_verified: emailVerified === true,
    name: typeof name === "string" ? name : undefined,
    firebase: firebase && typeof firebase === "object" ? firebase : undefined,
  };
}

/** Seconds a certificate response may be cached, from its Cache-Control header. */
export function certificateMaxAgeSeconds(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\d+)/);
  return match ? Number(match[1]) : 0;
}
