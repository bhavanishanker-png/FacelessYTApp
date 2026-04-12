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

    const { projectId, hook } = await req.json();

    if (!projectId || !hook) {
      return NextResponse.json(
        { error: "Both projectId and hook are required." },
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
    project.steps.hook.editedHook = hook;
    project.steps.hook.selectedHook = hook;
    project.steps.hook.status = "approved";
    project.currentStep = "script";

    await project.save();

    return NextResponse.json(
      { message: "Hook saved successfully.", project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save Hook API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while saving the hook." },
      { status: 500 }
    );
  }
}
