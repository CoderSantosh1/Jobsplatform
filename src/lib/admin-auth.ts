// Server-side check for the admin JWT issued by /api/admin/login (stored by the dashboard as localStorage "adminToken").
import jwt from "jsonwebtoken";

export type AdminAuthResult = { ok: true; email: string } | { ok: false; status: 401 | 500; error: string };

export function verifyAdminAuthorization(
  header: string | null,
  env: { JWT_SECRET?: string; ADMIN_EMAIL?: string } = {
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  },
): AdminAuthResult {
  if (!env.JWT_SECRET || !env.ADMIN_EMAIL) {
    return { ok: false, status: 500, error: "Admin authentication is not configured" };
  }
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return { ok: false, status: 401, error: "Admin login required" };

  try {
    const payload = jwt.verify(match[1], env.JWT_SECRET, { algorithms: ["HS256"] });
    const email = typeof payload === "object" && payload ? (payload as { email?: unknown }).email : undefined;
    if (typeof email !== "string" || email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      return { ok: false, status: 401, error: "Admin login required" };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, status: 401, error: "Admin session expired. Please log in again." };
  }
}
