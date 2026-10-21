import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import PushSubscription from '@/lib/models/PushSubscription';
import PushNotificationLog from '@/lib/models/PushNotificationLog';
import PushPromptStat from '@/lib/models/PushPromptStat';
import { lastIstDays, promptRates, sumPromptCounts, summarizeDeliveries } from '@/lib/push-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_DAYS = 14;

/** Subscribers, opt-in popup funnel and notification delivery for the admin Notifications tab. Admin only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    await connectToDatabase();
    const now = Date.now();
    const days = lastIstDays(DAILY_DAYS, now);
    const last7 = new Set(days.slice(-7));

    const [total, new7d, new30d, active30d, newPerDay, promptRows, deliveryRows, history] = await Promise.all([
      PushSubscription.estimatedDocumentCount(),
      PushSubscription.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY_MS) } }),
      PushSubscription.countDocuments({ createdAt: { $gte: new Date(now - 30 * DAY_MS) } }),
      PushSubscription.countDocuments({ lastSeenAt: { $gte: new Date(now - 30 * DAY_MS) } }),
      PushSubscription.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: new Date(now - (DAILY_DAYS + 1) * DAY_MS) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
      ]),
      PushPromptStat.find({}).select('-_id -__v -createdAt -updatedAt').lean<Record<string, unknown>[]>(),
      PushNotificationLog.find({})
        .select('status subscriberCount successCount failureCount removedCount')
        .lean<Parameters<typeof summarizeDeliveries>[0]>(),
      PushNotificationLog.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .select('contentType contentId title url status sentBy subscriberCount successCount failureCount removedCount createdAt')
        .lean(),
    ]);

    const newByDay = new Map(newPerDay.map((d) => [d._id, d.count]));
    const promptByDay = new Map(promptRows.map((r) => [String(r.day), r]));
    const promptAll = sumPromptCounts(promptRows);
    const prompt7d = sumPromptCounts(promptRows.filter((r) => last7.has(String(r.day))));

    return NextResponse.json({
      success: true,
      data: {
        subscribers: { total, new7d, new30d, active30d },
        prompt: {
          allTime: { counts: promptAll, ...promptRates(promptAll) },
          last7d: { counts: prompt7d, ...promptRates(prompt7d) },
        },
        daily: days.map((day) => ({
          day,
          newSubscribers: newByDay.get(day) ?? 0,
          ...sumPromptCounts(promptByDay.has(day) ? [promptByDay.get(day)!] : []),
        })),
        deliveries: summarizeDeliveries(deliveryRows),
        history,
      },
    });
  } catch (error) {
    console.error('Error loading push stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to load push stats' }, { status: 500 });
  }
}
