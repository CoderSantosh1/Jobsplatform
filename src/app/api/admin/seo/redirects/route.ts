import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { configRedirectList } from "@/lib/admin-redirects";
import { auditSnapshot } from "@/lib/admin-seo-audit";
import { connectToDatabase } from "@/lib/db";
import SeoReview from "@/lib/models/SeoReview";
import { parsePostPath } from "@/lib/post-redirects";
import postAudit from "@/lib/admin-data/post-duplicate-audit.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Live = { source: string; destination: string; permanent?: boolean; conditional: boolean; origin: "code" | "admin" };

/**
 * Live redirects (next.config.js plus post redirects approved in the admin) and the redirect suggestions from the
 * audits. Admin only, read-only.
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const suggestions = [
    ...auditSnapshot()
      .rows.filter((r) => r.action === "CONSOLIDATE")
      .map((r) => ({
        from: r.path,
        to: r.reason.match(/as (\/test-series\/[a-z0-9/-]+)/)?.[1] ?? "",
        reason: r.reason,
        source: "Audit: consolidate",
      })),
    ...postAudit.suggestions.map((s) => ({ ...s, source: "Audit: duplicate post" })),
  ];

  const live: Live[] = (await configRedirectList()).map((r) => ({ ...r, origin: "code" as const }));
  try {
    await connectToDatabase();
    const approved = (await SeoReview.find({ kind: "redirect", decision: "approved" }).select("path target").lean()) as unknown as {
      path: string;
      target: string;
    }[];
    for (const r of approved) {
      if (parsePostPath(r.path)) live.push({ source: r.path, destination: r.target, permanent: true, conditional: false, origin: "admin" });
    }
  } catch (error) {
    console.error("admin seo redirects: approved list failed", error);
  }
  return NextResponse.json({ success: true, data: { live, suggestions } });
}
