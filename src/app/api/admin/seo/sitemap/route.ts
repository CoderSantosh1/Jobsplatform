import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { sitemapInventory } from "@/lib/admin-seo-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The URLs in every child sitemap, built by the same code as /sitemap.xml. Admin only, read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, data: await sitemapInventory() });
  } catch (error) {
    console.error("admin sitemap inventory failed", error);
    return NextResponse.json({ success: false, error: "Could not build the sitemap list." }, { status: 500 });
  }
}
