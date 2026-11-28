import { NextResponse } from "next/server";
import mongoose, { type Model } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import Quiz from "@/lib/models/Quiz";
import { detailPath, quizPath, type Section } from "@/lib/slug";
import { getCategoryGroups } from "@/lib/quizzes";
import { auditSummary } from "@/lib/admin-seo-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Kind = Section | "quizzes";
const KINDS: { kind: Kind; label: string; model: Model<any>; adminTab: string }[] = [
  { kind: "jobs", label: "Job", model: Job, adminTab: "jobs" },
  { kind: "results", label: "Result", model: Result, adminTab: "results" },
  { kind: "admit-cards", label: "Admit Card", model: AdmitCard, adminTab: "admit-cards" },
  { kind: "answer-keys", label: "Answer Key", model: AnswerKey, adminTab: "answer-keys" },
  { kind: "admissions", label: "Admission", model: Admission, adminTab: "admissions" },
  { kind: "quizzes", label: "Mock Test", model: Quiz, adminTab: "quizzes" },
];
const DAYS = 30;

function publicUrl(kind: Kind, doc: { _id: unknown; title?: string }) {
  return kind === "quizzes" ? quizPath(doc) : detailPath(kind, doc);
}

/** Real counts and recent activity for the admin overview. Admin only; read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await connectToDatabase();
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const sinceId = mongoose.Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000));

    const perKind = await Promise.all(
      KINDS.map(async ({ kind, label, model, adminTab }) => {
        const [total, byStatus, daily, recent, updated] = await Promise.all([
          model.estimatedDocumentCount(),
          model.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
          // Creation date from the document id, which every collection has (their date fields differ).
          model.aggregate([
            { $match: { _id: { $gte: sinceId } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$_id" } } }, n: { $sum: 1 } } },
          ]),
          model.find().sort({ _id: -1 }).limit(8).select("title status").lean(),
          model.find({ updatedAt: { $exists: true } }).sort({ updatedAt: -1 }).limit(8).select("title status updatedAt").lean(),
        ]);
        const statuses = Object.fromEntries((byStatus as { _id: unknown; n: number }[]).map((s) => [String(s._id ?? "none"), s.n]));
        const toRow = (d: any, date: Date) => ({
          id: String(d._id),
          kind,
          label,
          title: String(d.title ?? "(untitled)"),
          status: String(d.status ?? "published"),
          date: date.toISOString(),
          url: publicUrl(kind, d),
          adminTab,
        });
        return {
          kind,
          label,
          total,
          statuses,
          daily: Object.fromEntries((daily as { _id: string; n: number }[]).map((d) => [d._id, d.n])),
          recent: (recent as any[]).map((d) => toRow(d, new mongoose.Types.ObjectId(String(d._id)).getTimestamp())),
          updated: (updated as any[]).map((d) => toRow(d, new Date(d.updatedAt))),
        };
      }),
    );

    const days: string[] = [];
    for (let i = DAYS - 1; i >= 0; i--) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
    const groups = await getCategoryGroups();

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totals: Object.fromEntries(perKind.map((k) => [k.kind, { label: k.label, total: k.total, statuses: k.statuses }])),
        drafts: perKind.reduce((n, k) => n + (k.statuses.draft ?? 0), 0),
        testSeriesPages: groups.length + groups.reduce((n, g) => n + g.subcategories.length, 0),
        activity: days.map((day) => ({ day, ...Object.fromEntries(perKind.map((k) => [k.kind, k.daily[day] ?? 0])) })),
        recent: perKind.flatMap((k) => k.recent).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
        updated: perKind.flatMap((k) => k.updated).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
        seo: auditSummary(),
      },
    });
  } catch (error) {
    console.error("Admin overview failed:", error);
    return NextResponse.json({ success: false, error: "Could not load dashboard data." }, { status: 500 });
  }
}
