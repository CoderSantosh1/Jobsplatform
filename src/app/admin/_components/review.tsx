"use client";
// Recording admin decisions on SEO recommendations (stored in the seoreviews collection). Approved redirects for post
// URLs are served live (see live-redirects.ts); every other decision is a record only.
import { useMemo, useState } from "react";
import { parsePostPath } from "@/lib/post-redirects";
import { Check, X } from "lucide-react";
import { Badge, type Tone } from "./ui";
import { Btn, adminPost, fmtDate, useAdminJson } from "./kit";

export type ReviewKind = "noindex" | "redirect" | "canonical";
export type Decision = "pending" | "approved" | "rejected";
export type Review = { _id: string; kind: ReviewKind; path: string; decision: Decision; target: string; note: string; decidedBy: string; updatedAt: string };

export function useReviews(kind: ReviewKind) {
  const res = useAdminJson<Review[]>(`/api/admin/seo/reviews?kind=${kind}`);
  const byPath = useMemo(() => new Map((res.data ?? []).map((r) => [r.path, r])), [res.data]);
  return { ...res, byPath };
}

const TONE: Record<Decision, Tone> = { pending: "slate", approved: "emerald", rejected: "rose" };

export function DecisionBadge({ review }: { review?: Review }) {
  if (!review) return <span className="text-xs text-slate-400">no decision</span>;
  return (
    <span title={`${review.decidedBy} · ${fmtDate(review.updatedAt)}${review.note ? ` · ${review.note}` : ""}`}>
      <Badge tone={TONE[review.decision]}>{review.decision}</Badge>
    </span>
  );
}

/**
 * Approve / reject buttons with an optional note (and target for redirects and canonicals).
 * Approve asks for confirmation first, because these are SEO-critical recommendations.
 */
export function DecisionControl({ kind, path, review, defaultTarget = "", needsTarget = false, onSaved }: {
  kind: ReviewKind;
  path: string;
  review?: Review;
  defaultTarget?: string;
  needsTarget?: boolean;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(review?.note ?? "");
  const [target, setTarget] = useState(review?.target || defaultTarget);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (decision: Decision) => {
    if (decision === "approved") {
      const what = kind === "noindex" ? "noindex" : kind === "redirect" ? `a redirect to ${target}` : `canonical ${target || path}`;
      const live = kind === "redirect" && parsePostPath(path) !== null;
      const effect = live
        ? "This post URL will 301-redirect on the live site within a few minutes, and the post leaves the lists and the sitemap. Withdraw the approval to undo it."
        : "This only saves your decision. The live site does not change until the site code is updated and deployed.";
      if (!window.confirm(`Record approval of ${what} for ${path}?\n\n${effect}`)) return;
    }
    setBusy(true);
    setError("");
    try {
      await adminPost("/api/admin/seo/reviews", { kind, path, decision, target, note });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {needsTarget && (
        <label className="block text-xs font-medium text-slate-600">
          {kind === "redirect" ? "Redirect to" : "Canonical URL path"}
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="/test-series/..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm text-slate-900"
          />
        </label>
      )}
      <label className="block text-xs font-medium text-slate-600">
        Note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900" />
      </label>
      <div className="flex flex-wrap gap-2">
        <Btn tone="primary" disabled={busy || (needsTarget && !target.trim())} onClick={() => save("approved")}>
          <Check className="h-4 w-4" /> Approve
        </Btn>
        <Btn tone="danger" disabled={busy} onClick={() => save("rejected")}>
          <X className="h-4 w-4" /> Reject
        </Btn>
        {review && review.decision !== "pending" && (
          <Btn disabled={busy} onClick={() => save("pending")}>
            Reset
          </Btn>
        )}
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {review && (
        <p className="text-xs text-slate-500">
          Last decision: {review.decision} by {review.decidedBy || "admin"} on {fmtDate(review.updatedAt)}
        </p>
      )}
    </div>
  );
}
