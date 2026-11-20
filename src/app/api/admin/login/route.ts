import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getMissingAdminLoginConfig, resolveAdminLoginConfig } from '@/lib/admin-login-config';

// Slows down password guessing: 5 attempts per IP every 15 minutes (per server instance).
const allow = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

/** Constant-time comparison, so response timing doesn't reveal how much of the value matched. */
function sameSecret(given: unknown, expected: string | undefined): boolean {
  if (typeof given !== 'string' || !expected) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!allow(clientIp(req.headers))) {
    return NextResponse.json({ message: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 });
  }

  const { email, password } = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  // Cloudflare bindings are request-scoped. Read them directly in the Worker; normal
  // Next.js development has no Cloudflare context and uses its local process.env.
  let workerEnv: { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string; JWT_SECRET?: string } = {};
  let runtimeContextAvailable = false;
  try {
    // Async mode also resolves the request-scoped binding context in Node-based
    // Next/OpenNext runtimes, while production Workers return their active context.
    workerEnv = (await getCloudflareContext({ async: true })).env as typeof workerEnv;
    runtimeContextAvailable = true;
  } catch (error) {
    // Local Next.js runtime without OpenNext's Cloudflare dev context.
    // Keep diagnostics useful without logging exception text or any secret values.
    console.warn('[admin-login] Cloudflare runtime context unavailable', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } = resolveAdminLoginConfig(workerEnv, process.env);
  const missingConfig = getMissingAdminLoginConfig({ ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET });

  if (missingConfig.length > 0) {
    console.error('[admin-login] Required server configuration is missing', {
      missing: missingConfig,
      runtimeContextAvailable,
    });
  }
  if (!JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: 'Server configuration error: admin login is not set up' },
      { status: 500 }
    );
  }

  // Both checks always run, so timing doesn't reveal whether the email was right.
  const emailOk = sameSecret(typeof email === 'string' ? email.trim().toLowerCase() : email, ADMIN_EMAIL.trim().toLowerCase());
  const passwordOk = sameSecret(password, ADMIN_PASSWORD);
  if (emailOk && passwordOk) {
    // Long-lived so dashboard actions (including push notifications) keep working; log out to end it early.
    const token = jwt.sign({ email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ token });
  }

  return NextResponse.json(
    { message: 'Invalid credentials' },
    { status: 401 }
  );
}
