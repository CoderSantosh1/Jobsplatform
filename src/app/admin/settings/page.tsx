"use client";

import { CheckCircle2, Database, Globe, Server, XCircle } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton, StatCard } from "../_components/ui";
import { Note, Table, useAdminJson } from "../_components/kit";

type Data = {
  site: { name: string; url: string; titleMax: number };
  env: { name: string; group: string; use: string; required: boolean; set: boolean }[];
  pushPublicMissing: string[];
  deployment: { host: string; environment: string; commit: string | null; branch: string | null; region: string | null; node: string };
  database: { ok: boolean; ms: number | null; name: string | null; collections: { name: string; count: number | null }[]; error?: string };
};

export default function SiteSettings() {
  const { data, error, loading, reload } = useAdminJson<Data>("/api/admin/settings");
  const missingRequired = data?.env.filter((e) => e.required && !e.set) ?? [];

  return (
    <>
      <PageHeader title="Site Settings" subtitle="Configuration status of this deployment. Values are never shown, only whether each setting is present." />
      <Note>
        Settings live in your hosting dashboard (Vercel / Netlify → Environment variables), not in the database, so they are changed
        there and take effect after a redeploy. Browser settings (NEXT_PUBLIC_…) are built into the site at build time.
      </Note>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-96" />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Site" value={data.site.name} hint={data.site.url} icon={Globe} />
            <StatCard label="Hosting" value={data.deployment.host} hint={[data.deployment.environment, data.deployment.branch, data.deployment.commit].filter(Boolean).join(" · ")} icon={Server} tone="violet" />
            <StatCard
              label="Database"
              value={data.database.ok ? "Connected" : "Unreachable"}
              hint={data.database.ok ? `${data.database.name} · ping ${data.database.ms} ms` : data.database.error}
              icon={Database}
              tone={data.database.ok ? "emerald" : "rose"}
            />
            <StatCard
              label="Required settings"
              value={missingRequired.length ? `${missingRequired.length} missing` : "All set"}
              hint={missingRequired.map((e) => e.name).join(", ") || `Node ${data.deployment.node}`}
              icon={missingRequired.length ? XCircle : CheckCircle2}
              tone={missingRequired.length ? "rose" : "emerald"}
            />
          </div>

          <Card title="Environment settings">
            <Table head={["Setting", "Area", "Used for", "Status"]}>
              {data.env.map((e) => (
                <tr key={e.name}>
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-800">
                    {e.name}
                    {e.required && <span className="ml-1 text-rose-600">*</span>}
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">{e.group}</td>
                  <td className="px-5 py-2.5 text-slate-600">{e.use}</td>
                  <td className="px-5 py-2.5">{e.set ? <Badge tone="emerald">set</Badge> : <Badge tone={e.required ? "rose" : "amber"}>missing</Badge>}</td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-xs text-slate-500">
              * required. Push notifications in browsers: {data.pushPublicMissing.length ? `not configured (missing ${data.pushPublicMissing.join(", ")})` : "configured"}.
            </p>
          </Card>

          <Card title="Database collections">
            {data.database.ok ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.database.collections.map((c) => (
                  <div key={c.name} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="font-mono text-xs text-slate-500">{c.name}</p>
                    <p className="text-lg font-semibold tabular-nums text-slate-900">{c.count?.toLocaleString("en-IN") ?? "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-rose-700">{data.database.error}</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
