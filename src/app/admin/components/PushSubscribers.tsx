'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminFetch } from '@/lib/admin-fetch';
import { subscriberDeliveryStatus } from '@/lib/push';

interface Subscriber {
  id: string;
  browser: string;
  subscribedAt: string | null;
  lastSeenAt: string | null;
  receivedCount: number;
  lastReceivedAt: string | null;
  lastFailedAt: string | null;
  lastError: string | null;
}

interface Page {
  total: number;
  page: number;
  pageSize: number;
  items: Subscriber[];
}

const when = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN') : '—');

/** Every subscribed browser: when it subscribed, when it was last seen, and whether the last notification arrived. */
export default function PushSubscribers() {
  const [data, setData] = useState<Page | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/push/subscribers?page=${p}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load subscribers');
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold">Subscribers</h2>
          <p className="text-sm text-gray-500">
            Each row is one browser that turned on exam alerts. Only an anonymous browser ID is stored.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Loading…</p>}
      {data && data.items.length === 0 && <p className="text-sm text-gray-500">No subscribers yet.</p>}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-2 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">Browser</th>
                  <th className="px-2 py-2 font-medium">Subscribed</th>
                  <th className="px-2 py-2 font-medium">Last seen on site</th>
                  <th className="px-2 py-2 text-right font-medium">Notifications received</th>
                  <th className="px-2 py-2 font-medium">Last notification</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s, i) => {
                  const status = subscriberDeliveryStatus(s);
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-2 py-2 tabular-nums text-gray-500">{(data.page - 1) * data.pageSize + i + 1}</td>
                      <td className="px-2 py-2 font-mono text-xs">{s.browser}</td>
                      <td className="whitespace-nowrap px-2 py-2">{when(s.subscribedAt)}</td>
                      <td className="whitespace-nowrap px-2 py-2">{when(s.lastSeenAt)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{s.receivedCount}</td>
                      <td className="px-2 py-2">
                        {status === 'received' && (
                          <span className="text-green-700">✓ Received · {when(s.lastReceivedAt)}</span>
                        )}
                        {status === 'failed' && (
                          <span className="text-red-700" title={s.lastError ?? undefined}>
                            ✗ Failed · {when(s.lastFailedAt)}
                            {s.lastError && <span className="block text-xs text-gray-500">{s.lastError}</span>}
                          </span>
                        )}
                        {status === 'none' && <span className="text-gray-400">Nothing sent yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {data.total} subscriber{data.total === 1 ? '' : 's'} · page {data.page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={loading || page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={loading || page >= pages}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
