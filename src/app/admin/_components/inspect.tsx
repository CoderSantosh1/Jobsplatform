"use client";
// Client helpers for the page inspector API (/api/admin/seo/inspect): fetch one page and read its SEO tags.
import { useState } from "react";
import { ScanSearch } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import type { PageSeo } from "@/lib/admin-seo-checks";
import { Btn, SelectBox } from "./kit";

export type Inspected = PageSeo & { url: string };
export type InspectTarget = "live" | "local";
export type InspectOutcome = { ok: true; page: Inspected } | { ok: false; error: string };

export async function inspect(path: string, target: InspectTarget): Promise<InspectOutcome> {
  try {
    const res = await adminFetch(`/api/admin/seo/inspect?path=${encodeURIComponent(path)}&target=${target}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) return { ok: false, error: json?.error || `Failed (${res.status})` };
    return { ok: true, page: json.data };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export const TARGETS = [
  { value: "live", label: "Live site" },
  { value: "local", label: "This server" },
];

/** A path box plus "Inspect" button. */
export function InspectForm({ onResult, initial = "/", busyLabel = "Inspecting…" }: {
  onResult: (path: string, outcome: InspectOutcome) => void;
  initial?: string;
  busyLabel?: string;
}) {
  const [path, setPath] = useState(initial);
  const [target, setTarget] = useState<InspectTarget>("live");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    let p = path.trim();
    // Accept a full URL of this site too.
    try {
      if (/^https?:\/\//i.test(p)) {
        const u = new URL(p);
        p = u.pathname + u.search;
      }
    } catch {
      // keep as typed; the API validates it
    }
    if (!p.startsWith("/")) p = `/${p}`;
    setBusy(true);
    onResult(p, await inspect(p, target));
    setBusy(false);
  };

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <label className="flex-1">
        <span className="sr-only">Page path or URL</span>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/jobs or https://www.sarkariresultsnow.com/jobs"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <SelectBox label="Check on" value={target} onChange={(v) => setTarget(v as InspectTarget)} options={TARGETS} />
      <Btn type="submit" tone="primary" disabled={busy}>
        <ScanSearch className="h-4 w-4" /> {busy ? busyLabel : "Inspect"}
      </Btn>
    </form>
  );
}
