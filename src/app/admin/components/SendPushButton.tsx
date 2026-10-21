'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PUSH_BODY_MAX, PUSH_TITLE_MAX, type PushContentType } from '@/lib/push';

interface Preview {
  title: string;
  body: string;
  url: string;
  subscribers: number;
  lastSentAt: string | null;
  configured: boolean;
  envProblems?: string[];
}

interface SendPushButtonProps {
  type: PushContentType;
  id: string;
  status?: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Server error plus Firebase's own error detail, so the admin can see what is wrong. */
function errorText(json: { error?: string; detail?: string }, fallback: string): string {
  return [json.error || fallback, json.detail].filter(Boolean).join(' — ');
}

/** "Send push notification" action for one published item: preview, optional edits, explicit confirmation. */
export default function SendPushButton({ type, id, status }: SendPushButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [resend, setResend] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  if (status === 'draft') return null;

  const close = () => {
    if (sending) return;
    setOpen(false);
    setPreview(null);
    setError('');
    setResult('');
    setResend(false);
  };

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`/api/admin/push?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`, {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load preview');
      setPreview(json.data);
      setTitle(json.data.title);
      setBody(json.data.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load preview');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!preview) return;
    if (!confirm(`Send this notification to ${preview.subscribers} subscriber(s)? This cannot be undone.`)) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ type, id, title, body, resend }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setPreview({ ...preview, lastSentAt: json.lastSentAt ?? preview.lastSentAt });
        throw new Error('Already sent for this item. Tick "Send again" to resend.');
      }
      if (!res.ok) throw new Error(errorText(json, 'Failed to send notification'));
      const { successCount, failureCount, removedCount } = json.data;
      setResult(
        `Sent to ${successCount} browser(s).` +
          (failureCount ? ` ${failureCount} failed` : '') +
          (removedCount ? ` (${removedCount} expired subscription(s) removed).` : failureCount ? '.' : '')
      );
      setPreview({ ...preview, lastSentAt: new Date().toISOString() });
      setResend(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Not blocked on `configured`: sending anyway returns the server's exact configuration error.
  const blocked = !preview || !title.trim() || !body.trim() || (!!preview.lastSentAt && !resend);

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        Send push
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={close}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Send push notification</h3>

            {loading && <p className="mt-4 text-sm text-gray-500">Loading preview…</p>}

            {preview && (
              <div className="mt-4 space-y-4">
                {(!preview.configured || !!preview.envProblems?.length) && (
                  <div className="rounded bg-yellow-50 p-2 text-sm text-yellow-800">
                    <p>Firebase server setup looks incomplete:</p>
                    <ul className="ml-4 list-disc">
                      {(preview.envProblems?.length ? preview.envProblems : ['FIREBASE_* environment variables are missing']).map(
                        (problem) => (
                          <li key={problem}>{problem}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <label className="block text-sm font-medium">
                  Title
                  <input
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={title}
                    maxLength={PUSH_TITLE_MAX}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={sending}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Message
                  <textarea
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    rows={3}
                    value={body}
                    maxLength={PUSH_BODY_MAX}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={sending}
                  />
                </label>

                <div className="rounded border bg-gray-50 p-3">
                  <p className="text-xs uppercase text-gray-500">Preview</p>
                  <p className="mt-1 font-semibold">{title || '—'}</p>
                  <p className="text-sm text-gray-700">{body || '—'}</p>
                  <p className="mt-2 break-all text-xs text-blue-700">Opens: {preview.url}</p>
                </div>

                <p className="text-sm text-gray-600">Subscribers: {preview.subscribers}</p>

                {preview.lastSentAt && (
                  <label className="flex items-start gap-2 rounded bg-yellow-50 p-2 text-sm text-yellow-800">
                    <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} disabled={sending} />
                    <span>
                      Already sent on {new Date(preview.lastSentAt).toLocaleString()}. Send again anyway.
                    </span>
                  </label>
                )}
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {result && <p className="mt-4 text-sm text-green-700">{result}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={sending}>
                Close
              </Button>
              <Button onClick={send} disabled={blocked || sending}>
                {sending ? 'Sending…' : 'Send notification'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
