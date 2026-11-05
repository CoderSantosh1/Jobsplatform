import { NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/lib/models/admin";
import AuthUser from "@/lib/models/AuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who can use the admin panel, plus a count of site (student) accounts. Admin only and read-only.
 * Login checks ADMIN_EMAIL / ADMIN_PASSWORD, so that account is the one that can sign in;
 * records in the "admins" collection are listed for reference only. Passwords are never returned.
 */
export async function GET(request: Request) {
  const auth = verifyAdminAuthorization(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  try {
    await connectToDatabase();
    const [stored, siteUsers, recentUsers] = await Promise.all([
      Admin.find().select("email name role createdAt").lean(),
      AuthUser.estimatedDocumentCount(),
      AuthUser.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        loginAdmin: { email: process.env.ADMIN_EMAIL ?? "", source: "Environment (ADMIN_EMAIL)", you: true },
        currentEmail: auth.email,
        stored: (stored as unknown as { _id: unknown; email: string; name: string; role: string; createdAt?: Date }[]).map((a) => ({
          id: String(a._id),
          email: a.email,
          name: a.name,
          role: a.role,
          createdAt: a.createdAt ?? null,
          canLogIn: a.email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase(),
        })),
        siteUsers: { total: siteUsers, last30Days: recentUsers },
      },
    });
  } catch (error) {
    console.error("admin users failed", error);
    return NextResponse.json({ success: false, error: "Could not load admin users." }, { status: 500 });
  }
}
