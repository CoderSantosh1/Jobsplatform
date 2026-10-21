'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PUSH_BODY_MAX, PUSH_SITE_URL, PUSH_TITLE_MAX } from '@/lib/push';
import { missingPushPublicEnv } from '@/lib/push-config';

interface HistoryItem {
  _id: string;
  contentType: string;
  title: string;
  body: string;
  url: string;
  status: string;
  successCount: number;
  failureCount: number;
  subscriberCount: number;
  createdAt: string;
}

interface Overview {
  subscribers: number;
  configured: boolean;
  missingEnv?: string[];
  history: HistoryItem[];
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Lets the admin write a notification (title, message, link) and send it to all subscribers at any time. */
export default function PushComposer() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

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

  const serverMissing = overview?.missingEnv ?? (overview && !overview.configured ? ['FIREBASE_* server variables'] : []);
  const publicMissing = missingPushPublicEnv();

  // Shown under the button so it is clear why it cannot be clicked.
  const disabledReason = sending
    ? 'Sending…'
    : !overview
      ? error
        ? 'Could not load push status (see the error above). Try logging in again.'
        : 'Loading push status…'
      : !overview.configured
        ? `Sending is disabled until the server Firebase variables are set: ${serverMissing.join(', ')}.`
        : !title.trim()
          ? 'Enter a title.'
          : !body.trim()
            ? 'Enter a message.'
            : '';

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult('');
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }
    const count = overview?.subscribers ?? 0;
    if (!confirm(`Send "${title.trim()}" to ${count} subscriber(s) now? This cannot be undone.`)) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/push/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, body, url: link }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to send notification');
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-2">Send Push Notification</h2>
        <p className="text-sm text-gray-600 mb-6">
          Write a message and send it to everyone who enabled exam alerts.
          {overview && <> Subscribers: <strong>{overview.subscribers}</strong></>}
        </p>

        {(serverMissing.length > 0 || publicMissing.length > 0) && (
          <div className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-medium">Push is not fully set up. Add these exact names in Vercel → Settings → Environment Variables (Production), then redeploy:</p>
            <ul className="mt-2 list-disc pl-5 font-mono text-xs">
              {[...serverMissing, ...publicMissing].map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            {publicMissing.length > 0 && (
              <p className="mt-2 text-xs">
                NEXT_PUBLIC_* values are built into the site, so visitors cannot subscribe until a new deployment runs after adding them.
              </p>
            )}
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

          <div className="rounded border bg-gray-50 p-3">
            <p className="text-xs uppercase text-gray-500">Preview</p>
            <p className="mt-1 font-semibold">{title.trim() || 'Notification title'}</p>
            <p className="text-sm text-gray-700">{body.trim() || 'Notification message'}</p>
            <p className="mt-2 break-all text-xs text-blue-700">Opens: {destination}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && <p className="text-sm text-green-700">{result}</p>}

          <Button type="submit" disabled={!!disabledReason}>
            {sending ? 'Sending…' : 'Send notification'}
          </Button>
          {disabledReason && !sending && <p className="text-xs text-gray-500">{disabledReason}</p>}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Recently Sent</h2>
        {!overview ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : overview.history.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-3">
            {overview.history.map((item) => (
              <li key={item._id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs ${
                      item.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.body}</p>
                <p className="mt-1 break-all text-xs text-blue-700">{item.url}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()} · {item.contentType === 'custom' ? 'Custom message' : item.contentType} ·
                  {' '}delivered {item.successCount}/{item.subscriberCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
