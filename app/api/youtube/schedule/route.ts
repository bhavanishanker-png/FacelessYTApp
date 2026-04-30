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

    const { 
      projectId, 
      scheduledAtISO, 
      timezone, 
      title, 
      description, 
      tags, 
      visibility,
      channelId
    } = await request.json();

    if (!projectId || !scheduledAtISO) {
      return NextResponse.json({ error: "projectId and scheduledAtISO are required" }, { status: 400 });
    }

    await connectDB();
    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Ensure there is a rendered video
    if (!project.steps?.render?.videoUrl || project.steps.render.status !== "completed") {
      return NextResponse.json({ error: "Project must be fully rendered before scheduling" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAtISO);
    
    if (scheduledDate < new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
    }

    // Save schedule in DB
    project.youtube = {
      status: "scheduled",
      scheduledAt: scheduledDate,
      timezone: timezone || "UTC",
      channelId: channelId || "",
      videoId: "",
      title: title || project.title,
      description: description || "",
      tags: tags || [],
      visibility: visibility || "private",
      error: "",
    };

    project.markModified("youtube");
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Video scheduled successfully",
      youtube: project.youtube,
    });
  } catch (error: any) {
    console.error("[Schedule Upload] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
