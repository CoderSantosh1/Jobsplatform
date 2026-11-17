import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import { SECTIONS, contentSeoAudit } from "@/lib/admin-seo-server";
import { proposeDistinctTitles, type TitleDedupeProposal } from "@/lib/seo-title-dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dry-run preview of posts with `same-search-title` and proposed unique titles. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const rows = await contentSeoAudit();
    const allMetaTitles = new Set(rows.map((r) => r.metaTitle));
    const groups = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!r.issues.includes("same-search-title")) continue;
      const key = `${r.section}:${r.metaTitle.toLowerCase()}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    const proposals: TitleDedupeProposal[] = [];
    for (const group of groups.values()) {
      // Oldest copy first so it keeps its original title.
      const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
      proposals.push(...proposeDistinctTitles(ordered, allMetaTitles));
    }
    return NextResponse.json({ success: true, data: { count: proposals.length, proposals } });
  } catch (error) {
    console.error("dedupe-titles preview failed", error);
    return NextResponse.json({ success: false, error: "Could not generate title preview." }, { status: 500 });
  }
}

/** Apply explicitly approved title updates (requires `{ confirm: true, updates: [...] }`). */
export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as {
    confirm?: boolean;
    updates?: { id: string; section: string; newTitle: string }[];
  };
  if (body.confirm !== true || !Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json(
      { success: false, error: "Explicit confirmation (confirm: true) and at least one update are required." },
      { status: 400 },
    );
  }
  try {
    await connectToDatabase();
    const modelMap = new Map(SECTIONS.map((s) => [s.section as string, s.model]));
    const updated: { id: string; section: string; title: string }[] = [];

    for (const item of body.updates) {
      const model = modelMap.get(item.section);
      const cleanTitle = typeof item.newTitle === "string" ? item.newTitle.replace(/\s+/g, " ").trim() : "";
      if (!model || !/^[a-f0-9]{24}$/i.test(item.id) || cleanTitle.length < 10) {
        return NextResponse.json({ success: false, error: `Invalid update payload for ${item.id}` }, { status: 400 });
      }
      const doc = await model.findByIdAndUpdate(item.id, { $set: { title: cleanTitle } }, { new: true }).select("_id title").lean();
      if (doc) updated.push({ id: String((doc as { _id: unknown })._id), section: item.section, title: cleanTitle });
    }
    return NextResponse.json({ success: true, data: { updatedCount: updated.length, updated } });
  } catch (error) {
    console.error("dedupe-titles apply failed", error);
    return NextResponse.json({ success: false, error: "Could not apply title updates." }, { status: 500 });
  }
}
