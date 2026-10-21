// Opt-in popup events and push statistics for the admin dashboard. Pure functions, so unit tests can load this file directly.

/** What happened to the "Get exam alerts" popup. Stored only as daily counters; nothing about the visitor is kept. */
export const PUSH_PROMPT_EVENTS = ["shown", "enabled", "notNow", "closed", "blocked", "ignored", "failed"] as const;
export type PushPromptEvent = (typeof PUSH_PROMPT_EVENTS)[number];
export type PushPromptCounts = Record<PushPromptEvent, number>;

export const PUSH_PROMPT_EVENT_LABELS: Record<PushPromptEvent, string> = {
  shown: "Popup shown",
  enabled: "Enabled (subscribed)",
  notNow: 'Clicked "Not now"',
  closed: "Closed with X",
  blocked: "Blocked in browser",
  ignored: "Browser prompt dismissed",
  failed: "Error while enabling",
};

export function isPushPromptEvent(value: unknown): value is PushPromptEvent {
  return typeof value === "string" && (PUSH_PROMPT_EVENTS as readonly string[]).includes(value);
}

export function emptyPromptCounts(): PushPromptCounts {
  return Object.fromEntries(PUSH_PROMPT_EVENTS.map((e) => [e, 0])) as PushPromptCounts;
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** Calendar day in India (YYYY-MM-DD), so a day's counters match what the admin sees on the clock. */
export function istDay(time: number | Date): string {
  const ms = typeof time === "number" ? time : time.getTime();
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The last `days` IST days ending today, oldest first. */
export function lastIstDays(days: number, now: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(istDay(now - i * 24 * 60 * 60 * 1000));
  return out;
}

/** Adds up daily counter rows (missing fields count as 0). */
export function sumPromptCounts(rows: Partial<Record<string, unknown>>[]): PushPromptCounts {
  const total = emptyPromptCounts();
  for (const row of rows) {
    for (const e of PUSH_PROMPT_EVENTS) {
      const n = Number(row[e]);
      if (Number.isFinite(n) && n > 0) total[e] += n;
    }
  }
  return total;
}

/** Share of `part` in `whole` as a whole percentage, or null when nothing happened yet. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export function promptRates(c: PushPromptCounts) {
  return {
    enableRate: percent(c.enabled, c.shown),
    closeRate: percent(c.notNow + c.closed, c.shown),
    blockRate: percent(c.blocked, c.shown),
  };
}

/** Totals over sent notifications (per-item and custom). */
export function summarizeDeliveries(
  logs: { status?: string; subscriberCount?: number; successCount?: number; failureCount?: number; removedCount?: number }[]
) {
  let delivered = 0;
  let failed = 0;
  let removed = 0;
  let attempted = 0;
  let sent = 0;
  for (const log of logs) {
    if (log.status === "sent") sent += 1;
    delivered += log.successCount ?? 0;
    failed += log.failureCount ?? 0;
    removed += log.removedCount ?? 0;
    attempted += (log.successCount ?? 0) + (log.failureCount ?? 0);
  }
  return { notifications: logs.length, sent, delivered, failed, removed, deliveryRate: percent(delivered, attempted) };
}
