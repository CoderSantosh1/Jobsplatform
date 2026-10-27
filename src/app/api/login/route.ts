import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

// Slows down scripts that try many mobile numbers to find registered users and their names.
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

// Define User schema (same as register)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  mobile: { type: String, required: true, match: /^\d{10}$/ },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export async function POST(req: Request) {
  if (!allow(clientIp(req.headers))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }
  await connectToDatabase();
  const { mobile } = await req.json();

  // Validation
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ error: "Mobile number must be 10 digits." }, { status: 400 });
  }

  try {
    // Find user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return NextResponse.json({ 
        error: "No account found with this mobile number. Please register first." 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { _id: user._id, name: user.name, mobile: user.mobile } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
} 