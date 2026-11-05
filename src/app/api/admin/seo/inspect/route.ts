import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { inspectPath } from "@/lib/admin-seo-server";
import { isSafePath } from "@/lib/admin-seo-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fetch one page of this site and report its status, canonical, robots, headings, JSON-LD and internal links.
 * Admin only and read-only. Only paths on this site can be inspected (no other hosts).
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const path = params.get("path") ?? "";
  const target = params.get("target") === "local" ? "local" : "live";
  if (!isSafePath(path)) {
    return NextResponse.json({ success: false, error: "Enter a path that starts with /, e.g. /jobs" }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, data: await inspectPath(path, target, request.url) });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "The page took too long to answer." : "Could not fetch the page.";
    console.error(`admin inspect ${path} failed`, error);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
