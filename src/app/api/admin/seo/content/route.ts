import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { contentSeoAudit } from "@/lib/admin-seo-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Title/description checks for every post, using the same builders as the public pages. Admin only, read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, data: await contentSeoAudit() });
  } catch (error) {
    console.error("admin content SEO audit failed", error);
    return NextResponse.json({ success: false, error: "Could not run the content SEO audit." }, { status: 500 });
  }
}
