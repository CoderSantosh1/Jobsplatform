// Opt-in popup counters and delivery totals for the admin Push Stats panel.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPromptCounts,
  isPushPromptEvent,
  istDay,
  lastIstDays,
  percent,
  promptRates,
  PUSH_PROMPT_EVENT_LABELS,
  PUSH_PROMPT_EVENTS,
  sumPromptCounts,
  summarizeDeliveries,
} from "../../src/lib/push-stats.ts";

test("only known popup events are accepted", () => {
  for (const e of PUSH_PROMPT_EVENTS) assert.equal(isPushPromptEvent(e), true, e);
  for (const bad of ["", "SHOWN", "subscribe", "__proto__", "$inc", 1, null, undefined, {}]) {
    assert.equal(isPushPromptEvent(bad), false, String(bad));
  }
  assert.deepEqual(Object.keys(PUSH_PROMPT_EVENT_LABELS).sort(), [...PUSH_PROMPT_EVENTS].sort());
});

test("istDay uses India time (UTC+5:30)", () => {
  assert.equal(istDay(Date.UTC(2026, 9, 20, 18, 29)), "2026-10-20"); // 23:59 IST
  assert.equal(istDay(Date.UTC(2026, 9, 20, 18, 30)), "2026-10-21"); // 00:00 IST
  assert.equal(istDay(new Date(Date.UTC(2026, 0, 1))), "2026-01-01");
});

test("lastIstDays lists consecutive days, oldest first, ending today", () => {
  const days = lastIstDays(3, Date.UTC(2026, 2, 1, 6)); // 1 Mar 2026, 11:30 IST
  assert.deepEqual(days, ["2026-02-27", "2026-02-28", "2026-03-01"]);
});

test("sumPromptCounts adds rows and ignores junk", () => {
  const total = sumPromptCounts([
    { day: "2026-10-20", shown: 10, enabled: 2, notNow: 3, closed: 1 },
    { day: "2026-10-21", shown: 5, blocked: 1, failed: "x", extra: 99 },
    {},
  ]);
  assert.deepEqual(total, { ...emptyPromptCounts(), shown: 15, enabled: 2, notNow: 3, closed: 1, blocked: 1 });
});

test("rates are a share of popups shown, and empty when nothing was shown", () => {
  const c = { ...emptyPromptCounts(), shown: 20, enabled: 5, notNow: 6, closed: 4, blocked: 1 };
  assert.deepEqual(promptRates(c), { enableRate: 25, closeRate: 50, blockRate: 5 });
  assert.deepEqual(promptRates(emptyPromptCounts()), { enableRate: null, closeRate: null, blockRate: null });
  assert.equal(percent(1, 3), 33);
});

test("summarizeDeliveries totals sent notifications", () => {
  const summary = summarizeDeliveries([
    { status: "sent", subscriberCount: 10, successCount: 8, failureCount: 2, removedCount: 1 },
    { status: "sent", subscriberCount: 10, successCount: 10, failureCount: 0, removedCount: 0 },
    { status: "failed" },
  ]);
  assert.deepEqual(summary, { notifications: 3, sent: 2, delivered: 18, failed: 2, removed: 1, deliveryRate: 90 });
  assert.equal(summarizeDeliveries([]).deliveryRate, null);
});
