// Client-side fetch wrapper for the admin dashboard: sends the admin JWT (localStorage "adminToken")
// as a Bearer token and sends the admin back to the login page when the API answers 401.
export const ADMIN_TOKEN_KEY = "adminToken";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_SESSION_EXPIRED_MESSAGE = "Your admin session has expired or is invalid. Please log in again.";

/** Returns a copy of `init` whose headers carry `Authorization: Bearer <token>` when a token is given. */
export function withAdminAuth(init: RequestInit = {}, token: string | null | undefined): RequestInit {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

function readToken(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

let redirectingToLogin = false;

function handleUnauthorized() {
  if (redirectingToLogin || typeof window === "undefined") return;
  redirectingToLogin = true;
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors; the redirect still happens
  }
  window.alert(ADMIN_SESSION_EXPIRED_MESSAGE);
  window.location.href = ADMIN_LOGIN_PATH;
}

/** fetch() for admin API calls. On a 401 it tells the admin to log in again and redirects to the login page. */
export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(input, withAdminAuth(init, readToken()));
  if (response.status === 401) handleUnauthorized();
  return response;
}
