// TEMPORARY (added 28 Nov 2026): the News section was removed from the site and the admin. This admin-only endpoint
// counts and then permanently deletes the leftover News records, as the site owner asked. Delete this file and
// src/lib/models/News.ts once the records are gone (and drop "news" from COLLECTIONS in api/admin/settings).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import News from "@/lib/models/News";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The phrase the DELETE body must contain, so the deletion can never run by accident. */
const CONFIRM_PHRASE = "DELETE ALL NEWS";

/** How many News records are left (published and draft). Admin only, read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await connectToDatabase();
    const [total, published, draft] = await Promise.all([
      News.countDocuments({}),
      News.countDocuments({ status: "published" }),
      News.countDocuments({ status: "draft" }),
    ]);
    return NextResponse.json({ success: true, data: { total, published, draft } });
  } catch (error) {
    console.error("admin news count failed", error);
    return NextResponse.json({ success: false, error: "Could not count news records." }, { status: 500 });
  }
}

/** Permanently delete every News record. Admin only; body must be `{ "confirm": "DELETE ALL NEWS" }`. */
export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json({ success: false, error: `Send { "confirm": "${CONFIRM_PHRASE}" } to delete.` }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const result = await News.deleteMany({});
    return NextResponse.json({ success: true, data: { deleted: result.deletedCount } });
  } catch (error) {
    console.error("admin news delete failed", error);
    return NextResponse.json({ success: false, error: "Could not delete news records." }, { status: 500 });
  }
}
