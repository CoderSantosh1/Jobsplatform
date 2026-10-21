'use client';

import { useState } from 'react';
import PushOptInCard, { type PushOptInStatus } from '@/components/PushOptInCard';
import { PUSH_DISMISS_COOLDOWN_MS, pushErrorMessage } from '@/lib/push-prompt';

const STATES: { id: PushOptInStatus; label: string; message?: string }[] = [
  { id: 'prompt', label: 'Popup' },
  { id: 'working', label: 'Enabling…' },
  { id: 'done', label: 'Subscribed', message: "Done! You'll get alerts for new jobs, results and admit cards." },
  { id: 'error', label: 'Blocked', message: pushErrorMessage({ code: 'messaging/permission-blocked' }) },
];

const COOLDOWN_DAYS = Math.round(PUSH_DISMISS_COOLDOWN_MS / (24 * 60 * 60 * 1000));

/** The real "Get exam alerts" popup, shown in place so the admin can see every state visitors can reach. */
export default function PushPopupPreview() {
  const [state, setState] = useState<PushOptInStatus>('prompt');
  const [open, setOpen] = useState(true);
  const current = STATES.find((s) => s.id === state)!;

  const show = (id: PushOptInStatus) => {
    setState(id);
    setOpen(true);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-1 text-2xl font-semibold">Subscribe Popup</h2>
      <p className="mb-4 text-sm text-gray-500">What visitors see on the site. Try each state; buttons here do nothing real.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => show(s.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              open && state === s.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-[190px] items-end rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
        {open ? (
          <PushOptInCard
            inline
            status={state}
            message={current.message}
            onEnable={() => show('working')}
            onNotNow={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        ) : (
          <div className="w-full text-center text-sm text-gray-500">
            <p>Popup closed. The visitor won&apos;t see it again for {COOLDOWN_DAYS} days.</p>
            <button type="button" onClick={() => show('prompt')} className="mt-2 text-blue-700 hover:underline">
              Show again
            </button>
          </div>
        )}
      </div>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-gray-500">
        <li>Appears 3 seconds after a visitor opens any page (never on admin pages).</li>
        <li>&quot;Not now&quot; or ✕ hides it for {COOLDOWN_DAYS} days on that browser.</li>
        <li>Not shown to visitors who already subscribed or blocked notifications.</li>
      </ul>
    </div>
  );
}
