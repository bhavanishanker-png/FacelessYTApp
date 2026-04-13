import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15+ App Router dynamic route params
) {
  try {
    // 1. Authenticate Request
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 2. Connect to Database
    await connectDB();

    // 3. Fetch specific project bounded to user session securely
    // This intrinsically ensures that a user cannot query another user's project ID natively
    const project = await Project.findOne({ _id: id, userId }).lean();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access" },
        { status: 404 }
      );
    }

    // 4. Return complete payload including all 11-steps recursively
    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    console.error("fetch-project API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
