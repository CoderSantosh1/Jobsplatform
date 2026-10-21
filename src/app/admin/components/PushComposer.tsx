'use client';

import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PUSH_BODY_MAX, PUSH_SITE_URL, PUSH_TITLE_MAX } from '@/lib/push';
import NotificationPreview from './NotificationPreview';
import PushPopupPreview from './PushPopupPreview';

interface HistoryItem {
  _id: string;
  contentType: string;
  title: string;
  body: string;
  url: string;
  status: string;
  successCount: number;
  failureCount: number;
  removedCount?: number;
  subscriberCount: number;
  sentBy?: string;
  createdAt: string;
}

interface Overview {
  subscribers: number;
  configured: boolean;
  envProblems?: string[];
  history: HistoryItem[];
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUS_CLASS: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

/**
 * Notifications tab: write and send a custom notification (with a device-style preview), see the subscribe popup
 * visitors get, and every notification sent so far with how many subscribers received it.
 */
export default function PushComposer() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [openRow, setOpenRow] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/push/custom', { headers: authHeaders(), cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load notifications');
      setOverview(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const destination = link.trim()
    ? link.trim().startsWith('/')
      ? `${PUSH_SITE_URL}${link.trim()}`
      : link.trim()
    : `${PUSH_SITE_URL}/`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }
    if (!confirm(`Send "${title.trim()}" now?`)) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/push/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, body, url: link }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error([json.error || 'Failed to send notification', json.detail].filter(Boolean).join(' — '));
      const { successCount, failureCount, removedCount } = json.data;
      setResult(
        `Sent to ${successCount} browser(s).` +
          (failureCount ? ` ${failureCount} failed` : '') +
          (removedCount ? ` (${removedCount} expired subscription(s) removed).` : failureCount ? '.' : '')
      );
      setTitle('');
      setBody('');
      setLink('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-lg">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Total subscribers</p>
          <p className="text-3xl font-semibold text-gray-900">{overview ? overview.subscribers : '…'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold">Send Push Notification</h2>

          {!!overview?.envProblems?.length && (
            <div className="mb-4 rounded bg-yellow-50 p-2 text-sm text-yellow-800">
              <p>Firebase server setup looks incomplete:</p>
              <ul className="ml-4 list-disc">
                {overview.envProblems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={send} className="space-y-4">
            <label className="block text-sm font-medium">
              Title <span className="text-gray-400">({title.length}/{PUSH_TITLE_MAX})</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={title}
                maxLength={PUSH_TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SSC CGL 2026 Notification Out"
                disabled={sending}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Message <span className="text-gray-400">({body.length}/{PUSH_BODY_MAX})</span>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                rows={3}
                value={body}
                maxLength={PUSH_BODY_MAX}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Check eligibility, important dates and apply online."
                disabled={sending}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Link (optional)
              <input
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/jobs or https://www.sarkariresultsnow.com/results/..."
                disabled={sending}
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Must be a page on this site. Leave empty to open the homepage.
              </span>
            </label>

            <NotificationPreview title={title} body={body} url={destination} />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && <p className="text-sm text-green-700">{result}</p>}

            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send notification'}
            </Button>
          </form>
        </div>

        <PushPopupPreview />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-2xl font-semibold">Sent Notifications</h2>
        <p className="mb-4 text-sm text-gray-500">Click a row to see the notification exactly as users got it.</p>
        {!overview ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : overview.history.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-2 py-2 font-medium">Sent at</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 text-right font-medium">Subscribers</th>
                  <th className="px-2 py-2 text-right font-medium">Received</th>
                  <th className="px-2 py-2 text-right font-medium">Failed</th>
                  <th className="px-2 py-2 text-right font-medium">Expired</th>
                </tr>
              </thead>
              <tbody>
                {overview.history.map((item) => (
                  <Fragment key={item._id}>
                    <tr
                      className="cursor-pointer border-b align-top hover:bg-gray-50"
                      onClick={() => setOpenRow(openRow === item._id ? null : item._id)}
                    >
                      <td className="whitespace-nowrap px-2 py-2">{new Date(item.createdAt).toLocaleString('en-IN')}</td>
                      <td className="whitespace-nowrap px-2 py-2">{item.contentType === 'custom' ? 'Custom' : item.contentType}</td>
                      <td className="px-2 py-2">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        {item.sentBy && <span className="block text-xs text-gray-500">by {item.sentBy}</span>}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[item.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{item.subscriberCount}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-green-700">{item.successCount}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-red-700">{item.failureCount}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{item.removedCount ?? 0}</td>
                    </tr>
                    {openRow === item._id && (
                      <tr className="border-b bg-gray-50">
                        <td colSpan={8} className="px-2 py-3">
                          <div className="max-w-md">
                            <NotificationPreview title={item.title} body={item.body} url={item.url} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
