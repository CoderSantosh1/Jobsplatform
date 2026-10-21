'use client';

/**
 * How a push notification looks on the visitor's device (Chrome on Android / desktop): site icon, site name,
 * title and message. Uses the same icon (/logo.png) and texts the server sends, so admins see what users see.
 */
export default function NotificationPreview({
  title,
  body,
  url,
  compact = false,
}: {
  title: string;
  body: string;
  url?: string;
  compact?: boolean;
}) {
  let host = 'sarkariresultsnow.com';
  try {
    if (url) host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // keep the default host
  }

  return (
    <div className={compact ? '' : 'rounded-lg bg-gray-100 p-3'}>
      {!compact && <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">How users will see it</p>}
      <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-full border bg-white object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="font-medium text-gray-700">Chrome</span>
            <span>·</span>
            <span className="truncate">{host}</span>
            <span>·</span>
            <span>now</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">{title.trim() || 'Notification title'}</p>
          <p className="line-clamp-3 text-sm text-gray-700">{body.trim() || 'Notification message'}</p>
        </div>
      </div>
      {!compact && url && <p className="mt-2 break-all text-xs text-blue-700">Opens: {url}</p>}
    </div>
  );
}
