import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { auditSnapshot } from "@/lib/admin-seo-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The test-series SEO audit snapshot. Admin only and read-only: recommendations are never applied from here. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ success: true, data: auditSnapshot() });
}
