"use client";

import { ShieldCheck, UserRound, Users } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton, StatCard } from "../_components/ui";
import { Note, Table, fmtDate, useAdminJson } from "../_components/kit";

type Data = {
  loginAdmin: { email: string; source: string };
  currentEmail: string;
  stored: { id: string; email: string; name: string; role: string; createdAt: string | null; canLogIn: boolean }[];
  siteUsers: { total: number; last30Days: number };
};

export default function AdminUsers() {
  const { data, error, loading, reload } = useAdminJson<Data>("/api/admin/users");

  return (
    <>
      <PageHeader title="Admin Users" subtitle="Who can sign in to this admin panel, and how many students have site accounts." />
      <Note>
        Admin sign-in uses the ADMIN_EMAIL and ADMIN_PASSWORD settings of the server. To change the admin, update those settings in
        your hosting dashboard (Vercel / Netlify) and redeploy. Passwords are never shown here.
      </Note>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Admins who can sign in" value={1} icon={ShieldCheck} />
            <StatCard label="Student accounts" value={data.siteUsers.total.toLocaleString("en-IN")} icon={Users} tone="blue" />
            <StatCard label="New students (30 days)" value={data.siteUsers.last30Days.toLocaleString("en-IN")} icon={UserRound} tone="emerald" />
          </div>
          <Card title="Admin accounts">
            <Table head={["Email", "Name", "Role", "Source", "Can sign in"]}>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-900">
                  {data.loginAdmin.email}
                  {data.loginAdmin.email.toLowerCase() === data.currentEmail.toLowerCase() && <Badge tone="indigo">you</Badge>}
                </td>
                <td className="px-5 py-3 text-slate-500">—</td>
                <td className="px-5 py-3">
                  <Badge tone="violet">Administrator</Badge>
                </td>
                <td className="px-5 py-3 text-slate-600">{data.loginAdmin.source}</td>
                <td className="px-5 py-3">
                  <Badge tone="emerald">yes</Badge>
                </td>
              </tr>
              {data.stored.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3 text-slate-900">{a.email}</td>
                  <td className="px-5 py-3 text-slate-600">{a.name}</td>
                  <td className="px-5 py-3">
                    <Badge>{a.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">Database record · {fmtDate(a.createdAt)}</td>
                  <td className="px-5 py-3">{a.canLogIn ? <Badge tone="emerald">yes</Badge> : <Badge tone="slate">no (not used by sign-in)</Badge>}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
