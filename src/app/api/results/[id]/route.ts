import { NextResponse } from "next/server";
import { idFromParam } from '@/lib/slug';
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

    const resultId = idFromParam((await context.params).id);

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const result = await Result.findById(resultId).lean();

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    // Ensure all fields are included in the response, even if empty
    const processedResult = {
      _id: (result as any)._id,
      title: (result as any).title,
      description: (result as any).description,
      organization: (result as any).organization,
      resultDate: (result as any).resultDate,
      category: (result as any).category,
      downloadLink1: (result as any).downloadLink1 || (result as any).downloadLink || "",
      downloadLink2: (result as any).downloadLink2 || "",
      downloadLink3: (result as any).downloadLink3 || "",
      youtubeLink: (result as any).youtubeLink || "",
      officalwebsites: (result as any).officalwebsites || [],
      downloadnotificationresultlis: (result as any).downloadnotificationresultlis || [],
      status: (result as any).status,
      createdAt: (result as any).createdAt,
      updatedAt: (result as any).updatedAt,
      __v: (result as any).__v,
    };

    return NextResponse.json({ success: true, data: processedResult }, { status: 200 });
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
    body.downloadLink1 = body.downloadLink1 || body.downloadLink || "";
    body.downloadLink2 = body.downloadLink2 || "";
    body.downloadLink3 = body.downloadLink3 || "";

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

    // Normalize download notification (string OR array → array)
    if (body.downloadnotificationresultlis !== undefined) {
      if (Array.isArray(body.downloadnotificationresultlis)) {
        body.downloadnotificationresultlis = body.downloadnotificationresultlis
          .map((s: any) => String(s).trim())
          .filter(Boolean);
      } else {
        body.downloadnotificationresultlis = String(body.downloadnotificationresultlis)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
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

    // Ensure all fields are included in the response
    const processedResult = {
      _id: (updatedResult as any)._id,
      title: (updatedResult as any).title,
      description: (updatedResult as any).description,
      organization: (updatedResult as any).organization,
      resultDate: (updatedResult as any).resultDate,
      category: (updatedResult as any).category,
      downloadLink1: (updatedResult as any).downloadLink1 || (updatedResult as any).downloadLink || "",
      downloadLink2: (updatedResult as any).downloadLink2 || "",
      downloadLink3: (updatedResult as any).downloadLink3 || "",
      youtubeLink: (updatedResult as any).youtubeLink || "",
      officalwebsites: (updatedResult as any).officalwebsites || [],
      downloadnotificationresultlis: (updatedResult as any).downloadnotificationresultlis || [],
      status: (updatedResult as any).status,
      createdAt: (updatedResult as any).createdAt,
      updatedAt: (updatedResult as any).updatedAt,
      __v: (updatedResult as any).__v,
    };

    return NextResponse.json(
      { success: true, data: processedResult },
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
