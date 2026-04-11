import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type } = body;

    // Validate inputs
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

    // Connect to database
    await connectDB();

    // Create the project using the Mongoose model
    // The Mongoose schema's default values automatically handle:
    // - currentStep = "idea"
    // - status = "in-progress"
    // - step initialization (idea, hook, script, scenes, voice, video)
    const project = new Project({
      title,
      type,
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
