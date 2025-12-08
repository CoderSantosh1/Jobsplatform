import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Result from "@/lib/models/Result";

// Make route dynamic for Vercel
export const dynamic = "force-dynamic";

// ---------------------------------------------
// POST — Create a new result
// ---------------------------------------------
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Convert string → array for official websites
    let websites: string[] = [];
    if (body.officalwebsites) {
      websites = String(body.officalwebsites)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const newResult = await Result.create({
      title: body.title,
      description: body.description,
      organization: body.organization,
      resultDate: body.resultDate,
      category: body.category,
      downloadLink: body.downloadLink,
      officalwebsites: websites,
      status: body.status || "draft",
    });

    return NextResponse.json(
      { success: true, data: newResult },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/results ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create result" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// GET — Fetch all results
// ---------------------------------------------
export async function GET() {
  try {
    await connectToDatabase();

    const results = await Result.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("GET /api/results ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
