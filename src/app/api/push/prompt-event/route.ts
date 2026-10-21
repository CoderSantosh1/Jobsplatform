import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PushPromptStat from '@/lib/models/PushPromptStat';
import { istDay, isPushPromptEvent } from '@/lib/push-stats';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Public endpoint: the opt-in popup reports what the visitor did with it. Only a daily counter is incremented.
const allow = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const event = body && typeof body === 'object' ? (body as { event?: unknown }).event : undefined;
  if (!isPushPromptEvent(event)) {
    return NextResponse.json({ success: false, error: 'Invalid event' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await PushPromptStat.updateOne(
      { day: istDay(Date.now()) },
      { $inc: { [event]: 1 } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording push prompt event:', error);
    return NextResponse.json({ success: false, error: 'Failed to record event' }, { status: 500 });
  }
}
