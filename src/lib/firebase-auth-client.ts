// Browser-only Firebase Authentication. Load with `await import(...)` so pages do not carry the SDK until needed.
// Same Firebase project as push notifications, but its own named app: auth needs authDomain, and adding that to the
// shared config would change the notification service worker's URL. Passwords and tokens are handled only by Firebase.
import { getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { shouldFallBackToRedirect } from "./auth-rules";
import type { StoredUser } from "./auth-session";
import { firebaseWebConfig } from "./push-config";

const APP_NAME = "srn-auth";
const REDIRECT_FLAG = "srn-google-redirect";

let authInstance: Auth | null = null;

function auth(): Auth {
  if (authInstance) return authInstance;
  const app =
    getApps().find((a) => a.name === APP_NAME) ??
    initializeApp(
      {
        ...firebaseWebConfig,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${firebaseWebConfig.projectId}.firebaseapp.com`,
      },
      APP_NAME,
    );
  authInstance = getAuth(app);
  // Local testing only; never active in a production build.
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (emulator && process.env.NODE_ENV !== "production") {
    connectAuthEmulator(authInstance, emulator, { disableWarnings: true });
  }
  return authInstance;
}

/** Creates or updates the site's profile for this Firebase user and remembers it on this device. */
async function syncProfile(firebaseUser: User, name?: string): Promise<StoredUser> {
  const token = await firebaseUser.getIdToken();
  const res = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.user) throw new Error(data?.error || "Could not finish signing in.");
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

/** Popup first; a full-page redirect only if popups cannot work. Returns null when the page is redirecting away. */
export async function signInWithGoogle(): Promise<StoredUser | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth(), provider);
    return await syncProfile(result.user);
  } catch (error) {
    if (!shouldFallBackToRedirect(error)) throw error;
    sessionStorage.setItem(REDIRECT_FLAG, "1");
    await signInWithRedirect(auth(), provider);
    return null;
  }
}

let redirectCompletion: Promise<StoredUser | null> | null = null;

/**
 * Finishes a Google redirect after the page reloads. The result can only be read once, so every caller shares it.
 * Null means the browser lost the sign-in on the way back (some block the storage this needs).
 */
export function completeGoogleRedirect(): Promise<StoredUser | null> {
  redirectCompletion ??= (async () => {
    try {
      const a = auth();
      const result = await getRedirectResult(a);
      await a.authStateReady();
      const user = result?.user ?? a.currentUser;
      return user ? await syncProfile(user) : null;
    } finally {
      sessionStorage.removeItem(REDIRECT_FLAG);
    }
  })();
  return redirectCompletion;
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<StoredUser> {
  const { user } = await createUserWithEmailAndPassword(auth(), email.trim(), password);
  await updateProfile(user, { displayName: name.trim() }).catch(() => {});
  // A failed verification email must not undo a successful signup.
  await sendEmailVerification(user).catch((error) => console.error("Verification email failed:", error));
  return syncProfile(user, name);
}

export async function signInWithEmail(email: string, password: string): Promise<StoredUser> {
  const { user } = await signInWithEmailAndPassword(auth(), email.trim(), password);
  return syncProfile(user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth(), email.trim());
}

/** Current ID token, or null if there is no Firebase session on this device. Sent only in a request header. */
export async function currentIdToken(): Promise<string | null> {
  const a = auth();
  await a.authStateReady();
  return a.currentUser ? a.currentUser.getIdToken() : null;
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth());
}
