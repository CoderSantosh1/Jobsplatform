import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Result from "@/lib/models/Result";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ---------------------------------------------
// GET /api/results/:id
// ---------------------------------------------
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id: resultId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const result = await Result.findById(resultId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/results/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch result details" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// DELETE /api/results/:id
// ---------------------------------------------
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id: resultId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const result = await Result.findByIdAndDelete(resultId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Result deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/results/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete result" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// PUT /api/results/:id  (UPDATE)
// ---------------------------------------------
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id: resultId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Normalize official websites (string OR array → array)
    if (body.officalwebsites !== undefined) {
      if (Array.isArray(body.officalwebsites)) {
        body.officalwebsites = body.officalwebsites
          .map((s: any) => String(s).trim())
          .filter(Boolean);
      } else {
        body.officalwebsites = String(body.officalwebsites)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Validate each official website URL
    const urlRegex = /^(https?):\/\/[^ "]+$/;
    if (body.officalwebsites) {
      for (const url of body.officalwebsites) {
        if (!urlRegex.test(url)) {
          return NextResponse.json(
            { success: false, error: `Invalid URL: ${url}` },
            { status: 400 }
          );
        }
      }
    }

    // Update timestamp
    body.updatedAt = new Date();

    const updatedResult = await Result.findByIdAndUpdate(resultId, body, {
      new: true,
    });

    if (!updatedResult) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedResult },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/results/[id]:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update result" },
      { status: 500 }
    );
  }
}
