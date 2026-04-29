/**
 * POST /api/project/idea/generate
 *
 * AI-powered idea generation for a project.
 * Calls Claude, stores raw AI output in MongoDB,
 * and returns the ideas to the frontend.
 *
 * Body: { projectId: string, topic: string }
 * Returns: { success: true, data: IdeaOutput } | { success: false, error: string }
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { askAIJSON, IDEA_SYSTEM_PROMPT } from "@/lib/ai";
import type { IdeaOutput } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── Input ─────────────────────────────────────────────────
    const { projectId, topic } = await req.json();
    if (!projectId || !topic) {
      return NextResponse.json(
        { success: false, error: "projectId and topic are required." },
        { status: 400 }
      );
    }

    // ── DB Lookup ─────────────────────────────────────────────
    await connectDB();
    const project = await Project.findOne({
      _id: projectId,
      userId: (session.user as any).id,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found or unauthorized." },
        { status: 404 }
      );
    }

    // ── AI Call ───────────────────────────────────────────────
    const result = await askAIJSON<IdeaOutput>({
      systemPrompt: IDEA_SYSTEM_PROMPT,
      userMessage: `Generate 5 faceless YouTube video ideas about: "${topic}"\n\nVideo type: ${project.type}`,
      maxTokens: 1500, // from skill token limits
      temperature: 0.8,
    });

    if (!result.success) {
      // Surface rate-limit info to the client
      const status = result.code === "RATE_LIMITED" ? 429 : 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          retryAfterMs: result.retryAfterMs,
        },
        { status }
      );
    }

    // ── Persist to MongoDB ────────────────────────────────────
    project.steps.idea.aiOutput = JSON.stringify(result.data);
    project.steps.idea.status = "editing";
    await project.save();

    // ── Response ──────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: result.data,
        usage: result.usage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[idea/generate] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
