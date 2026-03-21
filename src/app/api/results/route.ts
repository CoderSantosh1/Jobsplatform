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
    const downloadLink1 = body.downloadLink1 || body.downloadLink || "";
    const downloadLink2 = body.downloadLink2 || "";
    const downloadLink3 = body.downloadLink3 || "";

    // Convert string → array for official websites
    let websites: string[] = [];
    if (body.officalwebsites) {
      websites = String(body.officalwebsites)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Convert string → array for download notification
    let notifications: string[] = [];
    if (body.downloadnotificationresultlis) {
      notifications = String(body.downloadnotificationresultlis)
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
      downloadLink1,
      downloadLink2,
      downloadLink3,
      youtubeLink: body.youtubeLink,
      officalwebsites: websites,
      downloadnotificationresultlis: notifications,
      status: body.status || "draft",
    });

    // Ensure all fields are included in the response
    const processedResult = {
      _id: (newResult as any)._id,
      title: (newResult as any).title,
      description: (newResult as any).description,
      organization: (newResult as any).organization,
      resultDate: (newResult as any).resultDate,
      category: (newResult as any).category,
      downloadLink1: (newResult as any).downloadLink1 || (newResult as any).downloadLink || "",
      downloadLink2: (newResult as any).downloadLink2 || "",
      downloadLink3: (newResult as any).downloadLink3 || "",
      youtubeLink: (newResult as any).youtubeLink || "",
      officalwebsites: (newResult as any).officalwebsites || [],
      downloadnotificationresultlis: (newResult as any).downloadnotificationresultlis || [],
      status: (newResult as any).status,
      createdAt: (newResult as any).createdAt,
      updatedAt: (newResult as any).updatedAt,
      __v: (newResult as any).__v,
    };

    return NextResponse.json(
      { success: true, data: processedResult },
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

    const results = await Result.find().sort({ createdAt: -1 }).lean();

    // Ensure all fields are included in the response, even if empty
    const processedResults = results.map((result: any) => ({
      _id: result._id,
      title: result.title,
      description: result.description,
      organization: result.organization,
      resultDate: result.resultDate,
      category: result.category,
      downloadLink1: result.downloadLink1 || result.downloadLink || "",
      downloadLink2: result.downloadLink2 || "",
      downloadLink3: result.downloadLink3 || "",
      youtubeLink: result.youtubeLink || "",
      officalwebsites: result.officalwebsites || [],
      downloadnotificationresultlis: result.downloadnotificationresultlis || [],
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      __v: result.__v,
    }));

    return NextResponse.json({ success: true, data: processedResults });
  } catch (error) {
    console.error("GET /api/results ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
