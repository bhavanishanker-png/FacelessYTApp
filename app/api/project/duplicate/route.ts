import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    await connectDB();

    // Find the original project (ownership scoped)
    const original = await Project.findOne({ _id: projectId, userId }).lean();

    if (!original) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access" },
        { status: 404 }
      );
    }

    // Clone the project with a new title, reset status
    const clone: any = { ...original };
    delete clone._id;
    delete clone.__v;
    clone.title = `${original.title} (Copy)`;
    clone.createdAt = new Date();
    clone.updatedAt = new Date();

    const duplicated = new Project(clone);
    const saved = await duplicated.save();

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error("duplicate-project API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
