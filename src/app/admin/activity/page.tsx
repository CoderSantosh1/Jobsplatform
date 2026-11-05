"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, FilePlus2, PencilLine, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton, type Tone } from "../_components/ui";
import { Btn, Note, SelectBox, fmtDate } from "../_components/kit";

type Event = { at: string; type: "created" | "updated" | "push" | "seo-review"; kind: string; title: string; detail: string; actor: string | null; link: string | null };

const TYPES: Record<Event["type"], { label: string; icon: LucideIcon; tone: Tone }> = {
  created: { label: "Created", icon: FilePlus2, tone: "emerald" },
  updated: { label: "Updated", icon: PencilLine, tone: "blue" },
  push: { label: "Push sent", icon: Bell, tone: "violet" },
  "seo-review": { label: "SEO decision", icon: ShieldCheck, tone: "amber" },
};
const TONE_CLS: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  indigo: "bg-indigo-50 text-indigo-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function ActivityLogs() {
  const [type, setType] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (before: string | null, append: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/activity?type=${type}${before ? `&before=${encodeURIComponent(before)}` : ""}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Could not load activity.");
      setEvents((e) => (append ? [...e, ...json.data.events] : json.data.events));
      setNext(json.data.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Group by calendar day for easier scanning.
  const days = new Map<string, Event[]>();
  for (const e of events) {
    const day = new Date(e.at).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    days.set(day, [...(days.get(day) ?? []), e]);
  }

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="Posts created and updated, push notifications sent and SEO decisions, newest first."
        actions={
          <SelectBox
            label="Type"
            value={type}
            onChange={setType}
            options={[{ value: "", label: "All activity" }, ...Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label }))]}
          />
        }
      />
      <Note>
        Built from the records themselves. Posts do not store who edited them, so content events show no person; push notifications
        and SEO decisions show the admin who made them.
      </Note>
      {error && <ErrorState message={error} onRetry={() => load(null, false)} />}
      {loading && !events.length && <Skeleton className="h-96" />}
      {!loading && !error && !events.length && (
        <Card>
          <EmptyState message="No activity yet." />
        </Card>
      )}
      <div className="space-y-6">
        {[...days.entries()].map(([day, list]) => (
          <Card key={day} title={day}>
            <ol className="space-y-4">
              {list.map((e, i) => {
                const t = TYPES[e.type];
                return (
                  <li key={`${e.at}-${i}`} className="flex gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_CLS[t.tone]}`}>
                      <t.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{t.label}</span> · <span className="text-slate-500">{e.kind}</span>
                      </p>
                      <p className="truncate text-sm text-slate-700" title={e.title}>
                        {e.link ? (
                          <Link href={e.link} className="hover:text-indigo-700 hover:underline">
                            {e.title}
                          </Link>
                        ) : (
                          e.title
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {e.detail}
                        {e.actor ? ` · by ${e.actor}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        ))}
      </div>
      {next && (
        <div className="mt-6 text-center">
          <Btn onClick={() => load(next, true)} disabled={loading}>
            {loading ? "Loading…" : `Load older (before ${fmtDate(next)})`}
          </Btn>
        </div>
      )}
    </>
  );
}
