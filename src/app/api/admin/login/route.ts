import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!JWT_SECRET) {
    return NextResponse.json(
      { message: 'Server configuration error: JWT_SECRET is not set' },
      { status: 500 }
    );
  }

  console.log(`Attempting login with email: ${email}`);
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Long-lived so dashboard actions (including push notifications) keep working; log out to end it early.
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ token });
  }

  console.log(`ADMIN_EMAIL: ${ADMIN_EMAIL}, ADMIN_PASSWORD: ${ADMIN_PASSWORD}`);
  return NextResponse.json(
    { message: 'Invalid credentials' },
    { status: 401 }
  );
}