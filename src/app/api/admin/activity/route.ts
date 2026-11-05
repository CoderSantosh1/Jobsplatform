import { NextResponse } from "next/server";
import mongoose, { type Model } from "mongoose";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import PushNotificationLog from "@/lib/models/PushNotificationLog";
import SeoReview from "@/lib/models/SeoReview";
import { SECTIONS } from "@/lib/admin-seo-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ActivityEvent = {
  at: string;
  type: "created" | "updated" | "push" | "seo-review";
  kind: string;
  title: string;
  detail: string;
  actor: string | null;
  link: string | null;
};

const LIMIT = 60;
const CONTENT: { kind: string; label: string; model: Model<any>; tab: string }[] = [
  ...SECTIONS.map((s) => ({ kind: s.section, label: s.label, model: s.model, tab: s.section })),
  { kind: "quizzes", label: "Mock Tests", model: Quiz, tab: "quizzes" },
];

/**
 * Admin activity built from existing records: posts created/updated (dates from the records themselves),
 * push notifications sent and SEO review decisions. Read-only. Content records do not store who edited them,
 * so those events have no actor.
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const p = new URL(request.url).searchParams;
  const before = p.get("before") ? new Date(p.get("before")!) : new Date(Date.now() + 60_000);
  if (Number.isNaN(before.getTime())) return NextResponse.json({ success: false, error: "Bad date" }, { status: 400 });
  const type = p.get("type") ?? "";
  const beforeId = mongoose.Types.ObjectId.createFromTime(Math.floor(before.getTime() / 1000));
  try {
    await connectToDatabase();
    const jobs: Promise<ActivityEvent[]>[] = [];
    const want = (t: string) => !type || type === t;

    for (const c of CONTENT) {
      if (want("created")) {
        jobs.push(
          c.model.find({ _id: { $lt: beforeId } }).sort({ _id: -1 }).limit(LIMIT).select("title status").lean().then((rows: any[]) =>
            rows.map((r) => ({
              at: (r._id as mongoose.Types.ObjectId).getTimestamp().toISOString(),
              type: "created" as const,
              kind: c.label,
              title: String(r.title ?? "(untitled)"),
              detail: r.status === "draft" ? "Created as draft" : "Created",
              actor: null,
              link: `/admin/content?tab=${c.tab}`,
            })),
          ),
        );
      }
      if (want("updated")) {
        jobs.push(
          c.model.find({ updatedAt: { $lt: before } }).sort({ updatedAt: -1 }).limit(LIMIT).select("title status updatedAt").lean().then((rows: any[]) =>
            rows
              // Skip the save that created the document (updatedAt within a minute of creation).
              .filter((r) => new Date(r.updatedAt).getTime() - (r._id as mongoose.Types.ObjectId).getTimestamp().getTime() > 60_000)
              .map((r) => ({
                at: new Date(r.updatedAt).toISOString(),
                type: "updated" as const,
                kind: c.label,
                title: String(r.title ?? "(untitled)"),
                detail: r.status ? `Updated (${r.status})` : "Updated",
                actor: null,
                link: `/admin/content?tab=${c.tab}`,
              })),
          ),
        );
      }
    }
    if (want("push")) {
      jobs.push(
        PushNotificationLog.find({ createdAt: { $lt: before } }).sort({ createdAt: -1 }).limit(LIMIT).lean().then((rows: any[]) =>
          rows.map((r) => ({
            at: new Date(r.createdAt).toISOString(),
            type: "push" as const,
            kind: "Push notification",
            title: String(r.title),
            detail: `${r.status}: ${r.successCount}/${r.subscriberCount} delivered${r.failureCount ? `, ${r.failureCount} failed` : ""}`,
            actor: r.sentBy ?? null,
            link: null,
          })),
        ),
      );
    }
    if (want("seo-review")) {
      jobs.push(
        SeoReview.find({ updatedAt: { $lt: before } }).sort({ updatedAt: -1 }).limit(LIMIT).lean().then((rows: any[]) =>
          rows.map((r) => ({
            at: new Date(r.updatedAt).toISOString(),
            type: "seo-review" as const,
            kind: `SEO ${r.kind}`,
            title: String(r.path),
            detail: `Marked ${r.decision}${r.target ? ` → ${r.target}` : ""}${r.note ? ` (${r.note})` : ""}`,
            actor: r.decidedBy || null,
            link: r.kind === "redirect" ? "/admin/seo/redirects" : r.kind === "canonical" ? "/admin/seo/canonical" : "/admin/seo/noindex",
          })),
        ),
      );
    }

    const events = (await Promise.all(jobs)).flat().sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    const page = events.slice(0, LIMIT);
    return NextResponse.json({
      success: true,
      data: { events: page, next: events.length > LIMIT ? page[page.length - 1].at : null },
    });
  } catch (error) {
    console.error("admin activity failed", error);
    return NextResponse.json({ success: false, error: "Could not load activity." }, { status: 500 });
  }
}
