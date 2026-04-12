import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, idea } = await req.json();

    if (!projectId || !idea) {
      return NextResponse.json(
        { error: "Both projectId and idea are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
      _id: projectId,
      userId: (session.user as any).id,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized to edit." },
        { status: 404 }
      );
    }

    // Update Project Document
    project.steps.idea.userSelected = idea;
    project.steps.idea.status = "approved";
    project.currentStep = "hook";

    await project.save();

    return NextResponse.json(
      { message: "Idea saved successfully.", project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save Idea API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while saving the idea." },
      { status: 500 }
    );
  }
}
