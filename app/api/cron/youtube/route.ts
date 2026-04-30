import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { google } from "googleapis";
import { Readable } from "stream";

// This should be triggered by Vercel Cron or a similar tool
// e.g. GET /api/cron/youtube
export async function GET(request: Request) {
  try {
    // 1. Authenticate Cron Job
    // If using Vercel Cron, you should verify the auth header
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    await connectDB();

    // 2. Find pending schedules that are due
    const now = new Date();
    const pendingProjects = await Project.find({
      "youtube.status": "scheduled",
      "youtube.scheduledAt": { $lte: now },
    });

    if (pendingProjects.length === 0) {
      return NextResponse.json({ success: true, message: "No pending videos to upload" });
    }

    const results = [];

    // 3. Process each scheduled video
    for (const project of pendingProjects) {
      try {
        const user = await User.findById(project.userId);
        let targetRefreshToken = user.googleRefreshToken;
        let targetAccessToken = user.googleAccessToken;

        if (project.youtube?.channelId && user.youtubeChannels?.length > 0) {
          const channelInfo = user.youtubeChannels.find((c: any) => c.channelId === project.youtube!.channelId);
          if (channelInfo && channelInfo.refreshToken) {
            targetRefreshToken = channelInfo.refreshToken;
            targetAccessToken = channelInfo.accessToken;
          }
        }

        if (!targetRefreshToken) {
          throw new Error("User disconnected YouTube account or token missing");
        }

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
          refresh_token: targetRefreshToken,
          access_token: targetAccessToken,
        });

        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        const videoUrl = project.steps.render.videoUrl;
        let mediaStream;

        if (videoUrl.startsWith("http")) {
          const response = await fetch(videoUrl);
          if (!response.ok || !response.body) throw new Error("Failed to fetch video from remote URL");
          mediaStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
        } else {
          const fs = require("fs");
          const path = require("path");
          const filePath = path.join(process.cwd(), "public", videoUrl.startsWith("/") ? videoUrl : `/${videoUrl}`);
          if (!fs.existsSync(filePath)) throw new Error("Local video file not found");
          mediaStream = fs.createReadStream(filePath);
        }

        const res = await youtube.videos.insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: project.youtube?.title || project.title,
              description: project.youtube?.description || "",
              tags: project.youtube?.tags || [],
              categoryId: "22",
            },
            status: {
              privacyStatus: project.youtube?.visibility || "private",
              selfDeclaredMadeForKids: false,
            },
          },
          media: {
            body: mediaStream,
          },
        });

        if (res.data?.id) {
          project.youtube!.status = "published";
          project.youtube!.videoId = res.data.id;
          project.youtube!.error = "";
          results.push({ projectId: project._id, status: "success", videoId: res.data.id });
        } else {
          throw new Error("No video ID returned from YouTube");
        }
      } catch (err: any) {
        console.error(`[Cron] Error uploading project ${project._id}:`, err);
        project.youtube!.status = "failed";
        project.youtube!.error = err.message || "Unknown error";
        results.push({ projectId: project._id, status: "error", error: err.message });
      }

      project.markModified("youtube");
      await project.save();
    }

    return NextResponse.json({ success: true, processed: pendingProjects.length, results });

  } catch (error: any) {
    console.error("[Cron YouTube] Critical Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
