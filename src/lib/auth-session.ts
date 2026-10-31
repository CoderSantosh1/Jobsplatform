// The logged-in visitor as the site sees it: a profile in localStorage["user"] (never a token or password).
// Firebase keeps its own session; its SDK is only loaded when it is actually needed.
import { firebaseWebConfig } from "./push-config";

export type StoredUser = {
  _id?: string;
  name?: string;
  mobile?: string;
  email?: string;
  firebaseUid?: string;
};

export function isFirebaseAuthConfigured(): boolean {
  return !!(firebaseWebConfig.apiKey && firebaseWebConfig.projectId && firebaseWebConfig.appId);
}

export function readStoredUser(): StoredUser | null {
  try {
    const data = localStorage.getItem("user");
    return data ? (JSON.parse(data) as StoredUser) : null;
  } catch {
    return null;
  }
}

/** Ends the session on this device, including the Firebase one for Google / email accounts. */
export async function logoutUser(): Promise<void> {
  const user = readStoredUser();
  try {
    localStorage.removeItem("user");
  } catch {
    // Storage blocked: nothing stored to remove.
  }
  if (!user?.firebaseUid) return;
  try {
    const { firebaseSignOut } = await import("./firebase-auth-client");
    await firebaseSignOut();
  } catch (error) {
    console.error("Could not end the Firebase session:", error);
  }
}

/**
 * How to identify this user when submitting a test: a verified Firebase token, or the mobile number for accounts
 * made with the older mobile login. Null when they need to log in again.
 */
export async function attemptIdentity(
  user: StoredUser | null,
): Promise<{ headers: Record<string, string>; body: { userId?: string } } | null> {
  if (user?.firebaseUid) {
    const { currentIdToken } = await import("./firebase-auth-client");
    const token = await currentIdToken();
    return token ? { headers: { Authorization: `Bearer ${token}` }, body: {} } : null;
  }
  return user?.mobile ? { headers: {}, body: { userId: user.mobile } } : null;
}
