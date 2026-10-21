// Route-handler guard for admin-only write endpoints. Returns a JSON error Response when the request
// lacks a valid admin JWT (see admin-auth.ts), or null when the handler may proceed.
import { verifyAdminAuthorization } from "./admin-auth.ts";

type AdminEnv = Parameters<typeof verifyAdminAuthorization>[1];

export function requireAdmin(request: Request, env?: AdminEnv): Response | null {
  const auth = verifyAdminAuthorization(request.headers.get("authorization"), env);
  if (auth.ok) return null;
  return Response.json({ success: false, error: auth.error }, { status: auth.status });
}
