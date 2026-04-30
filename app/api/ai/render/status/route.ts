/**
 * GET /api/ai/render/status?jobId=xxx
 *        or
 * GET /api/ai/render/status?projectId=xxx
 *
 * Polls the current render job progress.
 *
 * Returns:
 *   - jobId, status, progress (0–100), phase, videoUrl (on complete),
 *     durationSeconds, fileSizeBytes, elapsed time
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { renderStore } from "@/lib/renderStore";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function GET(request: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const projectId = searchParams.get("projectId");

    if (!jobId && !projectId) {
      return NextResponse.json({ error: "jobId or projectId query param is required" }, { status: 400 });
    }

    // 3. Try in-memory store first (active jobs)
    let job = jobId
      ? renderStore.get(jobId)
      : projectId
        ? renderStore.getByProject(projectId)
        : undefined;

    if (job) {
      const elapsed = Math.round((Date.now() - job.startedAt) / 1000);
      return NextResponse.json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        phase: job.phase,
        videoUrl: job.videoUrl || null,
        durationSeconds: job.durationSeconds || null,
        fileSizeBytes: job.fileSizeBytes || null,
        quality: job.quality,
        elapsedSeconds: elapsed,
        error: job.error || null,
      });
    }

    // 4. Fallback to MongoDB for completed/persisted renders
    if (projectId) {
      await connectDB();
      const project = await Project.findOne({ _id: projectId, userId });
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const render = project.steps?.render;
      if (render && render.status !== "pending") {
        return NextResponse.json({
          jobId: render.jobId || null,
          status: render.status,
          progress: render.status === "completed" ? 100 : render.progress || 0,
          phase: render.phase || (render.status === "completed" ? "Complete" : "Unknown"),
          videoUrl: render.videoUrl || null,
          durationSeconds: render.durationSeconds || null,
          fileSizeBytes: render.fileSizeBytes || null,
          quality: render.quality || "1080p",
          elapsedSeconds: null,
          error: render.error || null,
        });
      }
    }

    return NextResponse.json({
      jobId: jobId || null,
      status: "not_found",
      progress: 0,
      phase: "No active render",
      videoUrl: null,
    });

  } catch (error: any) {
    console.error("[/api/ai/render/status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
