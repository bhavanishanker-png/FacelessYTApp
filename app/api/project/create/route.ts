import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(request: Request) {
  try {
    // 1. Auth check — userId is required by the schema
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const { title, type } = body;

    // 2. Validate inputs
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing title" },
        { status: 400 }
      );
    }

    if (!["shorts", "long"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'shorts' or 'long'" },
        { status: 400 }
      );
    }

    // 3. Connect and create project with userId
    await connectDB();

    const project = new Project({
      title,
      type,
      userId,
    });

    const savedProject = await project.save();

    return NextResponse.json(savedProject, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
