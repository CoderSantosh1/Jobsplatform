import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';
import { isValidFid } from '@/lib/push';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Public endpoint: a browser registers (or removes) its own Firebase Installation ID. It cannot send anything.
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

async function readFid(request: Request): Promise<string | null> {
  const body = await request.json().catch(() => null);
  const fid = body && typeof body === 'object' ? (body as { fid?: unknown }).fid : undefined;
  return isValidFid(fid) ? fid : null;
}

export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }
  const fid = await readFid(request);
  if (!fid) {
    return NextResponse.json({ success: false, error: 'Invalid subscription' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await PushSubscription.updateOne(
      { fid },
      { $set: { lastSeenAt: new Date() }, $setOnInsert: { fid } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }
  const fid = await readFid(request);
  if (!fid) {
    return NextResponse.json({ success: false, error: 'Invalid subscription' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await PushSubscription.deleteOne({ fid });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove subscription' }, { status: 500 });
  }
}
