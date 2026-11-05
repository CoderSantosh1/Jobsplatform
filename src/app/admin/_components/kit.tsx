"use client";
// Shared admin-only helpers for data pages: loading a JSON API, search box, selects, pager, tables.
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

export function useAdminJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || `Request failed (${res.status})`);
      setData(json.data as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}

/** POST JSON to an admin API; resolves with `data` or throws the API's error message. */
export async function adminPost<T>(url: string, body: unknown): Promise<T> {
  const res = await adminFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error || `Request failed (${res.status})`);
  return json.data as T;
}

export function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block min-w-[200px] flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

export function SelectBox({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return <p className="mt-4 text-xs text-slate-500">{total.toLocaleString("en-IN")} items</p>;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {total.toLocaleString("en-IN")} items · page {page + 1} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          type="button"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Note({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "indigo" }) {
  const cls = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
  }[tone];
  return (
    <div className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-5 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {empty ? (
            <tr>
              <td colSpan={head.length} className="px-5 py-10 text-center text-slate-500">
                Nothing matches.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Btn({ children, onClick, disabled, tone = "default", type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
  type?: "button" | "submit";
}) {
  const cls = {
    default: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  }[tone];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${cls}`}>
      {children}
    </button>
  );
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Run `task` over items with limited concurrency, reporting each result as it finishes. */
export async function runPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>, onResult: (item: T, result: R) => void, stop?: () => boolean) {
  let i = 0;
  const worker = async () => {
    while (i < items.length && !stop?.()) {
      const item = items[i++];
      onResult(item, await task(item));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export function download(name: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function csv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((r) => r.map((v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(",")).join("\n");
}
