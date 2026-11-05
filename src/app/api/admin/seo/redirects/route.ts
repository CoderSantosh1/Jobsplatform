import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { configRedirectList } from "@/lib/admin-redirects";
import { auditSnapshot } from "@/lib/admin-seo-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live redirects (next.config.js) and the redirect suggestions from the test-series audit. Admin only, read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const suggestions = auditSnapshot()
    .rows.filter((r) => r.action === "CONSOLIDATE")
    .map((r) => ({ from: r.path, to: r.reason.match(/as (\/test-series\/[a-z0-9/-]+)/)?.[1] ?? "", reason: r.reason }));
  return NextResponse.json({ success: true, data: { live: await configRedirectList(), suggestions } });
}
