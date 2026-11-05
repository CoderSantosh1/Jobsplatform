import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyAdminAuthorization } from "@/lib/admin-auth";
import SeoReview from "@/lib/models/SeoReview";
import { isSafePath, redirectProblems } from "@/lib/admin-seo-checks";
import { configRedirects } from "@/lib/admin-redirects";
import { inspectPath } from "@/lib/admin-seo-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["noindex", "redirect", "canonical"] as const;
const DECISIONS = ["pending", "approved", "rejected"] as const;
type Kind = (typeof KINDS)[number];

function auth(request: Request) {
  const result = verifyAdminAuthorization(request.headers.get("authorization"));
  if (result.ok) return { email: result.email, denied: null };
  return { email: "", denied: NextResponse.json({ success: false, error: result.error }, { status: result.status }) };
}

/** Saved SEO review decisions. Admin only. Decisions are records: they do not change the public site. */
export async function GET(request: Request) {
  const { denied } = auth(request);
  if (denied) return denied;
  const kind = new URL(request.url).searchParams.get("kind");
  try {
    await connectToDatabase();
    const filter = KINDS.includes(kind as Kind) ? { kind } : {};
    const rows = await SeoReview.find(filter).sort({ updatedAt: -1 }).limit(2000).lean();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("admin seo reviews GET failed", error);
    return NextResponse.json({ success: false, error: "Could not load review decisions." }, { status: 500 });
  }
}

/** Record (or change) a decision for one URL. Only stores the decision; nothing is applied to the site. */
export async function POST(request: Request) {
  const { email, denied } = auth(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = body.kind as Kind;
  const decision = body.decision as (typeof DECISIONS)[number];
  const path = typeof body.path === "string" ? body.path.trim() : "";
  const target = typeof body.target === "string" ? body.target.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";

  if (!KINDS.includes(kind)) return NextResponse.json({ success: false, error: "Unknown review type." }, { status: 400 });
  if (!DECISIONS.includes(decision)) return NextResponse.json({ success: false, error: "Unknown decision." }, { status: 400 });
  if (!isSafePath(path)) return NextResponse.json({ success: false, error: "Path must start with /" }, { status: 400 });

  try {
    await connectToDatabase();
    if (kind === "redirect" && decision === "approved") {
      const approved = (await SeoReview.find({ kind: "redirect", decision: "approved" }).select("path target").lean()) as unknown as {
        path: string;
        target: string;
      }[];
      const existing = [...(await configRedirects()), ...approved.map((r) => ({ from: r.path, to: r.target }))];
      const problems = redirectProblems({ from: path, to: target }, existing);
      if (problems.length) return NextResponse.json({ success: false, error: problems.join(". ") }, { status: 400 });
      // The destination must be a working page today, so the redirect never lands on a 404.
      const page = await inspectPath(target, "live", request.url).catch(() => null);
      if (!page || page.status !== 200) {
        return NextResponse.json(
          { success: false, error: `${target} does not return 200 on the live site (got ${page?.status ?? "no answer"}).` },
          { status: 400 },
        );
      }
    }
    if (kind === "canonical" && target && !isSafePath(target)) {
      return NextResponse.json({ success: false, error: "Canonical target must start with /" }, { status: 400 });
    }
    const row = await SeoReview.findOneAndUpdate(
      { kind, path },
      { $set: { decision, target, note, decidedBy: email } },
      { upsert: true, new: true, runValidators: true },
    ).lean();
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error("admin seo reviews POST failed", error);
    return NextResponse.json({ success: false, error: "Could not save the decision." }, { status: 500 });
  }
}
