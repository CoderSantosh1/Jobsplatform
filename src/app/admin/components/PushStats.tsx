'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminFetch } from '@/lib/admin-fetch';
import {
  percent,
  PUSH_PROMPT_EVENT_LABELS,
  PUSH_PROMPT_EVENTS,
  type PushPromptCounts,
} from '@/lib/push-stats';

interface PromptSummary {
  counts: PushPromptCounts;
  enableRate: number | null;
  closeRate: number | null;
  blockRate: number | null;
}

interface HistoryRow {
  _id: string;
  contentType: string;
  title: string;
  url: string;
  status: string;
  sentBy: string;
  subscriberCount: number;
  successCount: number;
  failureCount: number;
  removedCount: number;
  createdAt: string;
}

interface Stats {
  subscribers: { total: number; new7d: number; new30d: number; active30d: number };
  prompt: { allTime: PromptSummary; last7d: PromptSummary };
  daily: ({ day: string; newSubscribers: number } & PushPromptCounts)[];
  deliveries: {
    notifications: number;
    sent: number;
    delivered: number;
    failed: number;
    removed: number;
    deliveryRate: number | null;
  };
  history: HistoryRow[];
}

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const statusClass: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  sending: 'bg-gray-100 text-gray-800',
};

/** Subscribers, opt-in popup funnel and per-notification delivery, at the top of the admin Notifications tab. */
export default function PushStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/push/stats', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load push stats');
      setStats(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load push stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mb-8 space-y-6">
      <div className="rounded-lg bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Push Stats</h2>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!stats && !error && <p className="mt-2 text-sm text-gray-500">Loading…</p>}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total subscribers" value={stats.subscribers.total} hint={`${stats.subscribers.active30d} seen in last 30 days`} />
            <StatCard label="New subscribers" value={stats.subscribers.new7d} hint={`last 7 days · ${stats.subscribers.new30d} in 30 days`} />
            <StatCard label="Notifications sent" value={stats.deliveries.sent} hint={`${stats.deliveries.notifications} attempted`} />
            <StatCard
              label="Delivery rate"
              value={pct(stats.deliveries.deliveryRate)}
              hint={`${stats.deliveries.delivered} delivered · ${stats.deliveries.failed} failed · ${stats.deliveries.removed} expired removed`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-1 text-lg font-semibold">&quot;Get exam alerts&quot; popup</h3>
              <p className="mb-4 text-xs text-gray-500">How visitors respond to the subscribe popup. Counted per browser action, no visitor data stored.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-2 py-2 font-medium">Action</th>
                    <th className="px-2 py-2 text-right font-medium">Last 7 days</th>
                    <th className="px-2 py-2 text-right font-medium">All time</th>
                  </tr>
                </thead>
                <tbody>
                  {PUSH_PROMPT_EVENTS.map((event) => (
                    <tr key={event} className="border-b last:border-0">
                      <td className="px-2 py-2">{PUSH_PROMPT_EVENT_LABELS[event]}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{stats.prompt.last7d.counts[event]}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{stats.prompt.allTime.counts[event]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  ['Enabled', stats.prompt.allTime.enableRate, 'text-green-700'],
                  ['Closed / Not now', stats.prompt.allTime.closeRate, 'text-gray-700'],
                  ['Blocked', stats.prompt.allTime.blockRate, 'text-red-700'],
                ].map(([label, rate, color]) => (
                  <div key={label as string} className="rounded border bg-gray-50 p-2">
                    <p className={`text-lg font-semibold ${color}`}>{pct(rate as number | null)}</p>
                    <p className="text-xs text-gray-500">{label as string} (of shown)</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">Last 14 days</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="px-2 py-2 font-medium">Day</th>
                      <th className="px-2 py-2 text-right font-medium">Shown</th>
                      <th className="px-2 py-2 text-right font-medium">Enabled</th>
                      <th className="px-2 py-2 text-right font-medium">Closed</th>
                      <th className="px-2 py-2 text-right font-medium">Blocked</th>
                      <th className="px-2 py-2 text-right font-medium">New subs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.daily].reverse().map((d) => (
                      <tr key={d.day} className="border-b last:border-0">
                        <td className="px-2 py-1.5 whitespace-nowrap">{d.day}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.shown}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.enabled}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.notNow + d.closed}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.blocked}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.newSubscribers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Notification delivery</h3>
            {stats.history.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="px-2 py-2 font-medium">Sent at</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Title</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 text-right font-medium">Subscribers</th>
                      <th className="px-2 py-2 text-right font-medium">Delivered</th>
                      <th className="px-2 py-2 text-right font-medium">Failed</th>
                      <th className="px-2 py-2 text-right font-medium">Removed</th>
                      <th className="px-2 py-2 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.history.map((row) => (
                      <tr key={row._id} className="border-b align-top last:border-0">
                        <td className="px-2 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-IN')}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{row.contentType === 'custom' ? 'Custom' : row.contentType}</td>
                        <td className="px-2 py-2">
                          <a href={row.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                            {row.title}
                          </a>
                          <p className="text-xs text-gray-500">by {row.sentBy}</p>
                        </td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass[row.status] ?? statusClass.sending}`}>{row.status}</span>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">{row.subscriberCount}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-green-700">{row.successCount}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-red-700">{row.failureCount}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{row.removedCount}</td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {pct(percent(row.successCount, row.successCount + row.failureCount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
